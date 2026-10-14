import { booleanAttribute, Component, input, output } from '@angular/core';

/** Painel modal com cabeçalho, corpo projetado e rodapé opcional (`<div modal-footer>`). */
@Component({
  selector: 'app-modal',
  host: { '(document:keydown.escape)': 'fechar.emit()' },
  template: `
    <div class="modal-backdrop" (click)="fechar.emit()"></div>
    <section class="modal" [class.modal--wide]="largo()" role="dialog" aria-modal="true" [attr.aria-label]="titulo()">
      <header class="modal-header">
        <div>
          <h2>{{ titulo() }}</h2>
          @if (subtitulo()) {
            <p class="muted">{{ subtitulo() }}</p>
          }
        </div>
        <button type="button" class="icon-btn" aria-label="Fechar" (click)="fechar.emit()">
          <i class="icon-x"></i>
        </button>
      </header>
      <div class="modal-body">
        <ng-content />
      </div>
      <footer class="modal-footer">
        <ng-content select="[modal-footer]" />
      </footer>
    </section>
  `,
})
export class ModalComponent {
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string>();
  readonly largo = input(false, { transform: booleanAttribute });
  readonly fechar = output<void>();
}
