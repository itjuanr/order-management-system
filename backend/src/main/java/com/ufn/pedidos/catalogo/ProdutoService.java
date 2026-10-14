package com.ufn.pedidos.catalogo;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.ufn.pedidos.catalogo.CatalogoDtos.ProdutoRequest;
import com.ufn.pedidos.catalogo.CatalogoDtos.ProdutoResponse;
import com.ufn.pedidos.common.PageResponse;
import com.ufn.pedidos.common.RecursoNaoEncontradoException;
import com.ufn.pedidos.common.RegraDeNegocioException;
import com.ufn.pedidos.pedido.ItemPedidoRepository;

@Service
public class ProdutoService {

	private final ProdutoRepository produtos;
	private final CategoriaService categorias;
	private final FornecedorService fornecedores;
	private final ItemPedidoRepository itensPedido;

	public ProdutoService(ProdutoRepository produtos, CategoriaService categorias, FornecedorService fornecedores,
			ItemPedidoRepository itensPedido) {
		this.produtos = produtos;
		this.categorias = categorias;
		this.fornecedores = fornecedores;
		this.itensPedido = itensPedido;
	}

	public record Filtro(String busca, Long categoriaId, Long fornecedorId, boolean apenasAtivos, boolean estoqueBaixo) {
	}

	@Transactional(readOnly = true)
	public PageResponse<ProdutoResponse> listar(Filtro filtro, Pageable pageable) {
		String busca = StringUtils.hasText(filtro.busca()) ? filtro.busca().trim() : null;
		return PageResponse.of(produtos.buscar(busca, filtro.categoriaId(), filtro.fornecedorId(),
				filtro.apenasAtivos(), filtro.estoqueBaixo(), pageable), ProdutoResponse::of);
	}

	@Transactional(readOnly = true)
	public ProdutoResponse buscar(Long id) {
		return ProdutoResponse.of(encontrar(id));
	}

	@Transactional
	public ProdutoResponse criar(ProdutoRequest request) {
		String sku = request.sku().trim().toUpperCase();
		if (produtos.existsBySkuIgnoreCase(sku)) {
			throw new RegraDeNegocioException("Já existe um produto com o SKU " + sku + ".");
		}
		Produto produto = new Produto(sku, request.nome().trim(), request.descricao(), request.preco(),
				request.estoque(), request.estoqueMinimo(), !Boolean.FALSE.equals(request.ativo()),
				categorias.encontrar(request.categoriaId()), fornecedores.encontrar(request.fornecedorId()));
		return ProdutoResponse.of(produtos.save(produto));
	}

	@Transactional
	public ProdutoResponse atualizar(Long id, ProdutoRequest request) {
		Produto produto = encontrar(id);
		String sku = request.sku().trim().toUpperCase();
		if (produtos.existsBySkuIgnoreCaseAndIdNot(sku, id)) {
			throw new RegraDeNegocioException("Já existe um produto com o SKU " + sku + ".");
		}
		produto.atualizar(sku, request.nome().trim(), request.descricao(), request.preco(), request.estoque(),
				request.estoqueMinimo(), !Boolean.FALSE.equals(request.ativo()),
				categorias.encontrar(request.categoriaId()), fornecedores.encontrar(request.fornecedorId()));
		return ProdutoResponse.of(produto);
	}

	@Transactional
	public void excluir(Long id) {
		Produto produto = encontrar(id);
		if (itensPedido.existsByProdutoId(id)) {
			throw new RegraDeNegocioException(
					"O produto já aparece em pedidos e não pode ser excluído. Desative-o para tirá-lo das vendas.");
		}
		produtos.delete(produto);
	}

	public Produto encontrar(Long id) {
		return produtos.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Produto", id));
	}
}
