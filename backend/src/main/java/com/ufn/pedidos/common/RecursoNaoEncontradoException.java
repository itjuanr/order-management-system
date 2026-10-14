package com.ufn.pedidos.common;

public class RecursoNaoEncontradoException extends RuntimeException {

	public RecursoNaoEncontradoException(String recurso, Long id) {
		super(recurso + " #" + id + " não existe.");
	}

	public RecursoNaoEncontradoException(String mensagem) {
		super(mensagem);
	}
}
