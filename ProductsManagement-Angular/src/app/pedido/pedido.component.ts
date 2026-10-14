import { Component, OnInit } from '@angular/core';
import { PedidoService } from './pedido.service';
import { PedidoDTO, CriarPedidoRequestDTO } from './pedido';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog.component';

@Component({
  selector: 'app-pedido',
  templateUrl: './pedido.component.html',
})
export class PedidoComponent implements OnInit {
  pedidos: PedidoDTO[] = [];
  novoPedido: CriarPedidoRequestDTO = {
    clienteId: 0,
    produtoId: 0,
    quantidade: 0,
  };
  pedidoSelecionado: PedidoDTO | null = null;
  idPesquisa: number | undefined;

  constructor(private pedidoService: PedidoService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.carregarPedidos();
  }

  carregarPedidos(): void {
    this.pedidoService.getAllPedidos().subscribe((pedidos) => {
      console.log('Pedidos carregados:', pedidos);
      this.pedidos = pedidos;
    });
  }

  criarPedido(): void {
    this.pedidoService.criarPedido(this.novoPedido).subscribe(() => this.resetarNovoPedido());
  }

  resetarNovoPedido(): void {
    this.carregarPedidos();
    this.novoPedido = { clienteId: 0, produtoId: 0, quantidade: 0 };
  }

  selecionarPedido(pedido: PedidoDTO): void {
    console.log('Pedido recebido:', pedido);
  
    if (pedido && pedido.idPedido !== undefined) {
      this.pedidoSelecionado = { ...pedido };
      console.log('Pedido Selecionado:', this.pedidoSelecionado);
    } else {
      console.log('Pedido ID é undefined, null ou inválido.');
    }
  }
  

  atualizarQuantidade(novaQuantidade: number): void {
    this.atualizarPedido({ novaQuantidade });
  }

  atualizarCliente(novoIdCliente: number): void {
    this.atualizarPedido({ novoIdCliente });
  }

  atualizarProduto(novoIdProduto: number): void {
    this.atualizarPedido({ novoIdProduto });
  }

  atualizarPedido(atualizacao: any): void {
    if (this.pedidoSelecionado) {
      const { novaQuantidade, novoIdCliente, novoIdProduto } = atualizacao;
      const atualizacaoPedido = {
        novaQuantidade: novaQuantidade !== undefined ? novaQuantidade : this.pedidoSelecionado.quantidade,
        novoIdCliente: novoIdCliente !== undefined ? novoIdCliente : this.pedidoSelecionado.clienteId,
        novoIdProduto: novoIdProduto !== undefined ? novoIdProduto : this.pedidoSelecionado.produtoId,
      };

      this.pedidoService.updatePedido(this.pedidoSelecionado.idPedido, atualizacaoPedido).subscribe(() => {
        this.carregarPedidos();
        this.pedidoSelecionado = null;
      });
    }
  }

  excluirPedido(pedidoId?: number): void {
    console.log('Pedido Selecionado (antes da exclusão):', this.pedidoSelecionado);
  
    if ((pedidoId !== undefined && pedidoId !== null) || (this.pedidoSelecionado && this.pedidoSelecionado.idPedido !== undefined)) {
      const idPedido = pedidoId !== undefined ? pedidoId : (this.pedidoSelecionado ? this.pedidoSelecionado.idPedido : null);
      
      if (idPedido !== null && idPedido !== undefined) {
        console.log('Pedido ID (antes da exclusão):', idPedido);
  
        this.openConfirmationDialog('Deseja excluir este pedido?', () => {
          this.pedidoService.deletePedido(idPedido).subscribe(
            () => {
              console.log('Pedido excluído com sucesso!');
              this.carregarPedidos();
              this.pedidoSelecionado = null;
            },
            (error) => {
              console.error('Erro na exclusão do pedido:', error);
            }
          );
        });
      } else {
        console.log('ID do pedido inválido.');
      }
    } else {
      console.log('Nenhum pedido selecionado ou ID do pedido inválido.');
    }
  }
  

  openConfirmationDialog(message: string, callback: () => void): void {
    console.log('Método openConfirmationDialog chamado.');
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Confirmação', message: message },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        callback();
      }
    });
  }

  pesquisarPorId(): void {
    if (this.idPesquisa !== undefined) {
      this.pedidoService.getPedidoById(this.idPesquisa).subscribe((pedido) => {
        this.pedidos = pedido ? [pedido] : [];
      },
      () => {
        this.carregarPedidos();
      });
    } else {
      this.carregarPedidos();
    }
  }
}