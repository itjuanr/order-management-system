package com.ufn.pedidos.catalogo;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ufn.pedidos.catalogo.CatalogoDtos.FornecedorRequest;
import com.ufn.pedidos.catalogo.CatalogoDtos.FornecedorResponse;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/fornecedores")
@Tag(name = "Fornecedores")
public class FornecedorController {

	private final FornecedorService service;

	public FornecedorController(FornecedorService service) {
		this.service = service;
	}

	@GetMapping
	public List<FornecedorResponse> listar() {
		return service.listar();
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public FornecedorResponse criar(@RequestBody @Valid FornecedorRequest request) {
		return service.criar(request);
	}

	@PutMapping("/{id}")
	public FornecedorResponse atualizar(@PathVariable Long id, @RequestBody @Valid FornecedorRequest request) {
		return service.atualizar(id, request);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void excluir(@PathVariable Long id) {
		service.excluir(id);
	}
}
