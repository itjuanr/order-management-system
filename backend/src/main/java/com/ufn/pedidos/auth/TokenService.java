package com.ufn.pedidos.auth;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;

@Service
public class TokenService {

	private static final String ISSUER = "kairo-api";

	private final Algorithm algorithm;
	private final JWTVerifier verifier;
	private final JwtProperties properties;

	public TokenService(JwtProperties properties) {
		this.properties = properties;
		this.algorithm = Algorithm.HMAC256(properties.secret());
		this.verifier = JWT.require(algorithm).withIssuer(ISSUER).build();
	}

	public TokenGerado gerar(Usuario usuario) {
		Instant expiraEm = Instant.now().plus(properties.expirationHours(), ChronoUnit.HOURS);
		String token = JWT.create()
				.withIssuer(ISSUER)
				.withSubject(usuario.getLogin())
				.withClaim("role", usuario.getRole().name())
				.withExpiresAt(expiraEm)
				.sign(algorithm);
		return new TokenGerado(token, expiraEm);
	}

	public Optional<DecodedJWT> validar(String token) {
		try {
			return Optional.of(verifier.verify(token));
		} catch (JWTVerificationException e) {
			return Optional.empty();
		}
	}

	public record TokenGerado(String token, Instant expiraEm) {
	}
}
