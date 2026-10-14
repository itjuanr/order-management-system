import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmService } from '../core/confirm.service';
import { ToastService } from '../core/toast.service';

/** Toasts e diálogo de confirmação globais; montado uma vez no componente raiz. */
@Component({
  selector: 'app-overlays',
  imports: [RouterLink],
  template: `
    <div class="toasts" aria-live="polite">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="toast" [attr.data-tipo]="toast.tipo">
          <i [class]="icones[toast.tipo]"></i>
          @if (toast.link) {
            <a class="toast-link" [routerLink]="toast.link" (click)="toasts.fechar(toast.id)">{{ toast.mensagem }}</a>
          } @else {
            <span>{{ toast.mensagem }}</span>
          }
          <button type="button" class="icon-btn" aria-label="Fechar aviso" (click)="toasts.fechar(toast.id)">
            <i class="icon-x"></i>
          </button>
        </div>
      }
    </div>

    @if (confirm.atual(); as c) {
      <div class="modal-backdrop" (click)="confirm.responder(false)"></div>
      <section class="modal modal--confirm" role="alertdialog" aria-modal="true" [attr.aria-label]="c.titulo"
        (document:keydown.escape)="confirm.responder(false)">
        <h2>{{ c.titulo }}</h2>
        <p class="muted">{{ c.mensagem }}</p>
        <div class="confirm-actions">
          <button type="button" class="btn btn-secondary" (click)="confirm.responder(false)">Voltar</button>
          <button type="button" class="btn" [class.btn-danger]="c.perigo" [class.btn-primary]="!c.perigo"
            (click)="confirm.responder(true)">
            {{ c.confirmar ?? 'Confirmar' }}
          </button>
        </div>
      </section>
    }
  `,
})
export class OverlaysComponent {
  protected toasts = inject(ToastService);
  protected confirm = inject(ConfirmService);
  protected readonly icones = { sucesso: 'icon-circle-check', erro: 'icon-circle-alert', info: 'icon-bell' };
}
