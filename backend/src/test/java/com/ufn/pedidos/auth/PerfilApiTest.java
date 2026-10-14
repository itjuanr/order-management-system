package com.ufn.pedidos.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import com.ufn.pedidos.ApiTest;

@ApiTest
@WithMockUser(username = "admin")
class PerfilApiTest {

	@Autowired
	private MockMvc mvc;

	@Test
	void mostraEAtualizaOPerfilDoUsuarioLogado() throws Exception {
		mvc.perform(get("/api/me"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.login").value("admin"))
				.andExpect(jsonPath("$.nome").value("Marina Duarte"));

		mvc.perform(put("/api/me").contentType(MediaType.APPLICATION_JSON)
						.content("{\"nome\":\"Marina D. Souza\",\"email\":\"marina@pontonorte.com.br\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.nome").value("Marina D. Souza"));
	}

	@Test
	void trocaDeSenhaExigeASenhaAtual() throws Exception {
		mvc.perform(put("/api/me/senha").contentType(MediaType.APPLICATION_JSON)
						.content("{\"senhaAtual\":\"errada\",\"novaSenha\":\"novasenha1\"}"))
				.andExpect(status().isUnprocessableEntity())
				.andExpect(jsonPath("$.detail").value("A senha atual não confere."));

		mvc.perform(put("/api/me/senha").contentType(MediaType.APPLICATION_JSON)
						.content("{\"senhaAtual\":\"admin123\",\"novaSenha\":\"novasenha1\"}"))
				.andExpect(status().isNoContent());

		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
						.content("{\"login\":\"admin\",\"senha\":\"novasenha1\"}"))
				.andExpect(status().isOk());
	}

	@Test
	void infoDoSistemaEPublica() throws Exception {
		mvc.perform(get("/api/info")).andExpect(status().isOk()).andExpect(jsonPath("$.bancoOk").value(true));
	}
}
