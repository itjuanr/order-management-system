import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ItemPedidoService } from './itempedido.service';
import { CriarItemPedidoRequestDTO, ItemPedidoDTO } from './itempedido';

@Component({
  selector: 'app-item-pedido',
  templateUrl: './itempedido.component.html',
})
export class ItemPedidoComponent implements OnInit {
  itemPedidos: ItemPedidoDTO[] = [];
  novoItemPedidoRequest: CriarItemPedidoRequestDTO = {};
  idPesquisa: number | undefined;

  constructor(private itemPedidoService: ItemPedidoService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.carregarTodosOsItemPedidos();
  }

  carregarTodosOsItemPedidos(): void {
    this.itemPedidoService.getAllItemPedidos().subscribe(
      (data) => {
        this.itemPedidos = data;
      },
      (error) => {
        console.error('Erro ao obter itens de pedido:', error);
      }
    );
  }

  pesquisarPorId(): void {
    if (this.idPesquisa != null) {
      this.itemPedidoService.getItemPedidoById(this.idPesquisa).subscribe(
        (itemPedido) => {
          this.itemPedidos = itemPedido ? [itemPedido] : [];
        },
        (error) => {
          console.error('Erro ao obter item de pedido por ID:', error);
        }
      );
    } else {
      this.carregarTodosOsItemPedidos();
    }
  }

  criarNovoItemPedido(): void {
    this.itemPedidoService.createItemPedido(this.novoItemPedidoRequest).subscribe(
      () => {
        console.log('Item de pedido criado com sucesso.');
        this.carregarTodosOsItemPedidos();
        this.resetForm();
      },
      (error) => {
        console.error('Erro ao criar item de pedido:', error);
      }
    );
  }

  resetForm(): void {
    this.novoItemPedidoRequest = {};
  }
}
