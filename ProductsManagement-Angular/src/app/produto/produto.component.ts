import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ProdutoService } from './produto.service';
import { Produto } from './produto';
import { ConfirmDialogComponent } from '../confirm-dialog.component';

@Component({
  selector: 'app-produto',
  templateUrl: './produto.component.html',
})
export class ProdutoComponent implements OnInit {
  produtos: Produto[] = [];
  novoProduto: Produto = { id: 0, nome: '', preco: 0, categoriaId: 0, fornecedorId: 0 };
  modoEdicao: boolean = false;
  produtoOriginal: Produto | null = null;
  idPesquisa: number | undefined;

  constructor(private produtoService: ProdutoService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.carregarProdutos();
  }

  carregarProdutos(): void {
    if (this.idPesquisa !== undefined) {
      this.produtoService.getProdutoById(this.idPesquisa).subscribe(
        (produto) => {
          this.produtos = produto ? [produto] : [];
        },
        (error) => {
          console.error('Erro ao obter produto por ID:', error);
          this.carregarTodosOsProdutos(); 
        }
      );
    } else {
      this.carregarTodosOsProdutos();
    }
  }
  
  carregarTodosOsProdutos(): void {
    this.produtoService.getAllProdutos().subscribe(
      (data) => {
        this.produtos = data;
      },
      (error) => {
        console.error('Erro ao obter produtos:', error);
      }
    );
  }
  

  pesquisarPorId(): void {
    if (this.idPesquisa !== undefined) {
      this.carregarProdutos();
    }
  }

  salvarProduto(): void {
    if (this.modoEdicao) {
      this.openConfirmationDialog('Deseja salvar as alterações no produto?', () => {
        this.atualizarProduto(this.novoProduto.id!);
      });
    } else {
      this.produtoService
        .saveProduto(this.novoProduto, this.novoProduto.categoriaId!, this.novoProduto.fornecedorId!)
        .subscribe(
          () => {
            console.log('Produto salvo com sucesso.');
            this.carregarProdutos();
            this.resetForm();
          },
          (error) => {
            console.error('Erro ao salvar produto:', error);
          }
        );
    }
  }

  atualizarProduto(id: number): void {
    this.produtoService.updateProduto(id, this.novoProduto).subscribe(
      () => {
        console.log('Produto atualizado com sucesso.');
        this.carregarProdutos();
        this.resetForm();
      },
      (error) => {
        console.error('Erro ao atualizar produto:', error);
      }
    );
  }

  excluirProduto(id: number): void {
    this.openConfirmationDialog('Deseja excluir este produto?', () => {
      this.produtoService.deleteProduto(id).subscribe(
        () => {
          console.log('Produto excluído com sucesso.');
          this.carregarProdutos();
          this.resetForm();
        },
        (error) => {
          console.error('Erro ao excluir produto:', error);
        }
      );
    });
  }

  editarProduto(produto: Produto): void {
    this.produtoOriginal = { ...produto };
    this.novoProduto = { ...produto };
    this.modoEdicao = true;
  }

  cancelEdit(): void {
    this.openConfirmationDialog('Deseja cancelar a edição do produto?', () => {
      if (this.produtoOriginal) {
        this.novoProduto = { ...this.produtoOriginal };
      }
      this.resetForm();
      this.modoEdicao = false;
      this.produtoOriginal = null;
    });
  }

  resetForm(): void {
    this.novoProduto = { id: 0, nome: '', preco: 0, categoriaId: 0, fornecedorId: 0 };
    this.modoEdicao = false;
  }

  openConfirmationDialog(message: string, callback: () => void): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Confirmação', message: message },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        callback();
      }
    });
  }
}
