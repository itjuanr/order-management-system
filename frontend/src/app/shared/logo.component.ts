import { booleanAttribute, Component, input } from '@angular/core';
import { MARCA } from '../core/marca';

/** Símbolo do Kairo (um "K" de traço arredondado) com o nome opcional ao lado. */
@Component({
  selector: 'app-logo',
  host: { class: 'logo' },
  template: `
    <svg class="logo-mark" [attr.width]="tamanho()" [attr.height]="tamanho()" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path d="M11.5 9v14M21 9l-6.5 7 6.5 7" fill="none" stroke="#fff" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    @if (comNome()) {
      <span class="logo-word">{{ nome }}</span>
    }
  `,
  styles: `
    :host { display: inline-flex; align-items: center; gap: 9px; color: var(--text); }
    .logo-mark { flex: none; display: block; }
    .logo-word { font-size: 20px; font-weight: 600; letter-spacing: -0.03em; }
  `,
})
export class LogoComponent {
  readonly tamanho = input(28);
  readonly comNome = input(false, { transform: booleanAttribute });
  protected readonly nome = MARCA.produto.toLowerCase();
}
