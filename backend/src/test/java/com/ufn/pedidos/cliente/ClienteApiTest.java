package com.ufn.pedidos.cliente;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import com.ufn.pedidos.ApiTest;

@ApiTest
@WithMockUser
class ClienteApiTest {

	private static final String CLIENTE_VALIDO = """
			{"nome": "Bruno Lima", "cpf": "529.982.247-25", "email": "bruno@email.com", "telefone": "(55) 99999-1234"}
			""";

	@Autowired
	private MockMvc mvc;

	@Test
	void criaClienteGuardandoSoOsDigitosDoCpfEDoTelefone() throws Exception {
		mvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON).content(CLIENTE_VALIDO))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.cpf").value("52998224725"))
				.andExpect(jsonPath("$.telefone").value("55999991234"));

		mvc.perform(get("/api/clientes").param("busca", "bruno"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(1));
	}

	@Test
	void recusaCpfDuplicado() throws Exception {
		mvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON).content(CLIENTE_VALIDO))
				.andExpect(status().isCreated());

		mvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON).content(CLIENTE_VALIDO))
				.andExpect(status().isUnprocessableEntity())
				.andExpect(jsonPath("$.detail").value("Já existe um cliente com este CPF."));
	}

	@Test
	void devolveErrosPorCampo() throws Exception {
		mvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON)
						.content("{\"nome\":\"\",\"cpf\":\"111.111.111-11\",\"email\":\"sem-arroba\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.erros.nome").value("Informe o nome"))
				.andExpect(jsonPath("$.erros.cpf").value("CPF inválido"))
				.andExpect(jsonPath("$.erros.email").value("Email inválido"));
	}
}
