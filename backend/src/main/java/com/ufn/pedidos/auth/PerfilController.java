package com.ufn.pedidos.auth;

import java.security.Principal;
import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ufn.pedidos.common.RegraDeNegocioException;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Dados do usuário autenticado ("Meu perfil"). */
@RestController
@RequestMapping("/api/me")
@Tag(name = "Perfil")
public class PerfilController {

	private final UsuarioRepository usuarios;
	private final PasswordEncoder passwordEncoder;

	public PerfilController(UsuarioRepository usuarios, PasswordEncoder passwordEncoder) {
		this.usuarios = usuarios;
		this.passwordEncoder = passwordEncoder;
	}

	public record PerfilResponse(Long id, String nome, String login, String email, Role role, LocalDateTime criadoEm) {

		static PerfilResponse of(Usuario u) {
			return new PerfilResponse(u.getId(), u.getNome(), u.getLogin(), u.getEmail(), u.getRole(), u.getCriadoEm());
		}
	}

	public record PerfilRequest(
			@NotBlank(message = "Informe seu nome") @Size(max = 120, message = "Máximo de 120 caracteres") String nome,
			@NotBlank(message = "Informe o email") @Email(message = "Email inválido") @Size(max = 120) String email) {
	}

	public record SenhaRequest(
			@NotBlank(message = "Informe a senha atual") String senhaAtual,
			@NotBlank(message = "Informe a nova senha") @Size(min = 6, max = 72, message = "A senha precisa ter ao menos 6 caracteres") String novaSenha) {
	}

	@GetMapping
	@Transactional(readOnly = true)
	public PerfilResponse perfil(Principal principal) {
		return PerfilResponse.of(atual(principal));
	}

	@PutMapping
	@Transactional
	@Operation(summary = "Atualiza nome e email do usuário logado")
	public PerfilResponse atualizar(Principal principal, @RequestBody @Valid PerfilRequest request) {
		Usuario usuario = atual(principal);
		usuario.atualizarPerfil(request.nome().trim(), request.email().trim());
		return PerfilResponse.of(usuario);
	}

	@PutMapping("/senha")
	@Transactional
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Troca a senha, exigindo a senha atual")
	public void alterarSenha(Principal principal, @RequestBody @Valid SenhaRequest request) {
		Usuario usuario = atual(principal);
		if (!passwordEncoder.matches(request.senhaAtual(), usuario.getSenhaHash())) {
			throw new RegraDeNegocioException("A senha atual não confere.");
		}
		if (request.senhaAtual().equals(request.novaSenha())) {
			throw new RegraDeNegocioException("A nova senha precisa ser diferente da atual.");
		}
		usuario.alterarSenha(passwordEncoder.encode(request.novaSenha()));
	}

	private Usuario atual(Principal principal) {
		return usuarios.findByLogin(principal.getName())
				.orElseThrow(() -> new RegraDeNegocioException("Usuário da sessão não existe mais."));
	}
}
