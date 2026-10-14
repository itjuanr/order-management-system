// Tipos espelhando os DTOs da API (backend/src/main/java/com/ufn/pedidos/**/…Dtos.java).

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type Role = 'ADMIN' | 'USER';

export interface Sessao {
  token: string;
  expiraEm: string;
  login: string;
  nome: string;
  role: Role;
}

export interface Perfil {
  id: number;
  nome: string;
  login: string;
  email: string;
  role: Role;
  criadoEm: string;
}

export interface InfoSistema {
  versao: string;
  ambiente: string;
  banco: string;
  bancoOk: boolean;
  minutosNoAr: number;
}

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface EnderecoPorCep {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  telefone?: string;
  endereco?: Endereco;
  criadoEm: string;
}

export interface ClienteRequest {
  nome: string;
  cpf: string;
  email: string;
  telefone?: string;
  endereco?: Endereco;
}

export interface Categoria {
  id: number;
  nome: string;
  descricao?: string;
  totalProdutos: number;
}

export interface CategoriaRequest {
  nome: string;
  descricao?: string;
}

export interface Fornecedor {
  id: number;
  nome: string;
  cnpj: string;
  email?: string;
  telefone?: string;
  totalProdutos: number;
}

export interface FornecedorRequest {
  nome: string;
  cnpj: string;
  email?: string;
  telefone?: string;
}

export interface Referencia {
  id: number;
  nome: string;
}

export interface Produto {
  id: number;
  sku: string;
  nome: string;
  descricao?: string;
  preco: number;
  estoque: number;
  estoqueMinimo: number;
  ativo: boolean;
  estoqueBaixo: boolean;
  categoria: Referencia;
  fornecedor: Referencia;
}

export interface ProdutoRequest {
  sku: string;
  nome: string;
  descricao?: string;
  preco: number;
  estoque: number;
  estoqueMinimo: number;
  ativo: boolean;
  categoriaId: number;
  fornecedorId: number;
}

export type StatusPedido = 'AGUARDANDO_PAGAMENTO' | 'PAGO' | 'ENVIADO' | 'ENTREGUE' | 'CANCELADO';
export type AcaoPedido = 'PAGAR' | 'ENVIAR' | 'ENTREGAR' | 'CANCELAR';
export type MetodoPagamento = 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'BOLETO';

export interface PedidoResumo {
  id: number;
  clienteId: number;
  clienteNome: string;
  status: StatusPedido;
  total: number;
  quantidadeItens: number;
  metodoPagamento?: MetodoPagamento;
  criadoEm: string;
}

export interface ItemPedido {
  produtoId: number;
  sku: string;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface Pedido {
  id: number;
  status: StatusPedido;
  acoes: AcaoPedido[];
  cliente: { id: number; nome: string; email: string; cpf: string; telefone?: string; endereco?: Endereco };
  itens: ItemPedido[];
  total: number;
  observacao?: string;
  pagamento?: { metodo: MetodoPagamento; valor: number; pagoEm: string };
  criadoEm: string;
  pagoEm?: string;
  enviadoEm?: string;
  entregueEm?: string;
  canceladoEm?: string;
}

export interface NovoPedidoRequest {
  clienteId: number;
  itens: { produtoId: number; quantidade: number }[];
  observacao?: string;
}

export type TipoAtividade = 'CRIADO' | 'PAGO' | 'ENVIADO' | 'ENTREGUE' | 'CANCELADO';

export interface Atividade {
  id: number;
  tipo: TipoAtividade;
  pedidoId: number;
  descricao: string;
  autor: string;
  quando: string;
}

export interface EstadoSimulador {
  ativo: boolean;
  intervaloSegundos: number;
}

export interface Dashboard {
  faturamentoMes: number;
  faturamentoMesmoPeriodoAnterior: number;
  vendasMes: number;
  ticketMedioMes: number;
  pedidosAguardandoPagamento: number;
  pedidosParaEnviar: number;
  faturamentoMensal: { mes: string; valor: number; vendas: number }[];
  pedidosPorStatus: { status: StatusPedido; quantidade: number }[];
  estoqueBaixo: { id: number; nome: string; sku: string; estoque: number; estoqueMinimo: number }[];
  maisVendidos: { id: number; nome: string; quantidade: number; receita: number }[];
  ultimosPedidos: PedidoResumo[];
}
