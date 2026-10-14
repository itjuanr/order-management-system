package com.ufn.pedidos.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.jwt")
public record JwtProperties(String secret, int expirationHours) {
}
