// API falsa para testar o front sem o back-end Spring.
// Uso: npm run mock  (sobe em http://localhost:8080, mesma porta da API real)
// Login: admin / admin123. Os dados ficam em memória e voltam ao inicial quando o processo reinicia.
const http = require('http');

const users = [{ login: 'admin', email: 'admin@email.com', password: 'admin123' }];

const db = {
  clientes: [
    { id: 1, nome: 'Ana Beatriz Souza', cpf: '12345678901', email: 'ana.souza@email.com' },
    { id: 2, nome: 'Carlos Henrique Lima', cpf: '98765432100', email: 'carlos.lima@email.com' },
    { id: 3, nome: 'Fernanda Oliveira', cpf: '45678912377', email: 'fernanda@email.com' },
    { id: 4, nome: 'João Pedro Martins', cpf: '32165498722', email: 'joao.martins@email.com' },
  ],
  categorias: [
    { id: 1, nome: 'Eletrônicos', descricao: 'Celulares, notebooks e acessórios' },
    { id: 2, nome: 'Escritório', descricao: 'Materiais e móveis para escritório' },
  ],
  fornecedores: [
    { id: 1, nome: 'TechDistribuidora LTDA', cnpj: '12345678000190' },
    { id: 2, nome: 'Papelaria Central', cnpj: '98765432000155' },
  ],
  produtos: [
    { id: 1, nome: 'Notebook Pro 14', preco: 6499.9, categoriaId: 1, fornecedorId: 1 },
    { id: 2, nome: 'Mouse sem fio', preco: 129.5, categoriaId: 1, fornecedorId: 1 },
    { id: 3, nome: 'Cadeira ergonômica', preco: 1289, categoriaId: 2, fornecedorId: 2 },
  ],
  pedidos: [
    { idPedido: 1, clienteId: 1, clienteNome: 'Ana Beatriz Souza', produtoId: 1, produtoNome: 'Notebook Pro 14', quantidade: 1, preco: 6499.9 },
    { idPedido: 2, clienteId: 2, clienteNome: 'Carlos Henrique Lima', produtoId: 2, produtoNome: 'Mouse sem fio', quantidade: 3, preco: 388.5 },
    { idPedido: 3, clienteId: 3, clienteNome: 'Fernanda Oliveira', produtoId: 3, produtoNome: 'Cadeira ergonômica', quantidade: 2, preco: 2578 },
  ],
  pagamentos: [
    { id: 1, valor: 6499.9, dataPagamento: '2026-10-10T14:32:00', status: 'Aprovado', pedidoId: 1, clienteId: 1 },
    { id: 2, valor: 200, dataPagamento: '2026-10-11T09:05:00', status: 'Pendente', pedidoId: 2, clienteId: 2 },
  ],
  'item-pedidos': [
    { id: 1, clienteId: 1, pedidoId: 1, produtoId: 1, pagamentoId: 1, quantidade: 1, preco: 6499.9, statusPagamento: 'Aprovado' },
  ],
};

const idKey = (resource) => (resource === 'pedidos' ? 'idPedido' : 'id');
const nextId = (resource) => Math.max(0, ...db[resource].map((item) => item[idKey(resource)])) + 1;
const find = (resource, id) => db[resource].find((item) => item[idKey(resource)] === id);

const base64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
const fakeJwt = (login) => `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url({ sub: login, iss: 'mock-api' })}.mock`;

