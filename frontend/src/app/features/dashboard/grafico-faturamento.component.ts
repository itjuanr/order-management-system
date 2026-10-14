import { CurrencyPipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';

interface Ponto {
  mes: string; // yyyy-MM
  valor: number;
  vendas: number;
}

const compacto = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const nomeMes = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
const nomeMesLongo = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/** Colunas de faturamento mensal: uma série, eixo com valores redondos, tooltip por barra e tabela para leitores de tela. */
@Component({
  selector: 'app-grafico-faturamento',
  imports: [CurrencyPipe],
  styleUrl: './grafico-faturamento.component.css',
  template: `
    <div class="chart" role="img" [attr.aria-label]="resumo()">
      <div class="chart-plot">
        @for (tick of ticks(); track tick) {
          <div class="chart-grid" [style.bottom.%]="(tick / topo()) * 100">
            <span class="chart-tick">{{ formatarTick(tick) }}</span>
          </div>
        }

        <div class="chart-cols">
          @for (p of colunas(); track p.mes; let ultimo = $last) {
            <div class="chart-col" tabindex="0" [attr.aria-label]="p.rotuloLongo + ': ' + (p.valor | currency)"
              (mouseenter)="ativo.set(p.mes)" (mouseleave)="ativo.set(null)" (focus)="ativo.set(p.mes)"
              (blur)="ativo.set(null)">
              <div class="chart-bar" [style.height.%]="(p.valor / topo()) * 100">
                @if (ultimo && ativo() === null) {
                  <span class="chart-cap">{{ formatarTick(p.valor) }}</span>
                }
              </div>
              @if (ativo() === p.mes) {
                <div class="chart-tooltip" [style.bottom.%]="(p.valor / topo()) * 100">
                  <strong>{{ p.rotuloLongo }}</strong>
                  <span>{{ p.valor | currency }}</span>
                  <span class="muted">{{ p.vendas }} {{ p.vendas === 1 ? 'venda' : 'vendas' }}{{ ultimo ? ' até hoje' : '' }}</span>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <div class="chart-labels">
        @for (p of colunas(); track p.mes; let ultimo = $last) {
          <span>{{ p.rotulo }}@if (ultimo) {<small> (parcial)</small>}</span>
        }
      </div>
    </div>

    <table class="sr-only">
      <caption>Faturamento por mês</caption>
      <thead><tr><th>Mês</th><th>Faturamento</th><th>Vendas</th></tr></thead>
      <tbody>
        @for (p of colunas(); track p.mes) {
          <tr><td>{{ p.rotuloLongo }}</td><td>{{ p.valor | currency }}</td><td>{{ p.vendas }}</td></tr>
        }
      </tbody>
    </table>
  `,
})
export class GraficoFaturamentoComponent {
  readonly dados = input.required<Ponto[]>();
  protected ativo = signal<string | null>(null);

  protected colunas = computed(() =>
    this.dados().map((p) => {
      const data = new Date(`${p.mes}-15T12:00:00`);
      return {
        ...p,
        rotulo: nomeMes.format(data).replace('.', ''),
        rotuloLongo: capitalizar(nomeMesLongo.format(data)),
      };
    }),
  );

  /** Passo "redondo" (1, 2, 2,5 ou 5 × 10ⁿ) para ~4 linhas de grade. */
  private passo = computed(() => {
    const max = Math.max(...this.dados().map((p) => p.valor), 1);
    const bruto = max / 4;
    const potencia = 10 ** Math.floor(Math.log10(bruto));
    const fator = [1, 2, 2.5, 5, 10].find((f) => f * potencia >= bruto) ?? 10;
    return fator * potencia;
  });

  protected topo = computed(() => {
    const max = Math.max(...this.dados().map((p) => p.valor), 1);
    return Math.ceil(max / this.passo()) * this.passo();
  });

  protected ticks = computed(() => {
    const lista: number[] = [];
    for (let t = 0; t <= this.topo() + 1e-6; t += this.passo()) {
      lista.push(t);
    }
    return lista;
  });

  protected resumo = computed(() => {
    const c = this.colunas();
    return c.length
      ? `Faturamento mensal de ${c[0].rotuloLongo} a ${c[c.length - 1].rotuloLongo}`
      : 'Sem dados de faturamento';
  });

  protected formatarTick(valor: number): string {
    return compacto.format(valor);
  }
}
