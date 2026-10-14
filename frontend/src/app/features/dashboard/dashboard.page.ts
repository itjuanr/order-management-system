import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { mensagemDeErro } from '../../core/api-errors';
import { AoVivoService } from '../../core/ao-vivo.service';
import { TempoRelativoPipe } from '../../shared/formatos';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ICONE_ATIVIDADE, STATUS_PEDIDO } from '../../core/labels';
import { MARCA } from '../../core/marca';
import { StatusBadgeComponent } from '../../shared/status-badge.component';
import { GraficoFaturamentoComponent } from './grafico-faturamento.component';

@Component({
  selector: 'app-dashboard-page',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, RouterLink, StatusBadgeComponent, GraficoFaturamentoComponent, TempoRelativoPipe],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
})
export class DashboardPage {
  private api = inject(ApiService);
  protected router = inject(Router);
  protected auth = inject(AuthService);
  protected readonly status = STATUS_PEDIDO;
  protected readonly hoje = new Date();
  protected readonly mesPassado = new Date(this.hoje.getFullYear(), this.hoje.getMonth() - 1, 1);
  protected readonly marca = MARCA;

  protected aoVivo = inject(AoVivoService);

  protected dados = rxResource({ stream: () => this.api.dashboard() });
  protected atividades = rxResource({ stream: () => this.api.atividades(8) });

  protected readonly iconeAtividade = ICONE_ATIVIDADE;

  constructor() {
    // Com a simulação ligada, o painel acompanha os pedidos sem precisar recarregar a página.
    effect(() => {
      if (this.aoVivo.pulso() > 0) {
        untracked(() => {
          this.dados.reload();
          this.atividades.reload();
        });
      }
    });
  }
  protected erro = computed(() => (this.dados.error() ? mensagemDeErro(this.dados.error()) : null));

  /** Variação do faturamento contra o mesmo período do mês anterior. */
  protected variacao = computed(() => {
    const d = this.dados.value();
    if (!d || !d.faturamentoMesmoPeriodoAnterior) {
      return null;
    }
    return (d.faturamentoMes - d.faturamentoMesmoPeriodoAnterior) / d.faturamentoMesmoPeriodoAnterior;
  });

  protected totalPedidos = computed(() =>
    (this.dados.value()?.pedidosPorStatus ?? []).reduce((soma, s) => soma + s.quantidade, 0),
  );

  protected maiorReceita = computed(() =>
    Math.max(1, ...(this.dados.value()?.maisVendidos ?? []).map((p) => p.receita)),
  );
}
