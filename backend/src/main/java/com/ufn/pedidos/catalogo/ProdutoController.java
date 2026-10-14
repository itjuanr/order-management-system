package com.ufn.pedidos.catalogo;

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

import com.ufn.pedidos.catalogo.CatalogoDtos.ProdutoRequest;
import com.ufn.pedidos.catalogo.CatalogoDtos.ProdutoResponse;
import com.ufn.pedidos.common.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/produtos")
@Tag(name = "Produtos")
public class ProdutoController {

	private final ProdutoService service;

	public ProdutoController(ProdutoService service) {
		this.service = service;
	}

	@GetMapping
	@Operation(summary = "Lista produtos com filtros por texto (nome/SKU), categoria, fornecedor e estoque")
	public PageResponse<ProdutoResponse> listar(@RequestParam(required = false) String busca,
			@RequestParam(required = false) Long categoriaId, @RequestParam(required = false) Long fornecedorId,
			@RequestParam(defaultValue = "false") boolean apenasAtivos,
			@RequestParam(defaultValue = "false") boolean estoqueBaixo,
			@PageableDefault(size = 20, sort = "nome", direction = Sort.Direction.ASC) Pageable pageable) {
		var filtro = new ProdutoService.Filtro(busca, categoriaId, fornecedorId, apenasAtivos, estoqueBaixo);
		return service.listar(filtro, pageable);
	}

	@GetMapping("/{id}")
	public ProdutoResponse buscar(@PathVariable Long id) {
		return service.buscar(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ProdutoResponse criar(@RequestBody @Valid ProdutoRequest request) {
		return service.criar(request);
	}

	@PutMapping("/{id}")
	public ProdutoResponse atualizar(@PathVariable Long id, @RequestBody @Valid ProdutoRequest request) {
		return service.atualizar(id, request);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Exclui um produto que nunca foi vendido")
	public void excluir(@PathVariable Long id) {
		service.excluir(id);
	}
}
