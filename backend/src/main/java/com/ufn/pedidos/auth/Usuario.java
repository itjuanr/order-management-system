package com.ufn.pedidos.auth;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "usuarios")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Usuario {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String nome;

	private String login;

	private String email;

	@Column(name = "senha")
	private String senhaHash;

	@Enumerated(EnumType.STRING)
	private Role role;

	private LocalDateTime criadoEm;

	public Usuario(String nome, String login, String email, String senhaHash, Role role) {
		this.nome = nome;
		this.login = login;
		this.email = email;
		this.senhaHash = senhaHash;
		this.role = role;
		this.criadoEm = LocalDateTime.now();
	}

	public void atualizarPerfil(String nome, String email) {
		this.nome = nome;
		this.email = email;
	}

	public void alterarSenha(String novaSenhaHash) {
		this.senhaHash = novaSenhaHash;
	}
}
