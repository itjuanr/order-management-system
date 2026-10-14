import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { mensagemDeErro } from '../../core/api-errors';
import { ApiService } from '../../core/api.service';
import { ConfirmService } from '../../core/confirm.service';
import { debounced } from '../../core/debounced';
import { Produto } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { PaginadorComponent } from '../../shared/paginador.component';
import { ProdutoFormComponent } from './produto-form.component';

const TAMANHO = 15;

@Component({
  selector: 'app-produtos-page',
  imports: [CurrencyPipe, PaginadorComponent, ProdutoFormComponent],
  templateUrl: './produtos.page.html',
})
export class ProdutosPage {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  protected readonly tamanho = TAMANHO;

  /** ?estoqueBaixo=true vindo do dashboard. */
  readonly estoqueBaixo = input<string>();
  /** ?categoriaId=3 vindo da tela de categorias. */
  readonly categoria = input<string>(undefined, { alias: 'categoriaId' });

  /** ?busca=SKU vindo da busca rápida. */
  readonly buscaInicial = input<string>(undefined, { alias: 'busca' });

  protected busca = linkedSignal(() => this.buscaInicial() ?? '');
  private buscaAtrasada = debounced(this.busca);
  protected categoriaId = linkedSignal(() => (this.categoria() ? Number(this.categoria()) : null));
  protected apenasEstoqueBaixo = linkedSignal(() => this.estoqueBaixo() === 'true');
  protected pagina = signal(0);

  /** undefined = modal fechado; null = novo produto. */
  protected editando = signal<Produto | null | undefined>(undefined);

  protected categorias = rxResource({ stream: () => this.api.categorias() });
  protected fornecedores = rxResource({ stream: () => this.api.fornecedores() });

  protected produtos = rxResource({
    params: () => ({
      busca: this.buscaAtrasada(),
      categoriaId: this.categoriaId(),
      estoqueBaixo: this.apenasEstoqueBaixo(),
      page: this.pagina(),
      size: TAMANHO,
    }),
    stream: ({ params }) => this.api.produtos(params),
  });
  protected erro = computed(() => (this.produtos.error() ? mensagemDeErro(this.produtos.error()) : null));

  filtro(acao: () => void): void {
    acao();
    this.pagina.set(0);
  }

  aoSalvar(): void {
    this.editando.set(undefined);
    this.produtos.reload();
  }

  async excluir(produto: Produto): Promise<void> {
    const ok = await this.confirm.pedir({
      titulo: `Excluir ${produto.nome}?`,
      mensagem: 'Só é possível excluir produtos que nunca foram vendidos. Para tirar um produto das vendas, desative-o.',
      confirmar: 'Excluir',
      perigo: true,
    });
    if (!ok) {
      return;
    }
    this.api.excluirProduto(produto.id).subscribe({
      next: () => {
        this.toast.sucesso('Produto excluído.');
        this.produtos.reload();
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }
}
