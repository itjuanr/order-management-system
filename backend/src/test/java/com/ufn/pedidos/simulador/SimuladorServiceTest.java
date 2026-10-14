package com.ufn.pedidos.simulador;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.ufn.pedidos.ApiTest;
import com.ufn.pedidos.atividade.AtividadeService;
import com.ufn.pedidos.atividade.AtividadeService.TipoAtividade;
import com.ufn.pedidos.catalogo.Categoria;
import com.ufn.pedidos.catalogo.CategoriaRepository;
import com.ufn.pedidos.catalogo.Fornecedor;
import com.ufn.pedidos.catalogo.FornecedorRepository;
import com.ufn.pedidos.catalogo.Produto;
import com.ufn.pedidos.catalogo.ProdutoRepository;
import com.ufn.pedidos.cliente.Cliente;
import com.ufn.pedidos.cliente.ClienteRepository;
import com.ufn.pedidos.pedido.PedidoRepository;

@ApiTest
class SimuladorServiceTest {

	@Autowired
	private SimuladorService simulador;
	@Autowired
	private AtividadeService atividades;
	@Autowired
	private PedidoRepository pedidos;
	@Autowired
	private ClienteRepository clientes;
	@Autowired
	private CategoriaRepository categorias;
	@Autowired
	private FornecedorRepository fornecedores;
	@Autowired
	private ProdutoRepository produtos;

	@AfterEach
	void desligar() {
		simulador.alterar(false);
	}

	@Test
	void desligadoNaoFazNada() {
		prepararLoja();
		simulador.passo();
		assertThat(pedidos.count()).isZero();
	}

	@Test
	void ligadoCriaPedidosERegistraAtividade() {
		prepararLoja();
		simulador.alterar(true);

		// A criação é sorteada a cada passo; dez passos tornam a chance de nenhum pedido desprezível.
		for (int i = 0; i < 10 && pedidos.count() == 0; i++) {
			simulador.passo();
		}

		assertThat(pedidos.count()).isPositive();
		assertThat(atividades.recentes(5)).anySatisfy(a -> {
			assertThat(a.tipo()).isEqualTo(TipoAtividade.CRIADO);
			assertThat(a.autor()).isEqualTo("Simulador");
		});
	}

	private void prepararLoja() {
		clientes.save(new Cliente("Bruno Lima", "52998224725", "bruno@email.com", null, null));
		var categoria = categorias.save(new Categoria("Áudio", null));
		var fornecedor = fornecedores.save(new Fornecedor("Som LTDA", "11222333000181", null, null));
		produtos.save(new Produto("AUD-1", "Fone", null, new BigDecimal("150.00"), 50, 1, true, categoria, fornecedor));
	}
}
