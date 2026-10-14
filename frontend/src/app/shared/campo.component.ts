import { booleanAttribute, Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { of, switchMap } from 'rxjs';

/**
 * Rótulo + campo projetado + mensagem de erro (do validador local ou vinda da API).
 * Uso: <app-campo rotulo="Nome" [controle]="form.controls.nome"><input …></app-campo>
 */
@Component({
  selector: 'app-campo',
  template: `
    <label class="field" [class.field--invalid]="erro()">
      <span class="field-label">
        {{ rotulo() }}
        @if (opcional()) {
          <span class="field-optional">opcional</span>
        }
      </span>
      <ng-content />
      @if (erro(); as mensagem) {
        <span class="field-error">{{ mensagem }}</span>
      } @else if (dica()) {
        <span class="field-hint">{{ dica() }}</span>
      }
    </label>
  `,
})
export class CampoComponent {
  readonly rotulo = input.required<string>();
  readonly controle = input<AbstractControl | null>(null);
  readonly opcional = input(false, { transform: booleanAttribute });
  readonly dica = input<string>();

  // Controles de formulário não são signals: este evento força o recálculo do erro
  // quando o valor, o status ou o "touched" mudam (ex.: markAllAsTouched no submit).
  private readonly evento = toSignal(
    toObservable(this.controle).pipe(switchMap((c) => (c ? c.events : of(null)))),
  );

  readonly erro = computed(() => {
    this.evento();
    const c = this.controle();
    if (!c?.errors || !c.touched) {
      return null;
    }
    const e = c.errors;
    if (e['servidor']) return e['servidor'] as string;
    if (e['required']) return 'Campo obrigatório';
    if (e['email']) return 'Email inválido';
    if (e['minlength']) return `Mínimo de ${e['minlength'].requiredLength} caracteres`;
    if (e['maxlength']) return `Máximo de ${e['maxlength'].requiredLength} caracteres`;
    if (e['min']) return `Valor mínimo: ${e['min'].min}`;
    if (e['pattern']) return 'Formato inválido';
    return 'Valor inválido';
  });
}
