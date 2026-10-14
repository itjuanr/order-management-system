package com.ufn.pedidos.catalogo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.ufn.pedidos.catalogo.CatalogoDtos.CategoriaResponse;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {

	@Query("""
			select new com.ufn.pedidos.catalogo.CatalogoDtos$CategoriaResponse(c.id, c.nome, c.descricao, count(p))
			from Categoria c left join Produto p on p.categoria = c
			group by c.id, c.nome, c.descricao
			order by c.nome
			""")
	List<CategoriaResponse> listarComTotais();

	boolean existsByNomeIgnoreCase(String nome);

	boolean existsByNomeIgnoreCaseAndIdNot(String nome, Long id);
}
