import { Directive, ElementRef, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';
import { formatar, TipoDocumento } from './formatos';

/** Formata CPF, CNPJ ou telefone enquanto o usuário digita: `<input formControlName="cpf" appMascara="cpf">`. */
@Directive({
  selector: 'input[appMascara]',
  host: {
    '(input)': 'aoDigitar()',
    inputmode: 'numeric',
  },
})
export class MascaraDirective {
  readonly appMascara = input.required<TipoDocumento>();

  private el = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private controle = inject(NgControl, { self: true });

  aoDigitar(): void {
    const formatado = formatar(this.el.nativeElement.value, this.appMascara());
    this.el.nativeElement.value = formatado;
    this.controle.control?.setValue(formatado, { emitEvent: false });
  }
}
