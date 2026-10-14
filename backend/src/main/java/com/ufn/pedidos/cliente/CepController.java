package com.ufn.pedidos.cliente;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ufn.pedidos.cliente.CepService.CepIndisponivelException;
import com.ufn.pedidos.cliente.CepService.EnderecoPorCep;
import com.ufn.pedidos.common.RecursoNaoEncontradoException;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/cep")
@Tag(name = "CEP")
public class CepController {

	private final CepService service;

	public CepController(CepService service) {
		this.service = service;
	}

	@GetMapping("/{cep}")
	@Operation(summary = "Endereço de um CEP (consulta o ViaCEP)")
	public EnderecoPorCep buscar(@PathVariable String cep) {
		return service.buscar(cep)
				.orElseThrow(() -> new RecursoNaoEncontradoException("CEP " + cep + " não encontrado."));
	}

	@ExceptionHandler(CepIndisponivelException.class)
	ProblemDetail indisponivel(CepIndisponivelException ex) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage());
		problem.setTitle("Serviço externo indisponível");
		return problem;
	}
}
