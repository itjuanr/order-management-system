package com.ufn.pedidos.catalogo;

import static com.ufn.pedidos.common.Documentos.apenasDigitos;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ufn.pedidos.catalogo.CatalogoDtos.FornecedorRequest;
import com.ufn.pedidos.catalogo.CatalogoDtos.FornecedorResponse;
import com.ufn.pedidos.common.RecursoNaoEncontradoException;
import com.ufn.pedidos.common.RegraDeNegocioException;

@Service
public class FornecedorService {

	private final FornecedorRepository fornecedores;
	private final ProdutoRepository produtos;

	public FornecedorService(FornecedorRepository fornecedores, ProdutoRepository produtos) {
		this.fornecedores = fornecedores;
		this.produtos = produtos;
	}

	@Transactional(readOnly = true)
	public List<FornecedorResponse> listar() {
		return fornecedores.listarComTotais();
	}

	@Transactional
	public FornecedorResponse criar(FornecedorRequest request) {
		String cnpj = apenasDigitos(request.cnpj());
		if (fornecedores.existsByCnpj(cnpj)) {
			throw new RegraDeNegocioException("Já existe um fornecedor com este CNPJ.");
		}
		Fornecedor f = fornecedores.save(new Fornecedor(request.nome().trim(), cnpj, vazioParaNulo(request.email()),
				apenasDigitos(request.telefone())));
		return new FornecedorResponse(f.getId(), f.getNome(), f.getCnpj(), f.getEmail(), f.getTelefone(), 0);
	}

	@Transactional
	public FornecedorResponse atualizar(Long id, FornecedorRequest request) {
		Fornecedor fornecedor = encontrar(id);
		String cnpj = apenasDigitos(request.cnpj());
		if (fornecedores.existsByCnpjAndIdNot(cnpj, id)) {
			throw new RegraDeNegocioException("Já existe um fornecedor com este CNPJ.");
		}
		fornecedor.atualizar(request.nome().trim(), cnpj, vazioParaNulo(request.email()),
				apenasDigitos(request.telefone()));
		return fornecedores.listarComTotais().stream().filter(f -> f.id().equals(id)).findFirst().orElseThrow();
	}

	@Transactional
	public void excluir(Long id) {
		Fornecedor fornecedor = encontrar(id);
		if (produtos.existsByFornecedorId(id)) {
			throw new RegraDeNegocioException("O fornecedor possui produtos e não pode ser excluído.");
		}
		fornecedores.delete(fornecedor);
	}

	public Fornecedor encontrar(Long id) {
		return fornecedores.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Fornecedor", id));
	}

	private static String vazioParaNulo(String valor) {
		return valor == null || valor.isBlank() ? null : valor.trim();
	}
}
