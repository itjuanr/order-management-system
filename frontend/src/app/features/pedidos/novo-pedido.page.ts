import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { mensagemDeErro } from '../../core/api-errors';
import { ApiService } from '../../core/api.service';
import { debounced } from '../../core/debounced';
import { Cliente, Produto } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { DocumentoPipe, IniciaisPipe } from '../../shared/formatos';

interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

@Component({
  selector: 'app-novo-pedido-page',
  imports: [CurrencyPipe, RouterLink, DocumentoPipe, IniciaisPipe],
  templateUrl: './novo-pedido.page.html',
  styleUrl: './novo-pedido.page.css',
})
export class NovoPedidoPage {
  private api = inject(ApiService);
  private router = inject(Router);
  private toast = inject(ToastService);

  // Cliente
  protected buscaCliente = signal('');
  private buscaClienteAtrasada = debounced(this.buscaCliente, 250);
  protected cliente = signal<Cliente | null>(null);
  protected clientes = rxResource({
    params: () => (this.cliente() ? null : this.buscaClienteAtrasada()),
    stream: ({ params: busca }) => (busca === null ? of(null) : this.api.clientes({ busca, size: 6 })),
  });

  // Produtos
  protected buscaProduto = signal('');
  private buscaProdutoAtrasada = debounced(this.buscaProduto, 250);
  protected produtos = rxResource({
    params: () => this.buscaProdutoAtrasada(),
    stream: ({ params: busca }) => this.api.produtos({ busca, apenasAtivos: true, size: 8 }),
  });

  // Carrinho
  protected carrinho = signal<ItemCarrinho[]>([]);
  protected observacao = signal('');
  protected enviando = signal(false);

  protected total = computed(() =>
    this.carrinho().reduce((soma, item) => soma + item.produto.preco * item.quantidade, 0),
  );
  protected unidades = computed(() => this.carrinho().reduce((soma, item) => soma + item.quantidade, 0));
  protected podeFinalizar = computed(() => !!this.cliente() && this.carrinho().length > 0 && !this.enviando());

  quantidadeNoCarrinho(produtoId: number): number {
    return this.carrinho().find((i) => i.produto.id === produtoId)?.quantidade ?? 0;
  }

  adicionar(produto: Produto): void {
    if (this.quantidadeNoCarrinho(produto.id) >= produto.estoque) {
      this.toast.erro(`Só há ${produto.estoque} unidade(s) de ${produto.nome} em estoque.`);
      return;
    }
    this.carrinho.update((itens) =>
      itens.some((i) => i.produto.id === produto.id)
        ? itens.map((i) => (i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i))
        : [...itens, { produto, quantidade: 1 }],
    );
  }

  alterarQuantidade(produtoId: number, quantidade: number): void {
    this.carrinho.update((itens) =>
      itens
        .map((i) =>
          i.produto.id === produtoId
            ? { ...i, quantidade: Math.min(Math.max(0, Math.floor(quantidade) || 0), i.produto.estoque) }
            : i,
        )
        .filter((i) => i.quantidade > 0),
    );
  }

  remover(produtoId: number): void {
    this.carrinho.update((itens) => itens.filter((i) => i.produto.id !== produtoId));
  }

  selecionarCliente(cliente: Cliente | null): void {
    this.cliente.set(cliente);
    this.buscaCliente.set('');
  }

  finalizar(): void {
    const cliente = this.cliente();
    if (!cliente || !this.carrinho().length) {
      return;
    }
    this.enviando.set(true);
    this.api
      .criarPedido({
        clienteId: cliente.id,
        itens: this.carrinho().map((i) => ({ produtoId: i.produto.id, quantidade: i.quantidade })),
        observacao: this.observacao() || undefined,
      })
      .subscribe({
        next: (pedido) => {
          this.toast.sucesso(`Pedido #${pedido.id} criado. Agora é só registrar o pagamento.`);
          this.router.navigate(['/pedidos', pedido.id]);
        },
        error: (e) => {
          this.toast.erro(mensagemDeErro(e, 'Não foi possível criar o pedido.'));
          this.enviando.set(false);
          this.produtos.reload();
        },
      });
  }
}
