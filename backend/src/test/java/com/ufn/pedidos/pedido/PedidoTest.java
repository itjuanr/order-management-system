package com.ufn.pedidos.pedido;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.ufn.pedidos.catalogo.Categoria;
import com.ufn.pedidos.catalogo.Fornecedor;
import com.ufn.pedidos.catalogo.Produto;
import com.ufn.pedidos.cliente.Cliente;
import com.ufn.pedidos.common.RegraDeNegocioException;
import com.ufn.pedidos.pedido.StatusPedido.AcaoPedido;

/** Regras do agregado Pedido, sem Spring nem banco. */
class PedidoTest {

	private static final LocalDateTime AGORA = LocalDateTime.of(2026, 10, 1, 10, 0);

	private Produto mouse;
	private Produto teclado;
	private Pedido pedido;

	@BeforeEach
	void setUp() {
		var categoria = new Categoria("Informática", null);
		var fornecedor = new Fornecedor("InfoParts", "11222333000181", null, null);
		mouse = produto(1L, "Mouse", "100.00", 10, categoria, fornecedor);
		teclado = produto(2L, "Teclado", "250.50", 3, categoria, fornecedor);
		pedido = new Pedido(new Cliente("Ana", "52998224725", "ana@email.com", null, null), null, AGORA);
	}

	@Test
	void calculaTotalEJuntaItensDoMesmoProduto() {
		pedido.adicionarItem(mouse, 2);
		pedido.adicionarItem(teclado, 1);
		pedido.adicionarItem(mouse, 1);

		assertThat(pedido.getItens()).hasSize(2);
		assertThat(pedido.getQuantidadeItens()).isEqualTo(4);
		assertThat(pedido.getTotal()).isEqualByComparingTo("550.50");
	}

	@Test
	void naoAceitaQuantidadeMaiorQueOEstoque() {
		assertThatThrownBy(() -> pedido.adicionarItem(teclado, 4))
				.isInstanceOf(RegraDeNegocioException.class)
				.hasMessageContaining("Estoque insuficiente");
	}

	@Test
	void pagarBaixaEstoqueERegistraPagamento() {
		pedido.adicionarItem(mouse, 3);

		pedido.pagar(MetodoPagamento.PIX, AGORA.plusHours(1));

		assertThat(pedido.getStatus()).isEqualTo(StatusPedido.PAGO);
		assertThat(mouse.getEstoque()).isEqualTo(7);
		assertThat(pedido.getPagamento().getValor()).isEqualByComparingTo("300.00");
		assertThat(pedido.getStatus().acoes()).containsExactly(AcaoPedido.ENVIAR, AcaoPedido.CANCELAR);
	}

	@Test
	void cancelarPedidoPagoDevolveEstoque() {
		pedido.adicionarItem(mouse, 3);
		pedido.pagar(MetodoPagamento.CARTAO_CREDITO, AGORA);

		pedido.cancelar(AGORA.plusDays(1));

		assertThat(pedido.getStatus()).isEqualTo(StatusPedido.CANCELADO);
		assertThat(mouse.getEstoque()).isEqualTo(10);
	}

	@Test
	void cancelarPedidoNaoPagoNaoMexeNoEstoque() {
		pedido.adicionarItem(mouse, 3);

		pedido.cancelar(AGORA);

		assertThat(mouse.getEstoque()).isEqualTo(10);
	}

	@Test
	void segueOCicloCompletoAteAEntrega() {
		pedido.adicionarItem(mouse, 1);
		pedido.pagar(MetodoPagamento.BOLETO, AGORA);
		pedido.enviar(AGORA.plusDays(1));
		pedido.entregar(AGORA.plusDays(3));

		assertThat(pedido.getStatus()).isEqualTo(StatusPedido.ENTREGUE);
		assertThat(pedido.getEntregueEm()).isEqualTo(AGORA.plusDays(3));
		assertThat(pedido.getStatus().acoes()).isEmpty();
	}

	@Test
	void bloqueiaTransicoesInvalidas() {
		pedido.adicionarItem(mouse, 1);

		assertThatThrownBy(() -> pedido.enviar(AGORA)).hasMessage("Um pedido aguardando pagamento não pode ser enviado.");

		pedido.pagar(MetodoPagamento.PIX, AGORA);
		pedido.enviar(AGORA);
		assertThatThrownBy(() -> pedido.cancelar(AGORA)).hasMessage("Um pedido enviado não pode ser cancelado.");
		assertThatThrownBy(() -> pedido.adicionarItem(teclado, 1)).isInstanceOf(RegraDeNegocioException.class);
	}

	@Test
	void naoVendeProdutoInativo() {
		mouse.atualizar(mouse.getSku(), mouse.getNome(), null, mouse.getPreco(), 10, 2, false, mouse.getCategoria(),
				mouse.getFornecedor());

		assertThatThrownBy(() -> pedido.adicionarItem(mouse, 1)).hasMessageContaining("inativo");
	}

	@Test
	void precoDoItemNaoMudaQuandoOCatalogoMuda() {
		pedido.adicionarItem(mouse, 1);
		mouse.atualizar(mouse.getSku(), mouse.getNome(), null, new BigDecimal("999.00"), 10, 2, true,
				mouse.getCategoria(), mouse.getFornecedor());

		assertThat(pedido.getItens().get(0).getPrecoUnitario()).isEqualByComparingTo("100.00");
	}

	private static Produto produto(Long id, String nome, String preco, int estoque, Categoria c, Fornecedor f) {
		var produto = new Produto("SKU-" + id, nome, null, new BigDecimal(preco), estoque, 2, true, c, f);
		ReflectionTestUtils.setField(produto, "id", id);
		return produto;
	}
}
