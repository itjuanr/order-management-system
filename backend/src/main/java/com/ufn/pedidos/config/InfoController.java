package com.ufn.pedidos.config;

import java.sql.Connection;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/** Informações públicas da instância, usadas pelo rodapé do sistema como indicador de status. */
@RestController
@RequestMapping("/api/info")
@Tag(name = "Sistema")
public class InfoController {

	private final Environment environment;
	private final DataSource dataSource;
	private final String versao;
	private final Instant iniciadoEm = Instant.now();

	public InfoController(Environment environment, DataSource dataSource,
			@Value("${app.versao:2.0.0}") String versao) {
		this.environment = environment;
		this.dataSource = dataSource;
		this.versao = versao;
	}

	public record InfoResponse(String versao, String ambiente, String banco, boolean bancoOk, long minutosNoAr) {
	}

	@GetMapping
	@Operation(summary = "Versão, ambiente e saúde do banco")
	public InfoResponse info() {
		String[] perfis = environment.getActiveProfiles().length > 0 ? environment.getActiveProfiles()
				: environment.getDefaultProfiles();
		String ambiente = String.join(",", Arrays.asList(perfis));
		String banco = "desconhecido";
		boolean ok = false;
		try (Connection c = dataSource.getConnection()) {
			banco = c.getMetaData().getDatabaseProductName();
			ok = c.isValid(2);
		} catch (Exception e) {
			// banco indisponível: o rodapé mostra o status como degradado
		}
		return new InfoResponse(versao, ambiente.isEmpty() ? "default" : ambiente, banco, ok,
				Duration.between(iniciadoEm, Instant.now()).toMinutes());
	}
}
