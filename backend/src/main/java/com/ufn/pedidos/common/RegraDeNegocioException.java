package com.ufn.pedidos.common;

/** Violação de uma regra do domínio (estoque insuficiente, transição de status inválida etc.). */
public class RegraDeNegocioException extends RuntimeException {

	public RegraDeNegocioException(String mensagem) {
		super(mensagem);
	}
}
