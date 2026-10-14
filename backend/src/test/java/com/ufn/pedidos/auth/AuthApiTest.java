package com.ufn.pedidos.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;
import com.ufn.pedidos.ApiTest;

@ApiTest
class AuthApiTest {

	@Autowired
	private MockMvc mvc;

	@Test
	void adminPadraoConsegueEntrarEUsarOTokenNaApi() throws Exception {
		String resposta = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
						.content("{\"login\":\"admin\",\"senha\":\"admin123\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.role").value("ADMIN"))
				.andReturn().getResponse().getContentAsString();
		String token = JsonPath.read(resposta, "$.token");

		mvc.perform(get("/api/clientes").header("Authorization", "Bearer " + token)).andExpect(status().isOk());
	}

	@Test
	void senhaErradaDevolve401ComMensagem() throws Exception {
		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
						.content("{\"login\":\"admin\",\"senha\":\"errada\"}"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.detail").value("Login ou senha inválidos."));
	}

	@Test
	void rotasDaApiExigemToken() throws Exception {
		mvc.perform(get("/api/pedidos")).andExpect(status().isUnauthorized());
		mvc.perform(get("/api/pedidos").header("Authorization", "Bearer token-falso")).andExpect(status().isUnauthorized());
	}

	@Test
	void registroCriaUsuarioQuePodeEntrar() throws Exception {
		mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
						.content("{\"nome\":\"Maria Souza\",\"login\":\"maria\",\"email\":\"maria@email.com\",\"senha\":\"segredo1\"}"))
				.andExpect(status().isCreated());

		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
						.content("{\"login\":\"maria\",\"senha\":\"segredo1\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.role").value("USER"));
	}
}
