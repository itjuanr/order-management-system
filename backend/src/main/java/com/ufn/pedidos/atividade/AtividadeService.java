package com.ufn.pedidos.atividade;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Feed de atividade dos pedidos (criação, pagamento, envio...). Fica em memória com os eventos
 * mais recentes: serve ao painel "ao vivo", não é trilha de auditoria.
 */
@Service
public class AtividadeService {

	private static final int LIMITE = 60;

	public enum TipoAtividade {
		CRIADO, PAGO, ENVIADO, ENTREGUE, CANCELADO
	}

	public record Atividade(long id, TipoAtividade tipo, Long pedidoId, String descricao, String autor,
			LocalDateTime quando) {
	}

	private final Deque<Atividade> eventos = new ArrayDeque<>();
	private final AtomicLong sequencia = new AtomicLong();
	private final Clock clock;

	public AtividadeService(Clock clock) {
		this.clock = clock;
	}

	public void registrar(TipoAtividade tipo, Long pedidoId, String descricao) {
		var atividade = new Atividade(sequencia.incrementAndGet(), tipo, pedidoId, descricao, autorAtual(),
				LocalDateTime.now(clock));
		synchronized (eventos) {
			eventos.addFirst(atividade);
			while (eventos.size() > LIMITE) {
				eventos.removeLast();
			}
		}
	}

	public List<Atividade> recentes(int quantidade) {
		synchronized (eventos) {
			return eventos.stream().limit(quantidade).toList();
		}
	}

	/** Quem está logado na requisição; ações sem usuário (agendador) são atribuídas ao simulador. */
	private static String autorAtual() {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		if (auth == null || auth instanceof AnonymousAuthenticationToken) {
			return "Simulador";
		}
		return auth.getName();
	}
}
