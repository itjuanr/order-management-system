import { CurrencyPipe } from '@angular/common';
import { Component, computed, ElementRef, inject, Injectable, signal, viewChild, effect } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { debounced } from '../core/debounced';
import { Cliente, Pedido, Produto } from '../core/models';

@Injectable({ providedIn: 'root' })
export class BuscaRapidaService {
  readonly aberta = signal(false);
}

interface Resultado {
  grupo: string;
  icone: string;
  titulo: string;
  meta?: string;
  link: string;
  params?: Record<string, string | number>;
}

interface ResultadoBusca {
  clientes: Cliente[];
  produtos: Produto[];
  pedido: Pedido | null;
}

const PAGINAS: Resultado[] = [
  { grupo: 'Ir para', icone: 'icon-layout-dashboard', titulo: 'Visão geral', link: '/dashboard' },
  { grupo: 'Ir para', icone: 'icon-receipt', titulo: 'Pedidos', link: '/pedidos' },
  { grupo: 'Ir para', icone: 'icon-plus', titulo: 'Novo pedido', link: '/pedidos/novo' },
  { grupo: 'Ir para', icone: 'icon-users', titulo: 'Clientes', link: '/clientes' },
  { grupo: 'Ir para', icone: 'icon-package', titulo: 'Produtos', link: '/produtos' },
  { grupo: 'Ir para', icone: 'icon-tags', titulo: 'Categorias', link: '/categorias' },
  { grupo: 'Ir para', icone: 'icon-truck', titulo: 'Fornecedores', link: '/fornecedores' },
];

/** Paleta de busca (Ctrl/⌘ K): páginas, pedidos por número, clientes e produtos. */
@Component({
  selector: 'app-busca-rapida',
  host: { '(document:keydown)': 'atalho($event)' },
  template: `
    @if (servico.aberta()) {
      <div class="modal-backdrop" (click)="fechar()"></div>
      <div class="palette" role="dialog" aria-modal="true" aria-label="Busca rápida">
        <div class="palette-input">
          <i class="icon-search"></i>
          <input #campo type="text" placeholder="Buscar pedidos, clientes, produtos…" autocomplete="off"
            [value]="termo()" (input)="digitar($any($event.target).value)" (keydown)="navegar($event)"
            role="combobox" aria-controls="palette-resultados" [attr.aria-activedescendant]="'palette-' + ativo()" />
          <kbd>Esc</kbd>
        </div>

        <ul class="palette-results" id="palette-resultados" role="listbox">
          @for (r of resultados(); track $index; let i = $index) {
            @if (i === 0 || resultados()[i - 1].grupo !== r.grupo) {
              <li class="palette-group" role="presentation">{{ r.grupo }}</li>
            }
            <li role="option" [id]="'palette-' + i" [attr.aria-selected]="i === ativo()">
              <button type="button" class="palette-item" [class.is-active]="i === ativo()"
                (mouseenter)="ativo.set(i)" (click)="abrir(r)">
                <i [class]="r.icone"></i>
                <span class="palette-item-text">{{ r.titulo }}</span>
                @if (r.meta) {
                  <span class="palette-item-meta">{{ r.meta }}</span>
                }
              </button>
            </li>
          } @empty {
            <li class="palette-empty">
              {{ busca.isLoading() ? 'Buscando…' : 'Nada encontrado para "' + termo() + '".' }}
            </li>
          }
        </ul>

        <div class="palette-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
          <span><kbd>Enter</kbd> abrir</span>
        </div>
      </div>
    }
  `,
})
export class BuscaRapidaComponent {
  protected servico = inject(BuscaRapidaService);
  private api = inject(ApiService);
  private router = inject(Router);
  private moeda = new CurrencyPipe('pt-BR', 'BRL');

  private campo = viewChild<ElementRef<HTMLInputElement>>('campo');

  protected termo = signal('');
  private termoAtrasado = debounced(this.termo, 200);
  protected ativo = signal(0);

  protected busca = rxResource<ResultadoBusca, string>({
    params: () => this.termoAtrasado().trim(),
    stream: ({ params: termo }) => {
      const vazio: ResultadoBusca = { clientes: [], produtos: [], pedido: null };
      if (termo.length < 2) {
        return of(vazio);
      }
      const numero = Number(termo.replace('#', ''));
      return forkJoin({
        clientes: this.api.clientes({ busca: termo, size: 4 }).pipe(
          map((p) => p.content),
          catchError(() => of([] as Cliente[])),
        ),
        produtos: this.api.produtos({ busca: termo, size: 4 }).pipe(
          map((p) => p.content),
          catchError(() => of([] as Produto[])),
        ),
        pedido:
          Number.isInteger(numero) && numero > 0
            ? this.api.pedido(numero).pipe(catchError(() => of(null)))
            : of(null),
      });
    },
  });

  protected resultados = computed<Resultado[]>(() => {
    const termo = this.termo().trim().toLowerCase();
    const paginas = PAGINAS.filter((p) => !termo || p.titulo.toLowerCase().includes(termo));
    const dados = this.busca.value();
    if (!termo || !dados) {
      return paginas;
    }
    const lista: Resultado[] = [...paginas];
    if (dados.pedido) {
      const p = dados.pedido;
      lista.push({ grupo: 'Pedidos', icone: 'icon-receipt', titulo: `Pedido #${p.id} · ${p.cliente.nome}`,
        meta: this.moeda.transform(p.total) ?? '', link: `/pedidos/${p.id}` });
    }
    for (const c of dados.clientes) {
      lista.push({ grupo: 'Clientes', icone: 'icon-user', titulo: c.nome, meta: 'Ver pedidos', link: '/pedidos', params: { clienteId: c.id } });
    }
    for (const p of dados.produtos) {
      lista.push({ grupo: 'Produtos', icone: 'icon-package', titulo: p.nome, meta: p.sku, link: '/produtos', params: { busca: p.sku } });
    }
    return lista;
  });

  constructor() {
    effect(() => {
      if (this.servico.aberta()) {
        queueMicrotask(() => this.campo()?.nativeElement.focus());
      }
    });
  }

  atalho(evento: KeyboardEvent): void {
    if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'k') {
      evento.preventDefault();
      this.servico.aberta() ? this.fechar() : this.servico.aberta.set(true);
    } else if (evento.key === 'Escape' && this.servico.aberta()) {
      this.fechar();
    }
  }

  digitar(valor: string): void {
    this.termo.set(valor);
    this.ativo.set(0);
  }

  navegar(evento: KeyboardEvent): void {
    const total = this.resultados().length;
    if (evento.key === 'ArrowDown') {
      evento.preventDefault();
      this.ativo.update((i) => (i + 1) % Math.max(total, 1));
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault();
      this.ativo.update((i) => (i - 1 + total) % Math.max(total, 1));
    } else if (evento.key === 'Enter') {
      const r = this.resultados()[this.ativo()];
      if (r) {
        this.abrir(r);
      }
    }
  }

  abrir(r: Resultado): void {
    this.router.navigate([r.link], { queryParams: r.params });
    this.fechar();
  }

  fechar(): void {
    this.servico.aberta.set(false);
    this.termo.set('');
    this.ativo.set(0);
  }
}
