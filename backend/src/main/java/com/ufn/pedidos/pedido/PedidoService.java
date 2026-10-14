package com.ufn.pedidos.pedido;

import java.text.NumberFormat;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.function.Consumer;
import java.util.function.Function;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.ufn.pedidos.atividade.AtividadeService;
import com.ufn.pedidos.atividade.AtividadeService.TipoAtividade;
import com.ufn.pedidos.catalogo.ProdutoService;
import com.ufn.pedidos.cliente.ClienteService;
import com.ufn.pedidos.common.PageResponse;
import com.ufn.pedidos.common.RecursoNaoEncontradoException;
import com.ufn.pedidos.pedido.PedidoDtos.NovoPedidoRequest;
import com.ufn.pedidos.pedido.PedidoDtos.PedidoResponse;
import com.ufn.pedidos.pedido.PedidoDtos.PedidoResumo;

@Service
public class PedidoService {

	private final PedidoRepository pedidos;
	private final ClienteService clientes;
	private final ProdutoService produtos;
	private final AtividadeService atividades;
	private final Clock clock;

	public PedidoService(PedidoRepository pedidos, ClienteService clientes, ProdutoService produtos,
			AtividadeService atividades, Clock clock) {
		this.pedidos = pedidos;
		this.clientes = clientes;
		this.produtos = produtos;
		this.atividades = atividades;
		this.clock = clock;
	}

	public record Filtro(StatusPedido status, Long clienteId, String busca) {
	}

	@Transactional(readOnly = true)
	public PageResponse<PedidoResumo> listar(Filtro filtro, Pageable pageable) {
		String busca = StringUtils.hasText(filtro.busca()) ? filtro.busca().trim().replace("#", "") : null;
		return PageResponse.of(pedidos.buscar(filtro.status(), filtro.clienteId(), busca, pageable), PedidoResumo::of);
	}

	@Transactional(readOnly = true)
	public PedidoResponse detalhar(Long id) {
		return PedidoResponse.of(encontrar(id));
	}

	@Transactional
	public PedidoResponse criar(NovoPedidoRequest request) {
		var pedido = new Pedido(clientes.encontrar(request.clienteId()), vazioParaNulo(request.observacao()), agora());
		request.itens().forEach(item -> pedido.adicionarItem(produtos.encontrar(item.produtoId()), item.quantidade()));
		Pedido salvo = pedidos.save(pedido);
		atividades.registrar(TipoAtividade.CRIADO, salvo.getId(),
				"Pedido #" + salvo.getId() + " criado para " + salvo.getCliente().getNome() + " · " + moeda(salvo));
		return PedidoResponse.of(salvo);
	}

	@Transactional
	public PedidoResponse pagar(Long id, MetodoPagamento metodo) {
		return executar(id, p -> p.pagar(metodo, agora()), TipoAtividade.PAGO,
				p -> "Pagamento de " + moeda(p) + " recebido no pedido #" + p.getId());
	}

	@Transactional
	public PedidoResponse enviar(Long id) {
		return executar(id, p -> p.enviar(agora()), TipoAtividade.ENVIADO,
				p -> "Pedido #" + p.getId() + " enviado para " + cidade(p));
	}

	@Transactional
	public PedidoResponse entregar(Long id) {
		return executar(id, p -> p.entregar(agora()), TipoAtividade.ENTREGUE,
				p -> "Pedido #" + p.getId() + " entregue a " + p.getCliente().getNome());
	}

	@Transactional
	public PedidoResponse cancelar(Long id) {
		return executar(id, p -> p.cancelar(agora()), TipoAtividade.CANCELADO,
				p -> "Pedido #" + p.getId() + " cancelado");
	}

	private PedidoResponse executar(Long id, Consumer<Pedido> acao, TipoAtividade tipo,
			Function<Pedido, String> descricao) {
		Pedido pedido = encontrar(id);
		acao.accept(pedido);
		Pedido salvo = pedidos.saveAndFlush(pedido);
		atividades.registrar(tipo, salvo.getId(), descricao.apply(salvo));
		return PedidoResponse.of(salvo);
	}

	private static String moeda(Pedido p) {
		return NumberFormat.getCurrencyInstance(Locale.forLanguageTag("pt-BR")).format(p.getTotal());
	}

	private static String cidade(Pedido p) {
		var endereco = p.getCliente().getEndereco();
		return endereco == null ? p.getCliente().getNome() : endereco.cidade() + "/" + endereco.uf();
	}

	private Pedido encontrar(Long id) {
		return pedidos.detalhar(id).orElseThrow(() -> new RecursoNaoEncontradoException("Pedido", id));
	}

	private LocalDateTime agora() {
		return LocalDateTime.now(clock);
	}

	private static String vazioParaNulo(String valor) {
		return valor == null || valor.isBlank() ? null : valor.trim();
	}
}
