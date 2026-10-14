package com.ufn.pedidos.auth;

import java.time.Instant;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

	private AuthDtos() {
	}

	public record LoginRequest(
			@NotBlank(message = "Informe o login") String login,
			@NotBlank(message = "Informe a senha") String senha) {
	}

	public record RegistroRequest(
			@NotBlank(message = "Informe seu nome") @Size(max = 120, message = "Máximo de 120 caracteres") String nome,
			@NotBlank(message = "Informe o login") @Size(min = 3, max = 50, message = "Use de 3 a 50 caracteres") String login,
			@NotBlank(message = "Informe o email") @Email(message = "Email inválido") String email,
			@NotBlank(message = "Informe a senha") @Size(min = 6, max = 72, message = "A senha precisa ter ao menos 6 caracteres") String senha) {
	}

	public record LoginResponse(String token, Instant expiraEm, String login, String nome, Role role) {
	}
}
