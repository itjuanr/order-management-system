package com.ufn.pedidos.simulador;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.LongConsumer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.ufn.pedidos.catalogo.Produto;
import com.ufn.pedidos.catalogo.ProdutoRepository;
import com.ufn.pedidos.cliente.ClienteRepository;
import com.ufn.pedidos.common.RegraDeNegocioException;
import com.ufn.pedidos.pedido.MetodoPagamento;
import com.ufn.pedidos.pedido.Pedido;
import com.ufn.pedidos.pedido.PedidoDtos.ItemRequest;
import com.ufn.pedidos.pedido.PedidoDtos.NovoPedidoRequest;
import com.ufn.pedidos.pedido.PedidoRepository;
import com.ufn.pedidos.pedido.PedidoService;
import com.ufn.pedidos.pedido.StatusPedido;

/**
 * Simula a operação de uma loja em tempo acelerado: clientes fazem pedidos, pagam, a loja envia e a
 * transportadora entrega. Tudo passa pelo {@link PedidoService}, então as regras (estoque, transições
 * de status) são as mesmas das ações feitas na tela.
 */
@Service
public class SimuladorService {

	private static final Logger log = LoggerFactory.getLogger(SimuladorService.class);

	/** Tempo (em segundos) que um pedido fica em cada etapa antes de o simulador avançá-lo. */
	private static final int SEGUNDOS_ATE_PAGAR = 15;
	private static final int SEGUNDOS_ATE_ENVIAR = 20;
	private static final int SEGUNDOS_ATE_ENTREGAR = 30;

	private final PedidoService pedidoService;
	private final PedidoRepository pedidos;
	private final ClienteRepository clientes;
	private final ProdutoRepository produtos;
	private final Clock clock;
	private final AtomicBoolean ativo;
	private final long intervaloMs;

	public SimuladorService(PedidoService pedidoService, PedidoRepository pedidos, ClienteRepository clientes,
			ProdutoRepository produtos, Clock clock, @Value("${app.simulador.ativo:false}") boolean ativo,
			@Value("${app.simulador.intervalo-ms:6000}") long intervaloMs) {
		this.pedidoService = pedidoService;
		this.pedidos = pedidos;
		this.clientes = clientes;
		this.produtos = produtos;
		this.clock = clock;
		this.ativo = new AtomicBoolean(ativo);
		this.intervaloMs = intervaloMs;
	}

	public record Estado(boolean ativo, long intervaloSegundos) {
	}

	public Estado estado() {
		return new Estado(ativo.get(), intervaloMs / 1000);
	}

	public Estado alterar(boolean ligar) {
		if (ativo.getAndSet(ligar) != ligar) {
			log.info("Simulador {}.", ligar ? "ligado" : "desligado");
		}
		return estado();
	}

	@Scheduled(fixedDelayString = "${app.simulador.intervalo-ms:6000}", initialDelay = 5000)
	public void passo() {
		if (!ativo.get()) {
			return;
		}
		LocalDateTime agora = LocalDateTime.now(clock);
		avancar(pedidos.findTop3ByStatusAndCriadoEmBeforeOrderByCriadoEmAsc(StatusPedido.AGUARDANDO_PAGAMENTO,
				agora.minusSeconds(SEGUNDOS_ATE_PAGAR)), this::pagarOuCancelar);
		avancar(pedidos.findTop3ByStatusAndPagoEmBeforeOrderByPagoEmAsc(StatusPedido.PAGO,
				agora.minusSeconds(SEGUNDOS_ATE_ENVIAR)), pedidoService::enviar);
		avancar(pedidos.findTop3ByStatusAndEnviadoEmBeforeOrderByEnviadoEmAsc(StatusPedido.ENVIADO,
				agora.minusSeconds(SEGUNDOS_ATE_ENTREGAR)), pedidoService::entregar);

		if (ThreadLocalRandom.current().nextDouble() < 0.65) {
			criarPedido();
		}
	}

	private void pagarOuCancelar(long id) {
		var sorte = ThreadLocalRandom.current().nextDouble();
		if (sorte < 0.08) {
			pedidoService.cancelar(id);
			return;
		}
		MetodoPagamento[] metodos = MetodoPagamento.values();
		pedidoService.pagar(id, sorte < 0.5 ? MetodoPagamento.PIX : metodos[ThreadLocalRandom.current().nextInt(metodos.length)]);
	}

	private void criarPedido() {
		long totalClientes = clientes.count();
		List<Produto> disponiveis = new ArrayList<>(produtos.findByAtivoTrueAndEstoqueGreaterThan(5));
		if (totalClientes == 0 || disponiveis.isEmpty()) {
			return;
		}
		var random = ThreadLocalRandom.current();
		var cliente = clientes.findAll(PageRequest.of(random.nextInt((int) totalClientes), 1)).getContent().get(0);

		Collections.shuffle(disponiveis);
		int quantidadeProdutos = 1 + (random.nextDouble() < 0.4 ? 1 : 0) + (random.nextDouble() < 0.15 ? 1 : 0);
		List<ItemRequest> itens = disponiveis.stream()
				.limit(quantidadeProdutos)
				.map(p -> new ItemRequest(p.getId(), 1 + (random.nextDouble() < 0.25 ? 1 : 0)))
				.toList();

		try {
			pedidoService.criar(new NovoPedidoRequest(cliente.getId(), itens, null));
		} catch (RegraDeNegocioException e) {
			log.debug("Simulador pulou um pedido: {}", e.getMessage());
		}
	}

	private void avancar(List<Pedido> candidatos, LongConsumer acao) {
		for (Pedido pedido : candidatos) {
			try {
				acao.accept(pedido.getId());
			} catch (RegraDeNegocioException e) {
				log.debug("Simulador não avançou o pedido #{}: {}", pedido.getId(), e.getMessage());
			}
		}
	}
}
