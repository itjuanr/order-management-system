package com.ufn.pedidos.pedido;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;
import com.ufn.pedidos.ApiTest;
import com.ufn.pedidos.catalogo.Categoria;
import com.ufn.pedidos.catalogo.CategoriaRepository;
import com.ufn.pedidos.catalogo.Fornecedor;
import com.ufn.pedidos.catalogo.FornecedorRepository;
import com.ufn.pedidos.catalogo.Produto;
import com.ufn.pedidos.catalogo.ProdutoRepository;
import com.ufn.pedidos.cliente.Cliente;
import com.ufn.pedidos.cliente.ClienteRepository;

@ApiTest
@WithMockUser
class PedidoApiTest {

	@Autowired
	private MockMvc mvc;
	@Autowired
	private ClienteRepository clientes;
	@Autowired
	private CategoriaRepository categorias;
	@Autowired
	private FornecedorRepository fornecedores;
	@Autowired
	private ProdutoRepository produtos;

	private Cliente cliente;
	private Produto produto;

	@BeforeEach
	void setUp() {
		cliente = clientes.save(new Cliente("Ana Souza", "52998224725", "ana@email.com", null, null));
		var categoria = categorias.save(new Categoria("Áudio", null));
		var fornecedor = fornecedores.save(new Fornecedor("Som LTDA", "11222333000181", null, null));
		produto = produtos.save(new Produto("AUD-1", "Fone", null, new BigDecimal("150.00"), 5, 1, true, categoria, fornecedor));
	}

	@Test
	void fluxoCompletoDePagamentoECancelamentoAtualizaOEstoque() throws Exception {
		long id = criarPedido(2);

		mvc.perform(post("/api/pedidos/{id}/pagamento", id).contentType(MediaType.APPLICATION_JSON)
						.content("{\"metodo\":\"PIX\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("PAGO"))
				.andExpect(jsonPath("$.pagamento.valor").value(300.00))
				.andExpect(jsonPath("$.acoes[0]").value("ENVIAR"));
		assertThat(produtos.findById(produto.getId()).orElseThrow().getEstoque()).isEqualTo(3);

		mvc.perform(post("/api/pedidos/{id}/cancelamento", id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("CANCELADO"));
		assertThat(produtos.findById(produto.getId()).orElseThrow().getEstoque()).isEqualTo(5);
	}

	@Test
	void recusaPedidoAcimaDoEstoque() throws Exception {
		mvc.perform(post("/api/pedidos").contentType(MediaType.APPLICATION_JSON).content(novoPedidoJson(6)))
				.andExpect(status().isUnprocessableEntity())
				.andExpect(jsonPath("$.detail").value("Estoque insuficiente para Fone: pedido 6, disponível 5."));
	}

	@Test
	void naoEnviaPedidoNaoPago() throws Exception {
		long id = criarPedido(1);

		mvc.perform(post("/api/pedidos/{id}/envio", id))
				.andExpect(status().isUnprocessableEntity())
				.andExpect(jsonPath("$.detail").value("Um pedido aguardando pagamento não pode ser enviado."));
	}

	@Test
	void validaCamposDoPedido() throws Exception {
		mvc.perform(post("/api/pedidos").contentType(MediaType.APPLICATION_JSON).content("{\"itens\":[]}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.erros.clienteId").value("Selecione o cliente"))
				.andExpect(jsonPath("$.erros.itens").value("Adicione ao menos um produto"));
	}

	private long criarPedido(int quantidade) throws Exception {
		String resposta = mvc.perform(post("/api/pedidos").contentType(MediaType.APPLICATION_JSON)
						.content(novoPedidoJson(quantidade)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.status").value("AGUARDANDO_PAGAMENTO"))
				.andReturn().getResponse().getContentAsString();
		return ((Number) JsonPath.read(resposta, "$.id")).longValue();
	}

	private String novoPedidoJson(int quantidade) {
		return """
				{"clienteId": %d, "itens": [{"produtoId": %d, "quantidade": %d}]}
				""".formatted(cliente.getId(), produto.getId(), quantidade);
	}
}
