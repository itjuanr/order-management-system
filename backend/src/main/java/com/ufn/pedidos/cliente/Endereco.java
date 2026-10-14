package com.ufn.pedidos.cliente;

import jakarta.persistence.Embeddable;

/** Endereço de entrega do cliente (as colunas ficam na própria tabela clientes). */
@Embeddable
public record Endereco(String cep, String logradouro, String numero, String complemento, String bairro, String cidade,
		String uf) {
}
