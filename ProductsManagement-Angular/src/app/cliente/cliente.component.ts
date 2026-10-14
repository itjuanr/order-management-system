import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ClienteService } from './cliente.service';
import { Cliente } from './cliente';
import { ConfirmDialogComponent } from '../confirm-dialog.component';

@Component({
  selector: 'app-cliente',
  templateUrl: './cliente.component.html',
})
export class ClienteComponent implements OnInit {
  clientes: Cliente[] = [];
  newCliente: Cliente = { id: 0, nome: '', cpf: '', email: '' };
  isNewCliente: boolean = true;
  isEditing: boolean = false;
  idPesquisa: number | undefined;

  constructor(private clienteService: ClienteService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadClientes();
  }
  

  pesquisarPorId(): void {
    if (this.idPesquisa !== undefined) {
      this.clienteService.getClienteById(this.idPesquisa).subscribe(
        (cliente) => {
          this.clientes = cliente ? [cliente] : [];
        },
        (error) => {
          console.error('Erro ao obter cliente por ID:', error);
          this.loadAllClientes();
        }
      );
    } else {
      this.loadAllClientes();
    }
  }

  loadClientes(): void {
    this.pesquisarPorId();
  }

  loadAllClientes(): void {
    this.clienteService.getAllClientes().subscribe(
      (clientes) => {
        this.clientes = clientes;
      },
      (error) => {
        console.error('Erro ao obter clientes:', error);
      }
    );
  }
  
  createOrUpdateCliente(): void {
    if (this.isNewCliente) {
      this.createCliente();
    } else {
      this.openConfirmationDialog('Deseja salvar as alterações no cliente?', this.updateCliente.bind(this));
    }
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

  createCliente(): void {
    const cpfSemMascara = this.newCliente.cpf.replace(/\D/g, '');
    this.newCliente.cpf = cpfSemMascara;

    this.clienteService.createCliente(this.newCliente).subscribe(() => {
      this.loadClientes();
      this.resetForm();
    });
  }

  updateCliente(): void {
    const cpfSemMascara = this.newCliente.cpf.replace(/\D/g, '');

    this.newCliente.cpf = cpfSemMascara;

    this.clienteService.updateCliente(this.newCliente).subscribe(() => {
      this.loadClientes();
      this.resetForm();
    });
  }

  editCliente(cliente: Cliente): void {
    if (this.isEditing) {
      this.openConfirmationDialog('Deseja descartar as alterações no cliente?', () => {
        this.newCliente = { ...cliente };
        this.isNewCliente = false;
        this.isEditing = true;
      });
    } else {
      this.newCliente = { ...cliente };
      this.isNewCliente = false;
      this.isEditing = true;
    }
  }

  cancelEdit(): void {
    this.openConfirmationDialog('Deseja descartar as alterações no cliente?', () => {
      this.resetForm();
      this.isEditing = false;
    });
  }

  deleteCliente(id: number): void {
    this.openConfirmationDialog('Deseja excluir este cliente?', () => {
      this.clienteService.deleteCliente(id).subscribe(() => {
        this.loadClientes();
        this.resetForm();
        this.isEditing = false;
      });
    });
  }

  resetForm(): void {
    this.newCliente = { id: 0, nome: '', cpf: '', email: '' };
    this.isNewCliente = true;
  }
}
