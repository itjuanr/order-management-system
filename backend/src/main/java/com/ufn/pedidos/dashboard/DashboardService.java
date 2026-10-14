package com.ufn.pedidos.dashboard;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ufn.pedidos.catalogo.ProdutoRepository;
import com.ufn.pedidos.dashboard.DashboardResponse.FaturamentoMensal;
import com.ufn.pedidos.dashboard.DashboardResponse.ProdutoEstoque;
import com.ufn.pedidos.dashboard.DashboardResponse.ProdutoVendido;
import com.ufn.pedidos.dashboard.DashboardResponse.StatusQuantidade;
import com.ufn.pedidos.pedido.ItemPedidoRepository;
import com.ufn.pedidos.pedido.Pagamento;
import com.ufn.pedidos.pedido.PagamentoRepository;
import com.ufn.pedidos.pedido.PedidoDtos.PedidoResumo;
import com.ufn.pedidos.pedido.PedidoRepository;
import com.ufn.pedidos.pedido.StatusPedido;

@Service
public class DashboardService {

	private static final int MESES_NO_GRAFICO = 6;

	private final PedidoRepository pedidos;
	private final PagamentoRepository pagamentos;
	private final ItemPedidoRepository itens;
	private final ProdutoRepository produtos;
	private final Clock clock;

	public DashboardService(PedidoRepository pedidos, PagamentoRepository pagamentos, ItemPedidoRepository itens,
			ProdutoRepository produtos, Clock clock) {
		this.pedidos = pedidos;
		this.pagamentos = pagamentos;
		this.itens = itens;
		this.produtos = produtos;
		this.clock = clock;
	}

	@Transactional(readOnly = true)
	public DashboardResponse resumo() {
		YearMonth mesAtual = YearMonth.now(clock);
		YearMonth primeiroMes = mesAtual.minusMonths(MESES_NO_GRAFICO - 1);

		// Agregado em memória para manter as queries portáveis entre H2 e MySQL.
		Map<YearMonth, List<Pagamento>> porMes = pagamentos.faturadosDesde(primeiroMes.atDay(1).atStartOfDay())
				.stream()
				.collect(Collectors.groupingBy(pg -> YearMonth.from(pg.getPagoEm())));

		List<FaturamentoMensal> mensal = IntStream.range(0, MESES_NO_GRAFICO)
				.mapToObj(primeiroMes::plusMonths)
				.map(mes -> {
					var lista = porMes.getOrDefault(mes, List.of());
					return new FaturamentoMensal(mes.toString(), somar(lista), lista.size());
				})
				.toList();

		FaturamentoMensal atual = mensal.get(mensal.size() - 1);
		LocalDateTime mesmoMomentoMesPassado = LocalDateTime.now(clock).minusMonths(1);
		BigDecimal mesmoPeriodoAnterior = somar(porMes.getOrDefault(mesAtual.minusMonths(1), List.of()).stream()
				.filter(pg -> !pg.getPagoEm().isAfter(mesmoMomentoMesPassado))
				.toList());
		BigDecimal ticketMedio = atual.vendas() == 0 ? BigDecimal.ZERO
				: atual.valor().divide(BigDecimal.valueOf(atual.vendas()), 2, RoundingMode.HALF_UP);

		Map<StatusPedido, Long> contagem = new EnumMap<>(StatusPedido.class);
		pedidos.contarPorStatus().forEach(row -> contagem.put((StatusPedido) row[0], (Long) row[1]));
		List<StatusQuantidade> porStatus = Arrays.stream(StatusPedido.values())
				.map(s -> new StatusQuantidade(s, contagem.getOrDefault(s, 0L)))
				.toList();

		List<ProdutoEstoque> estoqueBaixo = produtos.comEstoqueBaixo(PageRequest.of(0, 5)).stream()
				.map(p -> new ProdutoEstoque(p.getId(), p.getNome(), p.getSku(), p.getEstoque(), p.getEstoqueMinimo()))
				.toList();

		List<ProdutoVendido> maisVendidos = itens.maisVendidos(PageRequest.of(0, 5)).stream()
				.map(r -> new ProdutoVendido((Long) r[0], (String) r[1], ((Number) r[2]).longValue(), (BigDecimal) r[3]))
				.toList();

		List<PedidoResumo> ultimos = pedidos
				.buscar(null, null, null, PageRequest.of(0, 6, Sort.by(Sort.Direction.DESC, "criadoEm")))
				.map(PedidoResumo::of)
				.getContent();

		return new DashboardResponse(atual.valor(), mesmoPeriodoAnterior, atual.vendas(), ticketMedio,
				contagem.getOrDefault(StatusPedido.AGUARDANDO_PAGAMENTO, 0L),
				contagem.getOrDefault(StatusPedido.PAGO, 0L), mensal, porStatus, estoqueBaixo, maisVendidos, ultimos);
	}

	private static BigDecimal somar(List<Pagamento> lista) {
		return lista.stream().map(Pagamento::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);
	}
}
