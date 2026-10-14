package com.ufn.pedidos.pedido;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ufn.pedidos.common.PageResponse;
import com.ufn.pedidos.pedido.PedidoDtos.NovoPedidoRequest;
import com.ufn.pedidos.pedido.PedidoDtos.PagamentoRequest;
import com.ufn.pedidos.pedido.PedidoDtos.PedidoResponse;
import com.ufn.pedidos.pedido.PedidoDtos.PedidoResumo;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/pedidos")
@Tag(name = "Pedidos")
public class PedidoController {

	private final PedidoService service;

	public PedidoController(PedidoService service) {
		this.service = service;
	}

	@GetMapping
	@Operation(summary = "Lista pedidos com filtro por status, cliente ou busca (nome do cliente ou número)")
	public PageResponse<PedidoResumo> listar(@RequestParam(required = false) StatusPedido status,
			@RequestParam(required = false) Long clienteId, @RequestParam(required = false) String busca,
			@PageableDefault(size = 20, sort = "criadoEm", direction = Sort.Direction.DESC) Pageable pageable) {
		return service.listar(new PedidoService.Filtro(status, clienteId, busca), pageable);
	}

	@GetMapping("/{id}")
	public PedidoResponse detalhar(@PathVariable Long id) {
		return service.detalhar(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Cria um pedido aguardando pagamento (valida estoque disponível)")
	public PedidoResponse criar(@RequestBody @Valid NovoPedidoRequest request) {
		return service.criar(request);
	}

	@PostMapping("/{id}/pagamento")
	@Operation(summary = "Registra o pagamento do total e baixa o estoque")
	public PedidoResponse pagar(@PathVariable Long id, @RequestBody @Valid PagamentoRequest request) {
		return service.pagar(id, request.metodo());
	}

	@PostMapping("/{id}/envio")
	public PedidoResponse enviar(@PathVariable Long id) {
		return service.enviar(id);
	}

	@PostMapping("/{id}/entrega")
	public PedidoResponse entregar(@PathVariable Long id) {
		return service.entregar(id);
	}

	@PostMapping("/{id}/cancelamento")
	@Operation(summary = "Cancela o pedido; se já pago, devolve os itens ao estoque")
	public PedidoResponse cancelar(@PathVariable Long id) {
		return service.cancelar(id);
	}
}
