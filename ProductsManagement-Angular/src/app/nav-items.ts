export interface NavItem {
  title: string;
  description: string;
  link: string;
  icon: string;
  group: 'Cadastros' | 'Vendas';
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Clientes',
    description: 'Gerencie informações de seus clientes.',
    link: '/cliente',
    icon: 'fa-users',
    group: 'Cadastros',
  },
  {
    title: 'Categorias',
    description: 'Explore e administre categorias de produtos.',
    link: '/categoria',
    icon: 'fa-tags',
    group: 'Cadastros',
  },
  {
    title: 'Fornecedores',
    description: 'Mantenha dados atualizados de seus fornecedores.',
    link: '/fornecedor',
    icon: 'fa-truck-field',
    group: 'Cadastros',
  },
  {
    title: 'Produtos',
    description: 'Adicione, edite e exclua produtos de seu estoque.',
    link: '/produto',
    icon: 'fa-box-open',
    group: 'Cadastros',
  },
  {
    title: 'Pedidos',
    description: 'Acompanhe e gerencie pedidos realizados.',
    link: '/pedido',
    icon: 'fa-receipt',
    group: 'Vendas',
  },
  {
    title: 'Pagamentos',
    description: 'Gerencie transações financeiras e registre pagamentos de pedidos.',
    link: '/pagamentos',
    icon: 'fa-credit-card',
    group: 'Vendas',
  },
  {
    title: 'Checkout',
    description: 'Registre pagamentos e confirme pedidos para concluir suas transações.',
    link: '/checkout',
    icon: 'fa-cart-shopping',
    group: 'Vendas',
  },
];
