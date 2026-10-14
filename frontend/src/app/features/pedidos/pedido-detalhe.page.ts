import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { mensagemDeErro } from '../../core/api-errors';
import { AoVivoService } from '../../core/ao-vivo.service';
import { ApiService } from '../../core/api.service';
import { ConfirmService } from '../../core/confirm.service';
import { METODO_PAGAMENTO } from '../../core/labels';
import { MetodoPagamento, Pedido } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { DocumentoPipe, IniciaisPipe } from '../../shared/formatos';
import { ModalComponent } from '../../shared/modal.component';
import { StatusBadgeComponent } from '../../shared/status-badge.component';

interface Etapa {
  titulo: string;
  icone: string;
  quando?: string;
  estado: 'feito' | 'atual' | 'pendente' | 'cancelado';
}

@Component({
  selector: 'app-pedido-detalhe-page',
  imports: [CurrencyPipe, DatePipe, RouterLink, DocumentoPipe, IniciaisPipe, ModalComponent, StatusBadgeComponent],
  templateUrl: './pedido-detalhe.page.html',
  styleUrl: './pedido-detalhe.page.css',
})
export class PedidoDetalhePage {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  readonly id = input.required<string>();

  protected readonly metodos = METODO_PAGAMENTO;
  protected readonly listaMetodos = Object.keys(METODO_PAGAMENTO) as MetodoPagamento[];

  protected pedido = rxResource({
    params: () => Number(this.id()),
    stream: ({ params: id }) => this.api.pedido(id),
  });
  protected erro = computed(() => (this.pedido.error() ? mensagemDeErro(this.pedido.error()) : null));

  protected processando = signal(false);
  protected pagando = signal(false);
  protected metodoEscolhido = signal<MetodoPagamento>('PIX');

  private aoVivo = inject(AoVivoService);

  constructor() {
    // Com a simulação ligada o status pode mudar sozinho; evita recarregar no meio de uma ação.
    effect(() => {
      if (this.aoVivo.pulso() > 0) {
        untracked(() => !this.processando() && !this.pagando() && this.pedido.reload());
      }
    });
  }

  protected pode = computed(() => new Set(this.pedido.value()?.acoes ?? []));

  protected etapas = computed<Etapa[]>(() => {
    const p = this.pedido.value();
    if (!p) {
      return [];
    }
    const base: Omit<Etapa, 'estado'>[] = [
      { titulo: 'Pedido criado', icone: 'icon-file-plus', quando: p.criadoEm },
      { titulo: 'Pagamento confirmado', icone: 'icon-circle-check', quando: p.pagoEm },
      { titulo: 'Enviado', icone: 'icon-truck', quando: p.enviadoEm },
      { titulo: 'Entregue', icone: 'icon-package-check', quando: p.entregueEm },
    ];
    const feitas = base.filter((e) => e.quando);
    if (p.status === 'CANCELADO') {
      return [
        ...feitas.map((e) => ({ ...e, estado: 'feito' as const })),
        { titulo: 'Cancelado', icone: 'icon-ban', quando: p.canceladoEm, estado: 'cancelado' },
      ];
    }
    return base.map((e, i) => ({
      ...e,
      estado: e.quando ? 'feito' : i === feitas.length ? 'atual' : 'pendente',
    }));
  });

  confirmarPagamento(): void {
    const metodo = this.metodoEscolhido();
    this.executar(this.api.pagarPedido(this.pedidoId, metodo), 'Pagamento registrado e estoque atualizado.', () =>
      this.pagando.set(false),
    );
  }

  async enviar(): Promise<void> {
    if (await this.confirm.pedir({ titulo: 'Marcar como enviado?', mensagem: 'O cliente poderá acompanhar a entrega.', confirmar: 'Marcar como enviado' })) {
      this.executar(this.api.enviarPedido(this.pedidoId), 'Pedido marcado como enviado.');
    }
  }

  async entregar(): Promise<void> {
    if (await this.confirm.pedir({ titulo: 'Confirmar entrega?', mensagem: 'O pedido será concluído.', confirmar: 'Confirmar entrega' })) {
      this.executar(this.api.entregarPedido(this.pedidoId), 'Entrega confirmada. Pedido concluído!');
    }
  }

  async cancelar(): Promise<void> {
    const pago = this.pedido.value()?.status === 'PAGO';
    const ok = await this.confirm.pedir({
      titulo: `Cancelar o pedido #${this.pedidoId}?`,
      mensagem: pago
        ? 'O pagamento já foi registrado: os itens voltarão para o estoque. Esta ação não pode ser desfeita.'
        : 'Esta ação não pode ser desfeita.',
      confirmar: 'Cancelar pedido',
      perigo: true,
    });
    if (ok) {
      this.executar(this.api.cancelarPedido(this.pedidoId), 'Pedido cancelado.');
    }
  }

  private get pedidoId(): number {
    return Number(this.id());
  }

  private executar(acao: Observable<Pedido>, sucesso: string, depois?: () => void): void {
    this.processando.set(true);
    acao.subscribe({
      next: (pedido) => {
        this.pedido.set(pedido);
        this.toast.sucesso(sucesso);
        this.processando.set(false);
        depois?.();
      },
      error: (e) => {
        this.toast.erro(mensagemDeErro(e));
        this.processando.set(false);
        this.pedido.reload();
        depois?.();
      },
    });
  }
}
