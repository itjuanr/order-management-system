package com.ufn.pedidos.cliente;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ufn.pedidos.cliente.ClienteDtos.ClienteRequest;
import com.ufn.pedidos.cliente.ClienteDtos.ClienteResponse;
import com.ufn.pedidos.common.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/clientes")
@Tag(name = "Clientes")
public class ClienteController {

	private final ClienteService service;

	public ClienteController(ClienteService service) {
		this.service = service;
	}

	@GetMapping
	@Operation(summary = "Lista clientes, com busca por nome, email ou CPF")
	public PageResponse<ClienteResponse> listar(@RequestParam(required = false) String busca,
			@PageableDefault(size = 20, sort = "nome", direction = Sort.Direction.ASC) Pageable pageable) {
		return service.listar(busca, pageable);
	}

	@GetMapping("/{id}")
	public ClienteResponse buscar(@PathVariable Long id) {
		return service.buscar(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ClienteResponse criar(@RequestBody @Valid ClienteRequest request) {
		return service.criar(request);
	}

	@PutMapping("/{id}")
	public ClienteResponse atualizar(@PathVariable Long id, @RequestBody @Valid ClienteRequest request) {
		return service.atualizar(id, request);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Exclui um cliente sem pedidos")
	public void excluir(@PathVariable Long id) {
		service.excluir(id);
	}
}
