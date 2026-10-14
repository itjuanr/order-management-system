
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegistroComponent } from './registro/registro.component';
import { ClienteComponent } from './cliente/cliente.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CategoriaComponent } from './categoria/categoria.component';
import { FornecedorComponent } from './fornecedor/fornecedor.component';
import { ProdutoComponent } from './produto/produto.component';
import { PedidoComponent } from './pedido/pedido.component';
import { PagamentoComponent } from './pagamentos/pagamentos.component';
import { ItemPedidoComponent } from './itempedido/itempedido.component';
import { LayoutComponent } from './layout/layout.component';


const routes: Routes = [
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/registro', component: RegistroComponent },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'cliente', component: ClienteComponent },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'categoria', component: CategoriaComponent },
      { path: 'fornecedor', component: FornecedorComponent },
      { path: 'produto', component: ProdutoComponent },
      { path: 'pedido', component: PedidoComponent },
      { path: 'pagamentos', component: PagamentoComponent },
      { path: 'checkout', component: ItemPedidoComponent },
    ],
  },
  { path: '**', redirectTo: '/auth/login', pathMatch: 'full' },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
