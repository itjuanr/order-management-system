package com.ufn.pedidos.catalogo;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {

	@EntityGraph(attributePaths = { "categoria", "fornecedor" })
	@Query("""
			select p from Produto p
			where (:busca is null
			       or lower(p.nome) like lower(concat('%', :busca, '%'))
			       or lower(p.sku) like lower(concat('%', :busca, '%')))
			  and (:categoriaId is null or p.categoria.id = :categoriaId)
			  and (:fornecedorId is null or p.fornecedor.id = :fornecedorId)
			  and (:apenasAtivos = false or p.ativo = true)
			  and (:estoqueBaixo = false or p.estoque <= p.estoqueMinimo)
			""")
	Page<Produto> buscar(@Param("busca") String busca, @Param("categoriaId") Long categoriaId,
			@Param("fornecedorId") Long fornecedorId, @Param("apenasAtivos") boolean apenasAtivos,
			@Param("estoqueBaixo") boolean estoqueBaixo, Pageable pageable);

	@Query("select p from Produto p where p.ativo = true and p.estoque <= p.estoqueMinimo order by p.estoque asc")
	List<Produto> comEstoqueBaixo(Pageable pageable);

	List<Produto> findByAtivoTrueAndEstoqueGreaterThan(int estoque);

	boolean existsByCategoriaId(Long categoriaId);

	boolean existsByFornecedorId(Long fornecedorId);

	boolean existsBySkuIgnoreCase(String sku);

	boolean existsBySkuIgnoreCaseAndIdNot(String sku, Long id);
}