// Monta o registro a ser criado, imitando o que o back-end real devolve.
function build(resource, body, params) {
  switch (resource) {
    case 'produtos':
      return { ...body, categoriaId: Number(params[1]), fornecedorId: Number(params[3]) };
    case 'pedidos': {
      const cliente = find('clientes', Number(body.clienteId));
      const produto = find('produtos', Number(body.produtoId));
      if (!cliente || !produto) throw [404, 'Cliente ou produto não encontrado'];
      return {
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        produtoId: produto.id,
        produtoNome: produto.nome,
        quantidade: Number(body.quantidade),
        preco: Math.round(produto.preco * Number(body.quantidade) * 100) / 100,
      };
    }
    case 'pagamentos': {
      const pedido = find('pedidos', Number(body.pedidoId));
      if (!pedido) throw [404, 'Pedido não encontrado'];
      return {
        valor: Number(body.precoPago),
        dataPagamento: new Date().toISOString(),
        status: Number(body.precoPago) >= pedido.preco ? 'Aprovado' : 'Pendente',
        pedidoId: pedido.idPedido,
        clienteId: pedido.clienteId,
      };
    }
    case 'item-pedidos': {
      const pedido = find('pedidos', Number(body.pedidoId));
      const pagamento = find('pagamentos', Number(body.pagamentoId));
      if (!pedido || !pagamento) throw [404, 'Pedido ou pagamento não encontrado'];
      if (pagamento.status !== 'Aprovado') throw [400, "Status do pagamento deve ser 'Aprovado'"];
      return {
        clienteId: pedido.clienteId,
        pedidoId: pedido.idPedido,
        produtoId: pedido.produtoId,
        pagamentoId: pagamento.id,
        quantidade: pedido.quantidade,
        preco: pedido.preco,
        statusPagamento: pagamento.status,
      };
    }
    default:
      return { ...body };
  }
}

function handle(method, path, body) {
  const [resource, ...params] = path.split('/').filter(Boolean);

  if (resource === 'auth') {
    if (params[0] === 'login') {
      const user = users.find((u) => u.login === body.login && u.password === body.password);
      if (!user) throw [401, 'Credenciais inválidas'];
      return [200, { token: fakeJwt(user.login) }];
    }
    if (params[0] === 'register') {
      if (users.some((u) => u.login === body.login)) throw [400, 'Login já existe'];
      users.push({ login: body.login, email: body.email, password: body.password });
      return [200, {}];
    }
  }

  if (!db[resource]) throw [404, 'Rota não encontrada'];
  const id = Number(params[0]);

  if (method === 'GET' && !params.length) return [200, db[resource]];
  if (method === 'GET') {
    const item = find(resource, id);
    if (!item) throw [404, 'Registro não encontrado'];
    return [200, item];
  }
  if (method === 'POST') {
    const item = { ...build(resource, body, params), [idKey(resource)]: nextId(resource) };
    db[resource].push(item);
    return [201, item];
  }
  if (method === 'PUT') {
    const item = find(resource, id);
    if (!item) throw [404, 'Registro não encontrado'];
    if (resource === 'pedidos') {
      const atualizado = build('pedidos', {
        clienteId: body.novoIdCliente ?? item.clienteId,
        produtoId: body.novoIdProduto ?? item.produtoId,
        quantidade: body.novaQuantidade ?? item.quantidade,
      });
      Object.assign(item, atualizado);
    } else {
      Object.assign(item, body, { [idKey(resource)]: id });
    }
    return [200, item];
  }
  if (method === 'DELETE') {
    db[resource] = db[resource].filter((item) => item[idKey(resource)] !== id);
    return [204, null];
  }
  throw [405, 'Método não suportado'];
}

http
  .createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.writeHead(204).end();

    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      let status, payload;
      try {
        [status, payload] = handle(req.method, req.url.split('?')[0], raw ? JSON.parse(raw) : {});
      } catch (err) {
        [status, payload] = Array.isArray(err) ? [err[0], { message: err[1] }] : [500, { message: String(err) }];
      }
      console.log(`${req.method} ${req.url} -> ${status}`);
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(payload === null ? undefined : JSON.stringify(payload));
    });
  })
  .on('error', (err) => {
    if (err.code !== 'EADDRINUSE') throw err;
    console.error('A porta 8080 já está em uso: a API mock (ou o back-end Spring) já está rodando em outro terminal.');
    process.exit(1);
  })
  .listen(8080, () => console.log('API mock em http://localhost:8080 (login: admin / admin123)'));
