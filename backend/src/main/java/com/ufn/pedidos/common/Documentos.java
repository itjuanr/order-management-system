package com.ufn.pedidos.common;

public final class Documentos {

	private Documentos() {
	}

	/** Remove máscara de CPF, CNPJ e telefone; o banco guarda só os dígitos. */
	public static String apenasDigitos(String valor) {
		if (valor == null || valor.isBlank()) {
			return null;
		}
		return valor.replaceAll("\\D", "");
	}
}
