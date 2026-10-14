import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { mensagemDeErro } from '../../core/api-errors';
import { AoVivoService } from '../../core/ao-vivo.service';
import { ApiService } from '../../core/api.service';
import { debounced } from '../../core/debounced';
import { METODO_PAGAMENTO, STATUS_ORDEM, STATUS_PEDIDO } from '../../core/labels';
import { StatusPedido } from '../../core/models';
import { PaginadorComponent } from '../../shared/paginador.component';
import { StatusBadgeComponent } from '../../shared/status-badge.component';

const TAMANHO = 15;

@Component({
  selector: 'app-pedidos-page',
  imports: [CurrencyPipe, DatePipe, RouterLink, StatusBadgeComponent, PaginadorComponent],
  templateUrl: './pedidos.page.html',
})
export class PedidosPage {
  private api = inject(ApiService);
  protected router = inject(Router);
  protected readonly statusInfo = STATUS_PEDIDO;
  protected readonly metodos = METODO_PAGAMENTO;
  protected readonly abas: (StatusPedido | '')[] = ['', ...STATUS_ORDEM];
  protected readonly tamanho = TAMANHO;

  /** Filtros que vivem na URL (?status=PAGO&clienteId=3) para poderem ser linkados do dashboard e dos clientes. */
  readonly status = input<StatusPedido | ''>('');
  readonly clienteId = input<string>();

  protected busca = signal('');
  private buscaAtrasada = debounced(this.busca);
  protected pagina = signal(0);

  protected cliente = rxResource({
    params: () => (this.clienteId() ? Number(this.clienteId()) : null),
    stream: ({ params: id }) => (id ? this.api.cliente(id) : of(null)),
  });

  protected pedidos = rxResource({
    params: () => ({
      status: (this.status() || '') as StatusPedido | '',
      clienteId: this.clienteId() ? Number(this.clienteId()) : null,
      busca: this.buscaAtrasada(),
      page: this.pagina(),
      size: TAMANHO,
    }),
    stream: ({ params }) => this.api.pedidos(params),
  });

  protected erro = computed(() => (this.pedidos.error() ? mensagemDeErro(this.pedidos.error()) : null));

  private aoVivo = inject(AoVivoService);

  constructor() {
    effect(() => {
      if (this.aoVivo.pulso() > 0) {
        untracked(() => this.pedidos.reload());
      }
    });
  }

  filtrar(mudancas: { status?: StatusPedido | ''; clienteId?: null }): void {
    const queryParams: Record<string, string | null> = {};
    if ('status' in mudancas) {
      queryParams['status'] = mudancas.status || null;
    }
    if ('clienteId' in mudancas) {
      queryParams['clienteId'] = null;
    }
    this.pagina.set(0);
    this.router.navigate([], {
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  buscar(valor: string): void {
    this.busca.set(valor);
    this.pagina.set(0);
  }
}
