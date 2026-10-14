import { DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { mensagemDeErro } from './api-errors';
import { ToastService } from './toast.service';

/**
 * Estado da simulação ao vivo. Enquanto ela está ligada, `pulso` muda a cada poucos segundos e as
 * telas que dependem de pedidos recarregam os dados ao reagir a ele.
 */
@Injectable({ providedIn: 'root' })
export class AoVivoService {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly ativo = signal(false);
  readonly alterando = signal(false);
  readonly pulso = signal(0);

  private intervaloMs = 6000;
  private timer?: ReturnType<typeof setInterval>;

  constructor() {
    this.sincronizar();
    // O estado pode mudar por outra aba ou pela API: confere de tempos em tempos.
    const verificacao = setInterval(() => this.sincronizar(), 30_000);
    inject(DestroyRef).onDestroy(() => clearInterval(verificacao));

    effect(() => {
      clearInterval(this.timer);
      if (this.ativo()) {
        this.timer = setInterval(() => this.pulso.update((n) => n + 1), this.intervaloMs);
      }
    });
  }

  alternar(): void {
    const ligar = !this.ativo();
    this.alterando.set(true);
    this.api.alterarSimulador(ligar).subscribe({
      next: (estado) => {
        this.aplicar(estado.ativo, estado.intervaloSegundos);
        this.toast.sucesso(
          estado.ativo
            ? 'Simulação ligada: novos pedidos e mudanças de status vão aparecer sozinhos.'
            : 'Simulação desligada.',
        );
        this.alterando.set(false);
      },
      error: (e) => {
        this.toast.erro(mensagemDeErro(e));
        this.alterando.set(false);
      },
    });
  }

  private sincronizar(): void {
    this.api
      .simulador()
      .pipe(catchError(() => of(null)))
      .subscribe((estado) => estado && this.aplicar(estado.ativo, estado.intervaloSegundos));
  }

  private aplicar(ativo: boolean, intervaloSegundos: number): void {
    this.intervaloMs = Math.max(3, intervaloSegundos) * 1000;
    this.ativo.set(ativo);
  }
}
