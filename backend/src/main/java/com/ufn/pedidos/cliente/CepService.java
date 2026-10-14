package com.ufn.pedidos.cliente;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Consulta de CEP no ViaCEP (https://viacep.com.br), API pública e gratuita.
 * A chamada sai do servidor para não depender de CORS no navegador; resultados ficam em cache em memória.
 */
@Service
public class CepService {

	public record EnderecoPorCep(String cep, String logradouro, String bairro, String cidade, String uf) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	record RespostaViaCep(String cep, String logradouro, String bairro, String localidade, String uf, Boolean erro) {
	}

	public static class CepIndisponivelException extends RuntimeException {
		CepIndisponivelException(Throwable causa) {
			super("O serviço de CEP não respondeu. Preencha o endereço manualmente.", causa);
		}
	}

	private final RestClient http;
	private final Map<String, Optional<EnderecoPorCep>> cache = new ConcurrentHashMap<>();

	public CepService(RestClient.Builder builder, @Value("${app.cep.url:https://viacep.com.br/ws}") String url) {
		var cliente = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();
		var fabrica = new JdkClientHttpRequestFactory(cliente);
		fabrica.setReadTimeout(Duration.ofSeconds(4));
		this.http = builder.baseUrl(url).requestFactory(fabrica).build();
	}

	/** Vazio quando o CEP não existe; exceção quando o ViaCEP está fora do ar. */
	public Optional<EnderecoPorCep> buscar(String cep) {
		String digitos = cep.replaceAll("\\D", "");
		if (digitos.length() != 8) {
			return Optional.empty();
		}
		return cache.computeIfAbsent(digitos, this::consultar);
	}

	private Optional<EnderecoPorCep> consultar(String cep) {
		try {
			RespostaViaCep r = http.get().uri("/{cep}/json/", cep).retrieve().body(RespostaViaCep.class);
			if (r == null || Boolean.TRUE.equals(r.erro())) {
				return Optional.empty();
			}
			return Optional.of(new EnderecoPorCep(cep, r.logradouro(), r.bairro(), r.localidade(), r.uf()));
		} catch (RestClientException e) {
			throw new CepIndisponivelException(e);
		}
	}
}
