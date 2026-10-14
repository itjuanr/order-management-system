import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AoVivoService } from '../core/ao-vivo.service';
import { AuthService } from '../core/auth.service';
import { ConfirmService } from '../core/confirm.service';
import { MARCA } from '../core/marca';
import { ThemeService } from '../core/theme.service';
import { LogoComponent } from '../shared/logo.component';
import { BuscaRapidaComponent, BuscaRapidaService } from './busca-rapida.component';
import { NotificacoesComponent } from './notificacoes.component';
import { RodapeComponent } from './rodape.component';

interface ItemMenu {
  rotulo: string;
  link: string;
  icone: string;
}

const NOMES_DE_ROTA: Record<string, string> = {
  dashboard: 'Visão geral',
  pedidos: 'Pedidos',
  novo: 'Novo pedido',
  clientes: 'Clientes',
  produtos: 'Produtos',
  categorias: 'Categorias',
  fornecedores: 'Fornecedores',
  perfil: 'Meu perfil',
};

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent, BuscaRapidaComponent, RodapeComponent, NotificacoesComponent],
  host: { '(document:click)': 'fecharPerfilSeFora($event)', '(document:keydown.escape)': 'perfilAberto.set(false)' },
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  protected auth = inject(AuthService);
  protected tema = inject(ThemeService);
  protected busca = inject(BuscaRapidaService);
  protected aoVivo = inject(AoVivoService);
  private confirm = inject(ConfirmService);
  private router = inject(Router);

  protected readonly marca = MARCA;
  protected readonly atalho = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘K' : 'Ctrl K';
  protected menuAberto = signal(false);
  protected perfilAberto = signal(false);
  protected cargo = computed(() => (this.auth.role() === 'ADMIN' ? 'Administrador' : 'Operador'));

  protected readonly grupos: { titulo?: string; itens: ItemMenu[] }[] = [
    {
      itens: [
        { rotulo: 'Visão geral', link: '/dashboard', icone: 'icon-layout-dashboard' },
        { rotulo: 'Pedidos', link: '/pedidos', icone: 'icon-receipt' },
        { rotulo: 'Clientes', link: '/clientes', icone: 'icon-users' },
      ],
    },
    {
      titulo: 'Catálogo',
      itens: [
        { rotulo: 'Produtos', link: '/produtos', icone: 'icon-package' },
        { rotulo: 'Categorias', link: '/categorias', icone: 'icon-tags' },
        { rotulo: 'Fornecedores', link: '/fornecedores', icone: 'icon-truck' },
      ],
    },
  ];

  private url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /** Ex.: /pedidos/278 → Pedidos › #278 */
  protected migalhas = computed(() => {
    const segmentos = this.url().split('?')[0].split('/').filter(Boolean);
    return segmentos.map((segmento, i) => ({
      rotulo: NOMES_DE_ROTA[segmento] ?? (/^\d+$/.test(segmento) ? `#${segmento}` : 'Detalhes'),
      link: '/' + segmentos.slice(0, i + 1).join('/'),
      atual: i === segmentos.length - 1,
    }));
  });

  fecharPerfilSeFora(evento: MouseEvent): void {
    if (!(evento.target as HTMLElement | null)?.closest('.profile')) {
      this.perfilAberto.set(false);
    }
  }

  async sair(): Promise<void> {
    this.perfilAberto.set(false);
    const ok = await this.confirm.pedir({
      titulo: 'Sair da sua conta?',
      mensagem: 'Você vai precisar entrar novamente para acessar a loja.',
      confirmar: 'Sair',
    });
    if (ok) {
      this.auth.logout();
    }
  }
}
