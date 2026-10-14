package com.ufn.pedidos.dashboard;

import java.math.BigDecimal;
import java.util.List;

import com.ufn.pedidos.pedido.PedidoDtos.PedidoResumo;
import com.ufn.pedidos.pedido.StatusPedido;

public record DashboardResponse(
		BigDecimal faturamentoMes,
		/** Faturamento do mês anterior até o mesmo dia/hora de hoje, para comparar períodos equivalentes. */
		BigDecimal faturamentoMesmoPeriodoAnterior,
		long vendasMes,
		BigDecimal ticketMedioMes,
		long pedidosAguardandoPagamento,
		long pedidosParaEnviar,
		List<FaturamentoMensal> faturamentoMensal,
		List<StatusQuantidade> pedidosPorStatus,
		List<ProdutoEstoque> estoqueBaixo,
		List<ProdutoVendido> maisVendidos,
		List<PedidoResumo> ultimosPedidos) {

	/** mes no formato yyyy-MM. */
	public record FaturamentoMensal(String mes, BigDecimal valor, long vendas) {
	}

	public record StatusQuantidade(StatusPedido status, long quantidade) {
	}

	public record ProdutoEstoque(Long id, String nome, String sku, int estoque, int estoqueMinimo) {
	}

	public record ProdutoVendido(Long id, String nome, long quantidade, BigDecimal receita) {
	}
}
