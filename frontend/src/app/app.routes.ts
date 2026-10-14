import { Routes } from '@angular/router';
import { authGuard, visitanteGuard } from './core/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [visitanteGuard],
    title: 'Entrar · Kairo',
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'registro',
    canActivate: [visitanteGuard],
    title: 'Criar conta · Kairo',
    loadComponent: () => import('./features/auth/registro.page').then((m) => m.RegistroPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Visão geral · Kairo',
        loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'pedidos',
        title: 'Pedidos · Kairo',
        loadComponent: () => import('./features/pedidos/pedidos.page').then((m) => m.PedidosPage),
      },
      {
        path: 'pedidos/novo',
        title: 'Novo pedido · Kairo',
        loadComponent: () => import('./features/pedidos/novo-pedido.page').then((m) => m.NovoPedidoPage),
      },
      {
        path: 'pedidos/:id',
        title: 'Detalhes do pedido · Kairo',
        loadComponent: () => import('./features/pedidos/pedido-detalhe.page').then((m) => m.PedidoDetalhePage),
      },
      {
        path: 'produtos',
        title: 'Produtos · Kairo',
        loadComponent: () => import('./features/produtos/produtos.page').then((m) => m.ProdutosPage),
      },
      {
        path: 'clientes',
        title: 'Clientes · Kairo',
        loadComponent: () => import('./features/clientes/clientes.page').then((m) => m.ClientesPage),
      },
      {
        path: 'categorias',
        title: 'Categorias · Kairo',
        loadComponent: () => import('./features/categorias/categorias.page').then((m) => m.CategoriasPage),
      },
      {
        path: 'perfil',
        title: 'Meu perfil · Kairo',
        loadComponent: () => import('./features/perfil/perfil.page').then((m) => m.PerfilPage),
      },
      {
        path: 'fornecedores',
        title: 'Fornecedores · Kairo',
        loadComponent: () => import('./features/fornecedores/fornecedores.page').then((m) => m.FornecedoresPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
