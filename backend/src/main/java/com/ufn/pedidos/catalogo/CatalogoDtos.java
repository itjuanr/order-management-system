package com.ufn.pedidos.catalogo;

import java.math.BigDecimal;

import org.hibernate.validator.constraints.br.CNPJ;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class CatalogoDtos {

	private CatalogoDtos() {
	}

	public record CategoriaRequest(
			@NotBlank(message = "Informe o nome") @Size(max = 60, message = "Máximo de 60 caracteres") String nome,
			@Size(max = 255, message = "Máximo de 255 caracteres") String descricao) {
	}

	public record CategoriaResponse(Long id, String nome, String descricao, long totalProdutos) {
	}

	public record FornecedorRequest(
			@NotBlank(message = "Informe o nome") @Size(max = 120, message = "Máximo de 120 caracteres") String nome,
			@NotBlank(message = "Informe o CNPJ") @CNPJ(message = "CNPJ inválido") String cnpj,
			@Email(message = "Email inválido") @Size(max = 120) String email,
			@Pattern(regexp = "^$|^\\(?\\d{2}\\)?\\s?9?\\d{4}-?\\d{4}$", message = "Telefone inválido") String telefone) {
	}

	public record FornecedorResponse(Long id, String nome, String cnpj, String email, String telefone,
			long totalProdutos) {
	}

	public record ProdutoRequest(
			@NotBlank(message = "Informe o SKU") @Size(max = 30, message = "Máximo de 30 caracteres") String sku,
			@NotBlank(message = "Informe o nome") @Size(max = 120, message = "Máximo de 120 caracteres") String nome,
			@Size(max = 500, message = "Máximo de 500 caracteres") String descricao,
			@NotNull(message = "Informe o preço") @DecimalMin(value = "0.01", message = "O preço deve ser maior que zero")
			@Digits(integer = 10, fraction = 2, message = "Use no máximo 2 casas decimais") BigDecimal preco,
			@NotNull(message = "Informe o estoque") @Min(value = 0, message = "O estoque não pode ser negativo") Integer estoque,
			@NotNull(message = "Informe o estoque mínimo") @Min(value = 0, message = "Não pode ser negativo") Integer estoqueMinimo,
			Boolean ativo,
			@NotNull(message = "Selecione a categoria") Long categoriaId,
			@NotNull(message = "Selecione o fornecedor") Long fornecedorId) {
	}

	public record Referencia(Long id, String nome) {
	}

	public record ProdutoResponse(Long id, String sku, String nome, String descricao, BigDecimal preco, int estoque,
			int estoqueMinimo, boolean ativo, boolean estoqueBaixo, Referencia categoria, Referencia fornecedor) {

		static ProdutoResponse of(Produto p) {
			return new ProdutoResponse(p.getId(), p.getSku(), p.getNome(), p.getDescricao(), p.getPreco(),
					p.getEstoque(), p.getEstoqueMinimo(), p.isAtivo(), p.isEstoqueBaixo(),
					new Referencia(p.getCategoria().getId(), p.getCategoria().getNome()),
					new Referencia(p.getFornecedor().getId(), p.getFornecedor().getNome()));
		}
	}
}
