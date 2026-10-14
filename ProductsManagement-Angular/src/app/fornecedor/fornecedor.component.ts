import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FornecedorService } from './fornecedor.service';
import { Fornecedor } from './fornecedor';
import { ConfirmDialogComponent } from '../confirm-dialog.component';

@Component({
  selector: 'app-fornecedor',
  templateUrl: './fornecedor.component.html',
})
export class FornecedorComponent implements OnInit {
  fornecedores: Fornecedor[] = [];
  newFornecedor: Fornecedor = { id: 0, nome: '', cnpj: '' };
  isNewFornecedor: boolean = true;
  isEditing: boolean = false;
  idPesquisa: number | undefined;

  constructor(
    private fornecedorService: FornecedorService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getAllFornecedores();
  }

  getAllFornecedores(): void {
    this.fornecedorService.getAllFornecedoresFromServer().subscribe(
      (fornecedores) => {
        this.fornecedores = fornecedores; 
      },
      (error) => {
        console.error('Erro ao carregar fornecedores:', error);
      }
    );
  }
  
  createOrUpdateFornecedor(): void {
    if (this.isNewFornecedor) {
      this.createFornecedor();
    } else {
      this.openConfirmationDialog('Deseja salvar as alterações no fornecedor?', this.updateFornecedor.bind(this));
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

  createFornecedor(): void {
    const cnpjSemMascara = this.newFornecedor.cnpj.replace(/\D/g, '');
    this.newFornecedor.cnpj = cnpjSemMascara;
  
    this.fornecedorService.addFornecedor(this.newFornecedor).subscribe(
      (fornecedor) => {
        this.fornecedores.push(fornecedor);
        this.resetForm();
      },
      (error) => {
        console.error('Erro ao adicionar fornecedor:', error);
      }
    );
  }
  
  updateFornecedor(): void {
    const cnpjSemMascara = this.newFornecedor.cnpj.replace(/\D/g, '');

    this.newFornecedor.cnpj = cnpjSemMascara;
  
    this.fornecedorService.updateFornecedor(this.newFornecedor.id, this.newFornecedor).subscribe(
      () => {
        const index = this.fornecedores.findIndex((f) => f.id === this.newFornecedor!.id);
        if (index !== -1) {
          this.fornecedores[index] = this.newFornecedor;
          this.resetForm();
        }
      },
      (error) => {
        console.error('Erro ao editar fornecedor:', error);
      }
    );
  }
  

  editFornecedor(fornecedor: Fornecedor): void {
    if (this.isEditing) {
      this.openConfirmationDialog('Deseja descartar as alterações no fornecedor?', () => {
        this.newFornecedor = { ...fornecedor };
        this.isNewFornecedor = false;
        this.isEditing = false;
      });
    } else {
      this.newFornecedor = { ...fornecedor };
      this.isNewFornecedor = false;
      this.isEditing = true;
    }
  }

  discardChanges(): void {
    this.openConfirmationDialog('Deseja descartar as alterações no fornecedor?', () => {
      this.resetForm();
    });
  }

  deleteFornecedor(id: number): void {
    this.openConfirmationDialog('Deseja excluir este fornecedor?', () => {
      this.fornecedorService.deleteFornecedor(id).subscribe(
        () => {
          this.fornecedores = this.fornecedores.filter((f) => f.id !== id);
          this.resetForm();
        },
        (error) => {
          console.error('Erro ao excluir fornecedor:', error);
        }
      );
    });
  }

  pesquisarFornecedoresPorId(): void {
    if (this.idPesquisa !== undefined) {
      this.fornecedorService.getFornecedoresById(this.idPesquisa).subscribe(
        (fornecedores) => {
          if (fornecedores.length === 0) {
            this.carregarTodosFornecedores();
          } else {
            this.fornecedores = fornecedores;
          }
        },
        (error) => {
          console.error('Erro ao buscar fornecedor por ID:', error);
          this.carregarTodosFornecedores();
        }
      );
    } else {
      this.carregarTodosFornecedores();
    }
  }
  
  
  carregarTodosFornecedores(): void {
    this.fornecedorService.getAllFornecedores().subscribe(
      (fornecedores) => {
        this.fornecedores = fornecedores;
      },
      (error) => {
        console.error('Erro ao carregar fornecedores:', error);
      }
    );
  }

  formatCnpj(cnpj: string): string {
    const cnpjSemMascara = cnpj.replace(/\D/g, ''); // Remove caracteres não numéricos
    return cnpjSemMascara.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5'
    ); 
  }

  resetForm(): void {
    this.newFornecedor = { id: 0, nome: '', cnpj: '' };
    this.isNewFornecedor = true;
    this.isEditing = false;
  }
}
