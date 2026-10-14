package com.ufn.pedidos.simulador;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ufn.pedidos.atividade.AtividadeService;
import com.ufn.pedidos.atividade.AtividadeService.Atividade;
import com.ufn.pedidos.simulador.SimuladorService.Estado;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotNull;

@RestController
@RequestMapping("/api")
@Tag(name = "Operação ao vivo")
public class OperacaoController {

	private final SimuladorService simulador;
	private final AtividadeService atividades;

	public OperacaoController(SimuladorService simulador, AtividadeService atividades) {
		this.simulador = simulador;
		this.atividades = atividades;
	}

	public record AlterarSimulador(@NotNull Boolean ativo) {
	}

	@GetMapping("/simulador")
	public Estado simulador() {
		return simulador.estado();
	}

	@PutMapping("/simulador")
	@Operation(summary = "Liga ou desliga a simulação de pedidos em tempo real")
	public Estado alterar(@RequestBody AlterarSimulador request) {
		return simulador.alterar(Boolean.TRUE.equals(request.ativo()));
	}

	@GetMapping("/atividades")
	@Operation(summary = "Eventos recentes dos pedidos (feitos na tela ou pelo simulador)")
	public List<Atividade> atividades(@RequestParam(defaultValue = "15") int limite) {
		return atividades.recentes(Math.min(Math.max(limite, 1), 60));
	}
}
