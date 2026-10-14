import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Categoria,
  CategoriaRequest,
  Cliente,
  ClienteRequest,
  Dashboard,
  Fornecedor,
  FornecedorRequest,
  MetodoPagamento,
  NovoPedidoRequest,
  Page,
  Pedido,
  PedidoResumo,
  Produto,
  ProdutoRequest,
  Perfil,
  InfoSistema,
  Atividade,
  EstadoSimulador,
  EnderecoPorCep,
  StatusPedido,
} from './models';

type Filtros = Record<string, string | number | boolean | null | undefined>;

/** Um único ponto de acesso aos endpoints REST da API. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  cep(cep: string): Observable<EnderecoPorCep> {
    return this.http.get<EnderecoPorCep>(`/api/cep/${cep.replace(/\D/g, '')}`);
  }

  atividades(limite = 15): Observable<Atividade[]> {
    return this.http.get<Atividade[]>('/api/atividades', { params: { limite } });
  }

  simulador(): Observable<EstadoSimulador> {
    return this.http.get<EstadoSimulador>('/api/simulador');
  }

  alterarSimulador(ativo: boolean): Observable<EstadoSimulador> {
    return this.http.put<EstadoSimulador>('/api/simulador', { ativo });
  }

  info(): Observable<InfoSistema> {
    return this.http.get<InfoSistema>('/api/info');
  }

  // Perfil do usuário logado
  perfil(): Observable<Perfil> {
    return this.http.get<Perfil>('/api/me');
  }
  salvarPerfil(dados: { nome: string; email: string }): Observable<Perfil> {
    return this.http.put<Perfil>('/api/me', dados);
  }
  alterarSenha(dados: { senhaAtual: string; novaSenha: string }): Observable<void> {
    return this.http.put<void>('/api/me/senha', dados);
  }

  dashboard(): Observable<Dashboard> {
    return this.http.get<Dashboard>('/api/dashboard');
  }

  // Clientes
  clientes(filtros: { busca?: string; page?: number; size?: number }): Observable<Page<Cliente>> {
    return this.http.get<Page<Cliente>>('/api/clientes', { params: params(filtros) });
  }
  cliente(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`/api/clientes/${id}`);
  }
  salvarCliente(dados: ClienteRequest, id?: number): Observable<Cliente> {
    return id
      ? this.http.put<Cliente>(`/api/clientes/${id}`, dados)
      : this.http.post<Cliente>('/api/clientes', dados);
  }
  excluirCliente(id: number): Observable<void> {
    return this.http.delete<void>(`/api/clientes/${id}`);
  }

  // Categorias
  categorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>('/api/categorias');
  }
  salvarCategoria(dados: CategoriaRequest, id?: number): Observable<Categoria> {
    return id
      ? this.http.put<Categoria>(`/api/categorias/${id}`, dados)
      : this.http.post<Categoria>('/api/categorias', dados);
  }
  excluirCategoria(id: number): Observable<void> {
    return this.http.delete<void>(`/api/categorias/${id}`);
  }

  // Fornecedores
  fornecedores(): Observable<Fornecedor[]> {
    return this.http.get<Fornecedor[]>('/api/fornecedores');
  }
  salvarFornecedor(dados: FornecedorRequest, id?: number): Observable<Fornecedor> {
    return id
      ? this.http.put<Fornecedor>(`/api/fornecedores/${id}`, dados)
      : this.http.post<Fornecedor>('/api/fornecedores', dados);
  }
  excluirFornecedor(id: number): Observable<void> {
    return this.http.delete<void>(`/api/fornecedores/${id}`);
  }

  // Produtos
  produtos(filtros: {
    busca?: string;
    categoriaId?: number | null;
    apenasAtivos?: boolean;
    estoqueBaixo?: boolean;
    page?: number;
    size?: number;
  }): Observable<Page<Produto>> {
    return this.http.get<Page<Produto>>('/api/produtos', { params: params(filtros) });
  }
  salvarProduto(dados: ProdutoRequest, id?: number): Observable<Produto> {
    return id
      ? this.http.put<Produto>(`/api/produtos/${id}`, dados)
      : this.http.post<Produto>('/api/produtos', dados);
  }
  excluirProduto(id: number): Observable<void> {
    return this.http.delete<void>(`/api/produtos/${id}`);
  }

  // Pedidos
  pedidos(filtros: {
    status?: StatusPedido | '';
    clienteId?: number | null;
    busca?: string;
    page?: number;
    size?: number;
  }): Observable<Page<PedidoResumo>> {
    return this.http.get<Page<PedidoResumo>>('/api/pedidos', { params: params(filtros) });
  }
  pedido(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`/api/pedidos/${id}`);
  }
  criarPedido(dados: NovoPedidoRequest): Observable<Pedido> {
    return this.http.post<Pedido>('/api/pedidos', dados);
  }
  pagarPedido(id: number, metodo: MetodoPagamento): Observable<Pedido> {
    return this.http.post<Pedido>(`/api/pedidos/${id}/pagamento`, { metodo });
  }
  enviarPedido(id: number): Observable<Pedido> {
    return this.http.post<Pedido>(`/api/pedidos/${id}/envio`, {});
  }
  entregarPedido(id: number): Observable<Pedido> {
    return this.http.post<Pedido>(`/api/pedidos/${id}/entrega`, {});
  }
  cancelarPedido(id: number): Observable<Pedido> {
    return this.http.post<Pedido>(`/api/pedidos/${id}/cancelamento`, {});
  }
}

function params(filtros: Filtros): HttpParams {
  let p = new HttpParams();
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor !== null && valor !== undefined && valor !== '' && valor !== false) {
      p = p.set(chave, String(valor));
    }
  }
  return p;
}
