package com.ufn.pedidos.pedido;

import java.util.List;

/**
 * Ciclo de vida do pedido:
 * AGUARDANDO_PAGAMENTO → PAGO → ENVIADO → ENTREGUE, com cancelamento possível antes do envio.
 */
public enum StatusPedido {

	AGUARDANDO_PAGAMENTO("aguardando pagamento", List.of(AcaoPedido.PAGAR, AcaoPedido.CANCELAR)),
	PAGO("pago", List.of(AcaoPedido.ENVIAR, AcaoPedido.CANCELAR)),
	ENVIADO("enviado", List.of(AcaoPedido.ENTREGAR)),
	ENTREGUE("entregue", List.of()),
	CANCELADO("cancelado", List.of());

	private final String rotulo;
	private final List<AcaoPedido> acoes;

	StatusPedido(String rotulo, List<AcaoPedido> acoes) {
		this.rotulo = rotulo;
		this.acoes = acoes;
	}

	public String rotulo() {
		return rotulo;
	}

	public List<AcaoPedido> acoes() {
		return acoes;
	}

	public boolean permite(AcaoPedido acao) {
		return acoes.contains(acao);
	}

	public enum AcaoPedido {
		PAGAR, ENVIAR, ENTREGAR, CANCELAR
	}
}
