package com.ufn.pedidos.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnResource;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Quando o front-end é empacotado no jar (perfil Maven "embed"), as rotas do Angular
 * (/pedidos/12, /clientes…) precisam devolver o index.html para o roteador do navegador assumir.
 * Rotas com ponto (arquivos estáticos) e as da API não passam por aqui.
 */
@Controller
@ConditionalOnResource(resources = "classpath:/static/index.html")
public class SpaController {

	@GetMapping({ "/", "/{rota:[^.]*}", "/{rota:[^.]*}/{sub:[^.]*}", "/{rota:[^.]*}/{sub:[^.]*}/{extra:[^.]*}" })
	public String index() {
		return "forward:/index.html";
	}
}
