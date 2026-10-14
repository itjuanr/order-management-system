package com.ufn.pedidos.pedido;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PagamentoRepository extends JpaRepository<Pagamento, Long> {

	/** Pagamentos que contam como faturamento: de pedidos que não foram cancelados depois. */
	@Query("""
			select pg from Pagamento pg join fetch pg.pedido p
			where pg.pagoEm >= :desde and p.status <> com.ufn.pedidos.pedido.StatusPedido.CANCELADO
			""")
	List<Pagamento> faturadosDesde(@Param("desde") LocalDateTime desde);
}
