import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { catchError, of, switchMap, timer } from 'rxjs';
import { ApiService } from '../core/api.service';
import { MARCA } from '../core/marca';
import { InfoSistema } from '../core/models';

/** Rodapé com links e o status real da API (consulta /api/info a cada minuto). */
@Component({
  selector: 'app-rodape',
  template: `
    <footer class="app-footer">
      <span>© {{ ano }} {{ marca.produto }} · {{ marca.loja }}</span>
      <nav aria-label="Links do rodapé">
        <a href="/swagger-ui" target="_blank" rel="noopener">Documentação da API</a>
        <a [href]="marca.repositorio" target="_blank" rel="noopener">Código-fonte</a>
        <span>Marca fictícia · projeto de portfólio</span>
      </nav>
      <span class="status-pill" [attr.data-status]="status()" [title]="detalhe()">
        {{ rotulo() }}
        @if (info(); as i) {
          <span class="mono">v{{ i.versao }} · {{ i.ambiente }}</span>
        }
      </span>
    </footer>
  `,
})
export class RodapeComponent {
  private api = inject(ApiService);
  protected readonly marca = MARCA;
  protected readonly ano = new Date().getFullYear();

  protected info = signal<InfoSistema | null>(null);
  private falhou = signal(false);

  protected status = computed(() => (this.falhou() ? 'erro' : this.info()?.bancoOk ? 'ok' : 'verificando'));
  protected rotulo = computed(() =>
    this.falhou() ? 'API indisponível' : this.info() ? (this.info()!.bancoOk ? 'Operacional' : 'Banco indisponível') : 'Verificando…',
  );
  protected detalhe = computed(() => {
    const i = this.info();
    return i ? `Banco ${i.banco} · no ar há ${i.minutosNoAr} min` : '';
  });

  constructor() {
    const assinatura = timer(0, 60_000)
      .pipe(switchMap(() => this.api.info().pipe(catchError(() => of(null)))))
      .subscribe((info) => {
        this.falhou.set(info === null);
        if (info) {
          this.info.set(info);
        }
      });
    inject(DestroyRef).onDestroy(() => assinatura.unsubscribe());
  }
}
