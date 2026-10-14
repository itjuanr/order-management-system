import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CategoriaService } from './categoria.service';
import { Categoria } from './categoria';
import { ConfirmDialogComponent } from '../confirm-dialog.component';

@Component({
  selector: 'app-categoria',
  templateUrl: './categoria.component.html',
})
export class CategoriaComponent implements OnInit {
  categorias: Categoria[] = [];
  novaCategoria: Categoria = { id: 0, nome: '', descricao: '' };
  isNewCategoria: boolean = true;
  isEditing: boolean = false;
  idPesquisa: number | undefined;

  constructor(private categoriaService: CategoriaService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadCategorias();
  }

  pesquisarPorId(): void {
    if (this.idPesquisa !== undefined) {
      this.categoriaService.getCategoriaById(this.idPesquisa).subscribe(
        (categoria) => {
          this.categorias = categoria ? [categoria] : [];
        },
        (error) => {
          console.error('Erro ao obter categoria por ID:', error);
          this.loadAllCategorias();
        }
      );
    } else {
      this.loadAllCategorias();
    }
  }

  loadCategorias(): void {
    this.pesquisarPorId();
  }

  loadAllCategorias(): void {
    this.categoriaService.getAllCategorias().subscribe(
      (categorias) => {
        this.categorias = categorias;
      },
      (error) => {
        console.error('Erro ao obter categorias:', error);
      }
    );
  }

  createOrUpdateCategoria(): void {
    if (this.isNewCategoria) {
      this.createCategoria();
    } else {
      this.openConfirmationDialog('Deseja salvar as alterações na categoria?', this.updateCategoria.bind(this));
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

  createCategoria(): void {
    this.categoriaService.addCategoria(this.novaCategoria).subscribe(() => {
      this.loadCategorias();
      this.resetForm();
    });
  }

  updateCategoria(): void {
    this.categoriaService.updateCategoria(this.novaCategoria.id, this.novaCategoria).subscribe(() => {
      this.loadCategorias();
      this.resetForm();
    });
  }

  editCategoria(categoria: Categoria): void {
    if (this.isEditing) {
      this.openConfirmationDialog('Deseja descartar as alterações na categoria?', () => {
        this.novaCategoria = { ...categoria };
        this.isNewCategoria = false;
        this.isEditing = true;
      });
    } else {
      this.novaCategoria = { ...categoria };
      this.isNewCategoria = false;
      this.isEditing = true;
    }
  }

  cancelEdit(): void {
    this.openConfirmationDialog('Deseja descartar as alterações na categoria?', () => {
      this.resetForm();
      this.isEditing = false;
    });
  }

  deleteCategoria(id: number): void {
    this.openConfirmationDialog('Deseja excluir esta categoria?', () => {
      this.categoriaService.deleteCategoria(id).subscribe(() => {
        this.loadCategorias();
        this.resetForm();
        this.isEditing = false;
      });
    });
  }

  resetForm(): void {
    this.novaCategoria = { id: 0, nome: '', descricao: '' };
    this.isNewCategoria = true;
  }
}
