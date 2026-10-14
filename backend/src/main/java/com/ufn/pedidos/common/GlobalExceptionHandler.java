package com.ufn.pedidos.common;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/** Todas as respostas de erro seguem o formato Problem Details (RFC 9457). */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

	@ExceptionHandler(RecursoNaoEncontradoException.class)
	ProblemDetail naoEncontrado(RecursoNaoEncontradoException ex) {
		return problema(HttpStatus.NOT_FOUND, "Não encontrado", ex.getMessage());
	}

	@ExceptionHandler(RegraDeNegocioException.class)
	ProblemDetail regraDeNegocio(RegraDeNegocioException ex) {
		return problema(HttpStatus.UNPROCESSABLE_ENTITY, "Operação não permitida", ex.getMessage());
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	ProblemDetail integridade(DataIntegrityViolationException ex) {
		return problema(HttpStatus.CONFLICT, "Conflito",
				"O registro está em uso ou viola uma restrição de unicidade.");
	}

	@ExceptionHandler(BadCredentialsException.class)
	ProblemDetail credenciais(BadCredentialsException ex) {
		return problema(HttpStatus.UNAUTHORIZED, "Não autorizado", "Login ou senha inválidos.");
	}

	@Override
	protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		Map<String, String> erros = new LinkedHashMap<>();
		ex.getBindingResult().getFieldErrors().forEach(e -> erros.putIfAbsent(e.getField(), e.getDefaultMessage()));

		ProblemDetail body = problema(HttpStatus.BAD_REQUEST, "Dados inválidos", "Verifique os campos destacados.");
		body.setProperty("erros", erros);
		return ResponseEntity.badRequest().body(body);
	}

	private static ProblemDetail problema(HttpStatus status, String titulo, String detalhe) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detalhe);
		problem.setTitle(titulo);
		return problem;
	}
}
