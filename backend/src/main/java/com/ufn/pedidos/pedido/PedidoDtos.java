package com.ufn.pedidos.pedido;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.ufn.pedidos.cliente.Endereco;
import com.ufn.pedidos.pedido.StatusPedido.AcaoPedido;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class PedidoDtos {

	private PedidoDtos() {
	}

	public record NovoPedidoRequest(
			@NotNull(message = "Selecione o cliente") Long clienteId,
			@NotEmpty(message = "Adicione ao menos um produto") List<@Valid ItemRequest> itens,
			@Size(max = 500, message = "Máximo de 500 caracteres") String observacao) {
	}

	public record ItemRequest(
			@NotNull(message = "Selecione o produto") Long produtoId,
			@NotNull @Min(value = 1, message = "Quantidade mínima é 1") @Max(value = 999, message = "Quantidade máxima é 999") Integer quantidade) {
	}

	public record PagamentoRequest(@NotNull(message = "Selecione a forma de pagamento") MetodoPagamento metodo) {
	}

	public record PedidoResumo(Long id, Long clienteId, String clienteNome, StatusPedido status, BigDecimal total,
			int quantidadeItens, MetodoPagamento metodoPagamento, LocalDateTime criadoEm) {

		public static PedidoResumo of(Pedido p) {
			return new PedidoResumo(p.getId(), p.getCliente().getId(), p.getCliente().getNome(), p.getStatus(),
					p.getTotal(), p.getQuantidadeItens(),
					p.getPagamento() != null ? p.getPagamento().getMetodo() : null, p.getCriadoEm());
		}
	}

	public record ClienteResumo(Long id, String nome, String email, String cpf, String telefone, Endereco endereco) {
	}

	public record ItemResponse(Long produtoId, String sku, String produtoNome, int quantidade, BigDecimal precoUnitario,
			BigDecimal subtotal) {
	}

	public record PagamentoResponse(MetodoPagamento metodo, BigDecimal valor, LocalDateTime pagoEm) {
	}

	public record PedidoResponse(Long id, StatusPedido status, List<AcaoPedido> acoes, ClienteResumo cliente,
			List<ItemResponse> itens, BigDecimal total, String observacao, PagamentoResponse pagamento,
			LocalDateTime criadoEm, LocalDateTime pagoEm, LocalDateTime enviadoEm, LocalDateTime entregueEm,
			LocalDateTime canceladoEm) {

		public static PedidoResponse of(Pedido p) {
			var c = p.getCliente();
			var itens = p.getItens().stream()
					.map(i -> new ItemResponse(i.getProduto().getId(), i.getProduto().getSku(), i.getProduto().getNome(),
							i.getQuantidade(), i.getPrecoUnitario(), i.getSubtotal()))
					.toList();
			var pg = p.getPagamento();
			return new PedidoResponse(p.getId(), p.getStatus(), p.getStatus().acoes(),
					new ClienteResumo(c.getId(), c.getNome(), c.getEmail(), c.getCpf(), c.getTelefone(), c.getEndereco()), itens, p.getTotal(),
					p.getObservacao(), pg == null ? null : new PagamentoResponse(pg.getMetodo(), pg.getValor(), pg.getPagoEm()),
					p.getCriadoEm(), p.getPagoEm(), p.getEnviadoEm(), p.getEntregueEm(), p.getCanceladoEm());
		}
	}
}
