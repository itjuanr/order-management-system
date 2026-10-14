package com.ufn.pedidos.pedido;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import com.ufn.pedidos.catalogo.Produto;
import com.ufn.pedidos.cliente.Cliente;
import com.ufn.pedidos.common.RegraDeNegocioException;
import com.ufn.pedidos.pedido.StatusPedido.AcaoPedido;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Agregado principal. Todas as regras de status, estoque e totais passam por aqui, para que nenhum
 * serviço consiga deixar um pedido em estado inconsistente.
 */
@Entity
@Table(name = "pedidos")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Pedido {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "cliente_id")
	private Cliente cliente;

	@Enumerated(EnumType.STRING)
	private StatusPedido status;

	@OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<ItemPedido> itens = new ArrayList<>();

	@OneToOne(mappedBy = "pedido", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
	private Pagamento pagamento;

	private BigDecimal total = BigDecimal.ZERO;

	private String observacao;

	private LocalDateTime criadoEm;
	private LocalDateTime pagoEm;
	private LocalDateTime enviadoEm;
	private LocalDateTime entregueEm;
	private LocalDateTime canceladoEm;

	public Pedido(Cliente cliente, String observacao, LocalDateTime criadoEm) {
		this.cliente = cliente;
		this.observacao = observacao;
		this.criadoEm = criadoEm;
		this.status = StatusPedido.AGUARDANDO_PAGAMENTO;
	}

	public List<ItemPedido> getItens() {
		return Collections.unmodifiableList(itens);
	}

	public void adicionarItem(Produto produto, int quantidade) {
		if (status != StatusPedido.AGUARDANDO_PAGAMENTO) {
			throw new RegraDeNegocioException("Só é possível alterar itens de pedidos aguardando pagamento.");
		}
		if (quantidade <= 0) {
			throw new RegraDeNegocioException("A quantidade deve ser maior que zero.");
		}

		var existente = itens.stream().filter(i -> i.getProduto().getId().equals(produto.getId())).findFirst();
		int quantidadeFinal = quantidade + existente.map(ItemPedido::getQuantidade).orElse(0);
		produto.garantirDisponivel(quantidadeFinal);

		existente.ifPresentOrElse(i -> i.somarQuantidade(quantidade),
				() -> itens.add(new ItemPedido(this, produto, quantidade)));
		total = itens.stream().map(ItemPedido::getSubtotal).reduce(BigDecimal.ZERO, BigDecimal::add);
	}

	/** Registra o pagamento do valor total e dá baixa no estoque de cada item. */
	public void pagar(MetodoPagamento metodo, LocalDateTime quando) {
		exigir(AcaoPedido.PAGAR, "pago");
		if (itens.isEmpty()) {
			throw new RegraDeNegocioException("O pedido não possui itens.");
		}
		itens.forEach(item -> item.getProduto().baixarEstoque(item.getQuantidade()));
		this.pagamento = new Pagamento(this, metodo, total, quando);
		this.status = StatusPedido.PAGO;
		this.pagoEm = quando;
	}

	public void enviar(LocalDateTime quando) {
		exigir(AcaoPedido.ENVIAR, "enviado");
		this.status = StatusPedido.ENVIADO;
		this.enviadoEm = quando;
	}

	public void entregar(LocalDateTime quando) {
		exigir(AcaoPedido.ENTREGAR, "entregue");
		this.status = StatusPedido.ENTREGUE;
		this.entregueEm = quando;
	}

	/** Cancela o pedido; se já estava pago, o estoque reservado volta para o catálogo. */
	public void cancelar(LocalDateTime quando) {
		exigir(AcaoPedido.CANCELAR, "cancelado");
		if (status == StatusPedido.PAGO) {
			itens.forEach(item -> item.getProduto().reporEstoque(item.getQuantidade()));
		}
		this.status = StatusPedido.CANCELADO;
		this.canceladoEm = quando;
	}

	public int getQuantidadeItens() {
		return itens.stream().mapToInt(ItemPedido::getQuantidade).sum();
	}

	private void exigir(AcaoPedido acao, String participio) {
		if (!status.permite(acao)) {
			throw new RegraDeNegocioException(
					"Um pedido " + status.rotulo() + " não pode ser " + participio + ".");
		}
	}
}
