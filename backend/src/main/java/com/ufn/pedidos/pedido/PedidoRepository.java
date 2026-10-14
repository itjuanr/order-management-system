package com.ufn.pedidos.pedido;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

	@EntityGraph(attributePaths = { "cliente", "pagamento" })
	@Query("""
			select p from Pedido p
			where (:status is null or p.status = :status)
			  and (:clienteId is null or p.cliente.id = :clienteId)
			  and (:busca is null
			       or lower(p.cliente.nome) like lower(concat('%', :busca, '%'))
			       or str(p.id) = :busca)
			""")
	Page<Pedido> buscar(@Param("status") StatusPedido status, @Param("clienteId") Long clienteId,
			@Param("busca") String busca, Pageable pageable);

	@EntityGraph(attributePaths = { "cliente", "pagamento", "itens", "itens.produto" })
	@Query("select p from Pedido p where p.id = :id")
	Optional<Pedido> detalhar(@Param("id") Long id);

	@Query("select p.status, count(p) from Pedido p group by p.status")
	List<Object[]> contarPorStatus();

	long countByCriadoEmGreaterThanEqual(LocalDateTime desde);

	boolean existsByClienteId(Long clienteId);

	// Usados pelo simulador para achar pedidos "parados" há algum tempo em cada etapa.
	List<Pedido> findTop3ByStatusAndCriadoEmBeforeOrderByCriadoEmAsc(StatusPedido status, LocalDateTime limite);

	List<Pedido> findTop3ByStatusAndPagoEmBeforeOrderByPagoEmAsc(StatusPedido status, LocalDateTime limite);

	List<Pedido> findTop3ByStatusAndEnviadoEmBeforeOrderByEnviadoEmAsc(StatusPedido status, LocalDateTime limite);
}
