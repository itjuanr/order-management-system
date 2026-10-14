// dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { NAV_ITEMS } from '../nav-items';
import { ClienteService } from '../cliente/cliente.service';
import { ProdutoService } from '../produto/produto.service';
import { PedidoService } from '../pedido/pedido.service';
import { PagamentoService } from '../pagamentos/pagamento.service';

interface DashboardStat {
    label: string;
    icon: string;
    link: string;
    value: number | null;
}

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
    dashboardFeatures = NAV_ITEMS;
    stats: DashboardStat[] = [];

    constructor(
        private clienteService: ClienteService,
        private produtoService: ProdutoService,
        private pedidoService: PedidoService,
        private pagamentoService: PagamentoService
    ) {}

    ngOnInit(): void {
        this.addStat('Clientes', 'fa-users', '/cliente', this.clienteService.getAllClientes());
        this.addStat('Produtos', 'fa-box-open', '/produto', this.produtoService.getAllProdutos());
        this.addStat('Pedidos', 'fa-receipt', '/pedido', this.pedidoService.getAllPedidos());
        this.addStat('Pagamentos', 'fa-credit-card', '/pagamentos', this.pagamentoService.getAllPagamentos());
    }

    private addStat(label: string, icon: string, link: string, source: Observable<unknown[]>): void {
        const stat: DashboardStat = { label, icon, link, value: null };
        this.stats.push(stat);

        source.subscribe(
            (items) => {
                stat.value = items.length;
            },
            (error) => {
                console.error(`Erro ao obter total de ${label}:`, error);
            }
        );
    }
}
