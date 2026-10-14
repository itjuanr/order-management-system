package com.ufn.pedidos.cliente;

import java.time.LocalDateTime;

import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "clientes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Cliente {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String nome;

	private String cpf;

	private String email;

	private String telefone;

	@Embedded
	private Endereco endereco;

	private LocalDateTime criadoEm;

	public Cliente(String nome, String cpf, String email, String telefone, Endereco endereco) {
		atualizar(nome, cpf, email, telefone, endereco);
		this.criadoEm = LocalDateTime.now();
	}

	public void atualizar(String nome, String cpf, String email, String telefone, Endereco endereco) {
		this.nome = nome;
		this.cpf = cpf;
		this.email = email;
		this.telefone = telefone;
		this.endereco = endereco;
	}
}
