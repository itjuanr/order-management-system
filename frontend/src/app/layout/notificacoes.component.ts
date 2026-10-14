import { Component, ElementRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ICONE_ATIVIDADE } from '../core/labels';
import { NotificacoesService } from '../core/notificacoes.service';
import { TempoRelativoPipe } from '../shared/formatos';

@Component({
  selector: 'app-notificacoes',
  imports: [RouterLink, TempoRelativoPipe],
  host: {
    class: 'notif',
    '(document:click)': 'fecharSeFora($event)',
    '(document:keydown.escape)': 'aberto.set(false)',
  },
  template: `
    <button type="button" class="icon-btn notif-trigger" (click)="alternar()" aria-haspopup="dialog"
      [attr.aria-expanded]="aberto()"
      [attr.aria-label]="servico.naoLidas() ? servico.naoLidas() + ' notificações não lidas' : 'Notificações'">
      <i class="icon-bell"></i>
      @if (servico.naoLidas()) {
        <span class="notif-count">{{ servico.naoLidas() > 9 ? '9+' : servico.naoLidas() }}</span>
      }
    </button>

    @if (aberto()) {
      <div class="notif-panel" role="dialog" aria-label="Notificações">
        <header class="notif-head">
          <strong>Notificações</strong>
          @if (servico.naoLidas()) {
            <button type="button" class="btn btn-ghost btn-sm" (click)="servico.marcarTodasComoLidas()">
              <i class="icon-check-check"></i> Marcar como lidas
            </button>
          }
        </header>

        @if (servico.notificacoes().length) {
          <ol class="notif-list">
            @for (n of servico.notificacoes(); track n.id) {
              <li>
                <a class="notif-item" [class.is-unread]="!servico.foiLida(n)" [routerLink]="['/pedidos', n.pedidoId]"
                  (click)="aberto.set(false)">
                  <span class="notif-icon" [attr.data-tipo]="n.tipo"><i [class]="icones[n.tipo]"></i></span>
                  <span class="notif-text">
                    <span>{{ n.descricao }}</span>
                    <span class="cell-meta">{{ n.quando | tempoRelativo }} · {{ n.autor === 'Simulador' ? 'simulação' : '@' + n.autor }}</span>
                  </span>
                </a>
              </li>
            }
          </ol>
        } @else {
          <div class="notif-empty">
            <i class="icon-bell-off"></i>
            <span>Nenhuma notificação por enquanto. Pedidos criados por outras pessoas ou pela simulação aparecem aqui.</span>
          </div>
        }

        <footer class="notif-prefs">
          <label class="check">
            <input type="checkbox" [checked]="servico.preferencias().avisosNaTela"
              (change)="servico.alterarPreferencia('avisosNaTela', $any($event.target).checked)" />
            Avisos na tela
          </label>
          @if (servico.permissaoNavegador() !== 'indisponivel') {
            <label class="check" [title]="servico.permissaoNavegador() === 'denied' ? 'Bloqueado nas configurações do navegador' : ''">
              <input type="checkbox" [checked]="servico.preferencias().navegador && servico.permissaoNavegador() === 'granted'"
                [disabled]="servico.permissaoNavegador() === 'denied'"
                (change)="servico.alterarPreferencia('navegador', $any($event.target).checked)" />
              Notificar com a aba em segundo plano
            </label>
          }
        </footer>
      </div>
    }
  `,
})
export class NotificacoesComponent {
  protected servico = inject(NotificacoesService);
  protected aberto = signal(false);
  protected readonly icones = ICONE_ATIVIDADE;
  private el = inject<ElementRef<HTMLElement>>(ElementRef);

  fecharSeFora(evento: MouseEvent): void {
    if (!this.el.nativeElement.contains(evento.target as Node)) {
      this.aberto.set(false);
    }
  }

  alternar(): void {
    this.aberto.update((v) => !v);
  }
}
