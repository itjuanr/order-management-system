package com.ufn.pedidos.catalogo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.ufn.pedidos.catalogo.CatalogoDtos.FornecedorResponse;

public interface FornecedorRepository extends JpaRepository<Fornecedor, Long> {

	@Query("""
			select new com.ufn.pedidos.catalogo.CatalogoDtos$FornecedorResponse(f.id, f.nome, f.cnpj, f.email, f.telefone, count(p))
			from Fornecedor f left join Produto p on p.fornecedor = f
			group by f.id, f.nome, f.cnpj, f.email, f.telefone
			order by f.nome
			""")
	List<FornecedorResponse> listarComTotais();

	boolean existsByCnpj(String cnpj);

	boolean existsByCnpjAndIdNot(String cnpj, Long id);
}
