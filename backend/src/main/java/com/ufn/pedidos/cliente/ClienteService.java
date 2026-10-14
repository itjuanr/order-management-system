package com.ufn.pedidos.cliente;

import static com.ufn.pedidos.common.Documentos.apenasDigitos;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.ufn.pedidos.cliente.ClienteDtos.ClienteRequest;
import com.ufn.pedidos.cliente.ClienteDtos.ClienteResponse;
import com.ufn.pedidos.common.PageResponse;
import com.ufn.pedidos.common.RecursoNaoEncontradoException;
import com.ufn.pedidos.common.RegraDeNegocioException;
import com.ufn.pedidos.pedido.PedidoRepository;

@Service
public class ClienteService {

	private final ClienteRepository clientes;
	private final PedidoRepository pedidos;

	public ClienteService(ClienteRepository clientes, PedidoRepository pedidos) {
		this.clientes = clientes;
		this.pedidos = pedidos;
	}

	@Transactional(readOnly = true)
	public PageResponse<ClienteResponse> listar(String busca, Pageable pageable) {
		String termo = StringUtils.hasText(busca) ? busca.trim() : null;
		return PageResponse.of(clientes.buscar(termo, pageable), ClienteResponse::of);
	}

	@Transactional(readOnly = true)
	public ClienteResponse buscar(Long id) {
		return ClienteResponse.of(encontrar(id));
	}

	@Transactional
	public ClienteResponse criar(ClienteRequest request) {
		String cpf = apenasDigitos(request.cpf());
		if (clientes.existsByCpf(cpf)) {
			throw new RegraDeNegocioException("Já existe um cliente com este CPF.");
		}
		Cliente cliente = new Cliente(request.nome().trim(), cpf, request.email().trim(), apenasDigitos(request.telefone()),
				endereco(request));
		return ClienteResponse.of(clientes.save(cliente));
	}

	@Transactional
	public ClienteResponse atualizar(Long id, ClienteRequest request) {
		Cliente cliente = encontrar(id);
		String cpf = apenasDigitos(request.cpf());
		if (clientes.existsByCpfAndIdNot(cpf, id)) {
			throw new RegraDeNegocioException("Já existe um cliente com este CPF.");
		}
		cliente.atualizar(request.nome().trim(), cpf, request.email().trim(), apenasDigitos(request.telefone()),
				endereco(request));
		return ClienteResponse.of(cliente);
	}

	@Transactional
	public void excluir(Long id) {
		Cliente cliente = encontrar(id);
		if (pedidos.existsByClienteId(id)) {
			throw new RegraDeNegocioException("O cliente possui pedidos e não pode ser excluído.");
		}
		clientes.delete(cliente);
	}

	private static Endereco endereco(ClienteRequest request) {
		return request.endereco() == null ? null : request.endereco().paraEndereco();
	}

	public Cliente encontrar(Long id) {
		return clientes.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Cliente", id));
	}
}
