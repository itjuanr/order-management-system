package com.ufn.pedidos.catalogo;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ufn.pedidos.catalogo.CatalogoDtos.CategoriaRequest;
import com.ufn.pedidos.catalogo.CatalogoDtos.CategoriaResponse;
import com.ufn.pedidos.common.RecursoNaoEncontradoException;
import com.ufn.pedidos.common.RegraDeNegocioException;

@Service
public class CategoriaService {

	private final CategoriaRepository categorias;
	private final ProdutoRepository produtos;

	public CategoriaService(CategoriaRepository categorias, ProdutoRepository produtos) {
		this.categorias = categorias;
		this.produtos = produtos;
	}

	@Transactional(readOnly = true)
	public List<CategoriaResponse> listar() {
		return categorias.listarComTotais();
	}

	@Transactional
	public CategoriaResponse criar(CategoriaRequest request) {
		if (categorias.existsByNomeIgnoreCase(request.nome().trim())) {
			throw new RegraDeNegocioException("Já existe uma categoria com este nome.");
		}
		Categoria categoria = categorias.save(new Categoria(request.nome().trim(), request.descricao()));
		return new CategoriaResponse(categoria.getId(), categoria.getNome(), categoria.getDescricao(), 0);
	}

	@Transactional
	public CategoriaResponse atualizar(Long id, CategoriaRequest request) {
		Categoria categoria = encontrar(id);
		if (categorias.existsByNomeIgnoreCaseAndIdNot(request.nome().trim(), id)) {
			throw new RegraDeNegocioException("Já existe uma categoria com este nome.");
		}
		categoria.atualizar(request.nome().trim(), request.descricao());
		return categorias.listarComTotais().stream().filter(c -> c.id().equals(id)).findFirst().orElseThrow();
	}

	@Transactional
	public void excluir(Long id) {
		Categoria categoria = encontrar(id);
		if (produtos.existsByCategoriaId(id)) {
			throw new RegraDeNegocioException("A categoria possui produtos e não pode ser excluída.");
		}
		categorias.delete(categoria);
	}

	public Categoria encontrar(Long id) {
		return categorias.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Categoria", id));
	}
}
