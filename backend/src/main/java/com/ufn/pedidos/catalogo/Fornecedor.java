package com.ufn.pedidos.catalogo;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "fornecedores")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Fornecedor {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String nome;

	private String cnpj;

	private String email;

	private String telefone;

	public Fornecedor(String nome, String cnpj, String email, String telefone) {
		atualizar(nome, cnpj, email, telefone);
	}

	public void atualizar(String nome, String cnpj, String email, String telefone) {
		this.nome = nome;
		this.cnpj = cnpj;
		this.email = email;
		this.telefone = telefone;
	}
}
