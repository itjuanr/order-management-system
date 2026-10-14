import { MetodoPagamento, StatusPedido, TipoAtividade } from './models';

export type Tom = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

export const STATUS_PEDIDO: Record<StatusPedido, { label: string; tom: Tom; icon: string }> = {
  AGUARDANDO_PAGAMENTO: { label: 'Aguardando pagamento', tom: 'warning', icon: 'icon-hourglass' },
  PAGO: { label: 'Pago', tom: 'info', icon: 'icon-circle-check' },
  ENVIADO: { label: 'Enviado', tom: 'info', icon: 'icon-truck' },
  ENTREGUE: { label: 'Entregue', tom: 'success', icon: 'icon-package-check' },
  CANCELADO: { label: 'Cancelado', tom: 'danger', icon: 'icon-ban' },
};

export const ICONE_ATIVIDADE: Record<TipoAtividade, string> = {
  CRIADO: 'icon-file-plus',
  PAGO: 'icon-circle-check',
  ENVIADO: 'icon-truck',
  ENTREGUE: 'icon-package-check',
  CANCELADO: 'icon-ban',
};

export const STATUS_ORDEM: StatusPedido[] = [
  'AGUARDANDO_PAGAMENTO',
  'PAGO',
  'ENVIADO',
  'ENTREGUE',
  'CANCELADO',
];

export const METODO_PAGAMENTO: Record<MetodoPagamento, { label: string; icon: string }> = {
  PIX: { label: 'Pix', icon: 'icon-qr-code' },
  CARTAO_CREDITO: { label: 'Cartão de crédito', icon: 'icon-credit-card' },
  CARTAO_DEBITO: { label: 'Cartão de débito', icon: 'icon-wallet-cards' },
  BOLETO: { label: 'Boleto', icon: 'icon-barcode' },
};
