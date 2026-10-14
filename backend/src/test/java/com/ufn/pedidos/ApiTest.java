package com.ufn.pedidos;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/** Sobe a aplicação completa com H2, sem os dados de demonstração; cada teste roda numa transação revertida. */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest(properties = "app.seed.demo-data=false")
@AutoConfigureMockMvc
@Transactional
public @interface ApiTest {
}
