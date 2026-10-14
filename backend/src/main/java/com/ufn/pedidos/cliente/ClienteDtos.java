package com.ufn.pedidos.cliente;

import java.time.LocalDateTime;

import org.hibernate.validator.constraints.br.CPF;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class ClienteDtos {

	private ClienteDtos() {
	}

	public record ClienteRequest(
			@NotBlank(message = "Informe o nome") @Size(max = 120, message = "Máximo de 120 caracteres") String nome,
			@NotBlank(message = "Informe o CPF") @CPF(message = "CPF inválido") String cpf,
			@NotBlank(message = "Informe o email") @Email(message = "Email inválido") @Size(max = 120) String email,
			@Pattern(regexp = "^$|^\\(?\\d{2}\\)?\\s?9?\\d{4}-?\\d{4}$", message = "Telefone inválido") String telefone,
			@Valid EnderecoRequest endereco) {
	}

	/** Endereço é opcional; quando enviado, os campos principais são obrigatórios. */
	public record EnderecoRequest(
			@NotBlank(message = "Informe o CEP") @Pattern(regexp = "^\\d{5}-?\\d{3}$", message = "CEP inválido") String cep,
			@NotBlank(message = "Informe o logradouro") @Size(max = 150) String logradouro,
			@NotBlank(message = "Informe o número") @Size(max = 20) String numero,
			@Size(max = 80) String complemento,
			@NotBlank(message = "Informe o bairro") @Size(max = 80) String bairro,
			@NotBlank(message = "Informe a cidade") @Size(max = 80) String cidade,
			@NotBlank(message = "Informe a UF") @Pattern(regexp = "^[A-Za-z]{2}$", message = "UF inválida") String uf) {

		Endereco paraEndereco() {
			return new Endereco(cep.replaceAll("\\D", ""), logradouro.trim(), numero.trim(),
					complemento == null || complemento.isBlank() ? null : complemento.trim(), bairro.trim(), cidade.trim(),
					uf.toUpperCase());
		}
	}

	public record ClienteResponse(Long id, String nome, String cpf, String email, String telefone, Endereco endereco,
			LocalDateTime criadoEm) {

		static ClienteResponse of(Cliente c) {
			return new ClienteResponse(c.getId(), c.getNome(), c.getCpf(), c.getEmail(), c.getTelefone(), c.getEndereco(),
					c.getCriadoEm());
		}
	}
}
