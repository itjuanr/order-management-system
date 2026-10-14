import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-paginador',
  template: `
    @if (total() > 0) {
      <div class="paginator">
        <span class="muted num">{{ inicio() }}–{{ fim() }} de {{ total() }}</span>
        <div class="paginator-buttons">
          <button type="button" class="icon-btn" aria-label="Página anterior" [disabled]="pagina() === 0"
            (click)="mudar.emit(pagina() - 1)">
            <i class="icon-chevron-left"></i>
          </button>
          <span class="num">{{ pagina() + 1 }} / {{ totalPaginas() }}</span>
          <button type="button" class="icon-btn" aria-label="Próxima página" [disabled]="pagina() + 1 >= totalPaginas()"
            (click)="mudar.emit(pagina() + 1)">
            <i class="icon-chevron-right"></i>
          </button>
        </div>
      </div>
    }
  `,
})
export class PaginadorComponent {
  readonly pagina = input.required<number>();
  readonly tamanho = input.required<number>();
  readonly total = input.required<number>();
  readonly mudar = output<number>();

  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / this.tamanho())));
  readonly inicio = computed(() => this.pagina() * this.tamanho() + 1);
  readonly fim = computed(() => Math.min(this.total(), (this.pagina() + 1) * this.tamanho()));
}
