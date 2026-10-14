import { Component } from '@angular/core';
import { MARCA } from '../../core/marca';

@Component({
  selector: 'app-auth-rodape',
  template: `
    <footer class="auth-footer">
      <span>© {{ ano }} {{ marca.produto }}</span>
      <span>Marca e dados fictícios · projeto de portfólio</span>
      <a [href]="marca.repositorio" target="_blank" rel="noopener">Código-fonte</a>
    </footer>
  `,
})
export class AuthRodapeComponent {
  protected readonly marca = MARCA;
  protected readonly ano = new Date().getFullYear();
}
