package com.ufn.pedidos.catalogo;

import java.math.BigDecimal;

import com.ufn.pedidos.common.RegraDeNegocioException;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "produtos")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Produto {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String sku;

	private String nome;

	private String descricao;

	private BigDecimal preco;

	private int estoque;

	private int estoqueMinimo;

	private boolean ativo;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "categoria_id")
	private Categoria categoria;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "fornecedor_id")
	private Fornecedor fornecedor;

	public Produto(String sku, String nome, String descricao, BigDecimal preco, int estoque, int estoqueMinimo,
			boolean ativo, Categoria categoria, Fornecedor fornecedor) {
		atualizar(sku, nome, descricao, preco, estoque, estoqueMinimo, ativo, categoria, fornecedor);
	}

	public void atualizar(String sku, String nome, String descricao, BigDecimal preco, int estoque, int estoqueMinimo,
			boolean ativo, Categoria categoria, Fornecedor fornecedor) {
		this.sku = sku;
		this.nome = nome;
		this.descricao = descricao;
		this.preco = preco;
		this.estoque = estoque;
		this.estoqueMinimo = estoqueMinimo;
		this.ativo = ativo;
		this.categoria = categoria;
		this.fornecedor = fornecedor;
	}

	public boolean isEstoqueBaixo() {
		return estoque <= estoqueMinimo;
	}

	public void garantirDisponivel(int quantidade) {
		if (!ativo) {
			throw new RegraDeNegocioException("O produto " + nome + " está inativo.");
		}
		if (quantidade > estoque) {
			throw new RegraDeNegocioException(
					"Estoque insuficiente para " + nome + ": pedido " + quantidade + ", disponível " + estoque + ".");
		}
	}

	public void baixarEstoque(int quantidade) {
		garantirDisponivel(quantidade);
		estoque -= quantidade;
	}

	public void reporEstoque(int quantidade) {
		estoque += quantidade;
	}
}
