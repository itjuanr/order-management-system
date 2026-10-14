import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { aplicarErrosDoServidor, mensagemDeErro } from '../../core/api-errors';
import { ApiService } from '../../core/api.service';
import { Categoria, Fornecedor, Produto } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { CampoComponent } from '../../shared/campo.component';
import { ModalComponent } from '../../shared/modal.component';

@Component({
  selector: 'app-produto-form',
  imports: [ReactiveFormsModule, ModalComponent, CampoComponent],
  template: `
    <app-modal [titulo]="produto() ? 'Editar produto' : 'Novo produto'" [subtitulo]="produto()?.sku" largo (fechar)="fechar.emit()">
      <form id="produto-form" class="form" [formGroup]="form" (ngSubmit)="salvar()">
        <div class="form-grid">
          <app-campo rotulo="Nome" [controle]="form.controls.nome" class="span-2">
            <input class="input" formControlName="nome" maxlength="120" />
          </app-campo>
          <app-campo rotulo="SKU" [controle]="form.controls.sku" dica="Código único, ex.: INF-010">
            <input class="input input--upper" formControlName="sku" maxlength="30" />
          </app-campo>
          <app-campo rotulo="Preço (R$)" [controle]="form.controls.preco">
            <input class="input" type="number" min="0.01" step="0.01" formControlName="preco" />
          </app-campo>
          <app-campo rotulo="Categoria" [controle]="form.controls.categoriaId">
            <select class="input" formControlName="categoriaId">
              <option [ngValue]="null" disabled>Selecione…</option>
              @for (c of categorias(); track c.id) {
                <option [ngValue]="c.id">{{ c.nome }}</option>
              }
            </select>
          </app-campo>
          <app-campo rotulo="Fornecedor" [controle]="form.controls.fornecedorId">
            <select class="input" formControlName="fornecedorId">
              <option [ngValue]="null" disabled>Selecione…</option>
              @for (f of fornecedores(); track f.id) {
                <option [ngValue]="f.id">{{ f.nome }}</option>
              }
            </select>
          </app-campo>
          <app-campo rotulo="Estoque atual" [controle]="form.controls.estoque">
            <input class="input" type="number" min="0" step="1" formControlName="estoque" />
          </app-campo>
          <app-campo rotulo="Estoque mínimo" [controle]="form.controls.estoqueMinimo" dica="Abaixo disso, o produto entra no alerta">
            <input class="input" type="number" min="0" step="1" formControlName="estoqueMinimo" />
          </app-campo>
          <app-campo rotulo="Descrição" [controle]="form.controls.descricao" opcional class="span-2">
            <textarea class="input textarea" rows="2" maxlength="500" formControlName="descricao"></textarea>
          </app-campo>
        </div>

        <label class="switch">
          <input type="checkbox" formControlName="ativo" />
          <span class="switch-track"></span>
          <span>
            <strong>Disponível para venda</strong>
            <span class="cell-meta">Produtos inativos não aparecem na criação de pedidos.</span>
          </span>
        </label>
      </form>

      <div modal-footer>
        <button type="button" class="btn btn-secondary" (click)="fechar.emit()">Cancelar</button>
        <button type="submit" form="produto-form" class="btn btn-primary" [disabled]="salvando()">
          @if (salvando()) { <i class="icon-loader-circle spin"></i> }
          {{ produto() ? 'Salvar alterações' : 'Cadastrar produto' }}
        </button>
      </div>
    </app-modal>
  `,
})
export class ProdutoFormComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly produto = input<Produto | null>(null);
  readonly categorias = input.required<Categoria[]>();
  readonly fornecedores = input.required<Fornecedor[]>();
  readonly fechar = output<void>();
  readonly salvo = output<Produto>();

  protected salvando = signal(false);
  protected form = inject(NonNullableFormBuilder).group({
    nome: ['', [Validators.required, Validators.maxLength(120)]],
    sku: ['', [Validators.required, Validators.maxLength(30)]],
    preco: [null as number | null, [Validators.required, Validators.min(0.01)]],
    estoque: [0, [Validators.required, Validators.min(0)]],
    estoqueMinimo: [5, [Validators.required, Validators.min(0)]],
    categoriaId: [null as number | null, Validators.required],
    fornecedorId: [null as number | null, Validators.required],
    descricao: [''],
    ativo: [true],
  });

  ngOnInit(): void {
    const p = this.produto();
    if (p) {
      this.form.setValue({
        nome: p.nome,
        sku: p.sku,
        preco: p.preco,
        estoque: p.estoque,
        estoqueMinimo: p.estoqueMinimo,
        categoriaId: p.categoria.id,
        fornecedorId: p.fornecedor.id,
        descricao: p.descricao ?? '',
        ativo: p.ativo,
      });
    }
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.salvando.set(true);
    this.api
      .salvarProduto(
        {
          ...v,
          sku: v.sku.trim().toUpperCase(),
          preco: v.preco!,
          categoriaId: v.categoriaId!,
          fornecedorId: v.fornecedorId!,
          descricao: v.descricao || undefined,
        },
        this.produto()?.id,
      )
      .subscribe({
        next: (produto) => {
          this.toast.sucesso(this.produto() ? 'Produto atualizado.' : 'Produto cadastrado.');
          this.salvo.emit(produto);
        },
        error: (e) => {
          if (!aplicarErrosDoServidor(this.form, e)) {
            this.toast.erro(mensagemDeErro(e));
          }
          this.salvando.set(false);
        },
      });
  }
}
