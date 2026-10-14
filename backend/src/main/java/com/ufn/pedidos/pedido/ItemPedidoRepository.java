package com.ufn.pedidos.pedido;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ItemPedidoRepository extends JpaRepository<ItemPedido, Long> {

	boolean existsByProdutoId(Long produtoId);

	/** [produtoId, nome, quantidade vendida, receita] dos produtos mais vendidos em pedidos não cancelados e pagos. */
	@Query("""
			select i.produto.id, i.produto.nome, sum(i.quantidade), sum(i.precoUnitario * i.quantidade)
			from ItemPedido i
			where i.pedido.status in (com.ufn.pedidos.pedido.StatusPedido.PAGO,
			                          com.ufn.pedidos.pedido.StatusPedido.ENVIADO,
			                          com.ufn.pedidos.pedido.StatusPedido.ENTREGUE)
			group by i.produto.id, i.produto.nome
			order by sum(i.precoUnitario * i.quantidade) desc
			""")
	List<Object[]> maisVendidos(Pageable pageable);
}
