package com.ufn.pedidos.cliente;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

	@Query("""
			select c from Cliente c
			where :busca is null
			   or lower(c.nome) like lower(concat('%', :busca, '%'))
			   or lower(c.email) like lower(concat('%', :busca, '%'))
			   or c.cpf like concat('%', :busca, '%')
			""")
	Page<Cliente> buscar(@Param("busca") String busca, Pageable pageable);

	boolean existsByCpf(String cpf);

	boolean existsByCpfAndIdNot(String cpf, Long id);
}
