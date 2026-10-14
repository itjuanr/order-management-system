package com.ufn.pedidos.auth;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ufn.pedidos.auth.AuthDtos.LoginRequest;
import com.ufn.pedidos.auth.AuthDtos.LoginResponse;
import com.ufn.pedidos.auth.AuthDtos.RegistroRequest;
import com.ufn.pedidos.common.RegraDeNegocioException;

@Service
public class AuthService {

	private final UsuarioRepository usuarios;
	private final PasswordEncoder passwordEncoder;
	private final TokenService tokenService;

	public AuthService(UsuarioRepository usuarios, PasswordEncoder passwordEncoder, TokenService tokenService) {
		this.usuarios = usuarios;
		this.passwordEncoder = passwordEncoder;
		this.tokenService = tokenService;
	}

	@Transactional(readOnly = true)
	public LoginResponse login(LoginRequest request) {
		Usuario usuario = usuarios.findByLogin(request.login())
				.filter(u -> passwordEncoder.matches(request.senha(), u.getSenhaHash()))
				.orElseThrow(() -> new BadCredentialsException("Login ou senha inválidos"));

		var token = tokenService.gerar(usuario);
		return new LoginResponse(token.token(), token.expiraEm(), usuario.getLogin(), usuario.getNome(),
				usuario.getRole());
	}

	@Transactional
	public void registrar(RegistroRequest request) {
		if (usuarios.existsByLogin(request.login())) {
			throw new RegraDeNegocioException("Já existe um usuário com o login '" + request.login() + "'.");
		}
		usuarios.save(new Usuario(request.nome().trim(), request.login(), request.email(), passwordEncoder.encode(request.senha()), Role.USER));
	}
}
