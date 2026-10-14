import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { aplicarErrosDoServidor, mensagemDeErro } from '../../core/api-errors';
import { ApiService } from '../../core/api.service';
import { ConfirmService } from '../../core/confirm.service';
import { Categoria } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { CampoComponent } from '../../shared/campo.component';
import { ModalComponent } from '../../shared/modal.component';

@Component({
  selector: 'app-categorias-page',
  imports: [ReactiveFormsModule, RouterLink, ModalComponent, CampoComponent],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Categorias</h1>
          <p>Como o catálogo é organizado.</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="abrir(null)"><i class="icon-plus"></i> Nova categoria</button>
      </header>

      @if (erro()) {
        <div class="alert alert--danger"><i class="icon-circle-alert"></i> {{ erro() }}</div>
      }

      <div class="tile-grid">
        @for (c of categorias.value() ?? []; track c.id) {
          <div class="card tile">
            <div class="tile-body">
              <h2>{{ c.nome }}</h2>
              <p class="muted">{{ c.descricao || 'Sem descrição' }}</p>
            </div>
            <div class="tile-footer">
              <a routerLink="/produtos" [queryParams]="{ categoriaId: c.id }" class="muted">{{ c.totalProdutos }} {{ c.totalProdutos === 1 ? 'produto' : 'produtos' }}</a>
              <span>
                <button type="button" class="icon-btn" title="Editar" aria-label="Editar" (click)="abrir(c)"><i class="icon-pencil"></i></button>
                <button type="button" class="icon-btn icon-btn--danger" title="Excluir" aria-label="Excluir" (click)="excluir(c)"><i class="icon-trash-2"></i></button>
              </span>
            </div>
          </div>
        } @empty {
          @if (!categorias.isLoading()) {
            <div class="card empty"><i class="icon-tags"></i><strong>Nenhuma categoria ainda</strong></div>
          }
        }
      </div>
    </section>

    @if (editando() !== undefined) {
      <app-modal [titulo]="editando() ? 'Editar categoria' : 'Nova categoria'" (fechar)="editando.set(undefined)">
        <form id="categoria-form" class="form" [formGroup]="form" (ngSubmit)="salvar()">
          <app-campo rotulo="Nome" [controle]="form.controls.nome">
            <input class="input" formControlName="nome" maxlength="60" />
          </app-campo>
          <app-campo rotulo="Descrição" [controle]="form.controls.descricao" opcional>
            <textarea class="input textarea" rows="3" maxlength="255" formControlName="descricao"></textarea>
          </app-campo>
        </form>
        <div modal-footer>
          <button type="button" class="btn btn-secondary" (click)="editando.set(undefined)">Cancelar</button>
          <button type="submit" form="categoria-form" class="btn btn-primary" [disabled]="salvando()">Salvar</button>
        </div>
      </app-modal>
    }
  `,
})
export class CategoriasPage {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  protected categorias = rxResource({ stream: () => this.api.categorias() });
  protected erro = computed(() => (this.categorias.error() ? mensagemDeErro(this.categorias.error()) : null));

  protected editando = signal<Categoria | null | undefined>(undefined);
  protected salvando = signal(false);
  protected form = inject(NonNullableFormBuilder).group({
    nome: ['', [Validators.required, Validators.maxLength(60)]],
    descricao: [''],
  });

  abrir(categoria: Categoria | null): void {
    this.form.reset({ nome: categoria?.nome ?? '', descricao: categoria?.descricao ?? '' });
    this.editando.set(categoria);
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando.set(true);
    const v = this.form.getRawValue();
    this.api.salvarCategoria({ nome: v.nome, descricao: v.descricao || undefined }, this.editando()?.id).subscribe({
      next: () => {
        this.toast.sucesso('Categoria salva.');
        this.editando.set(undefined);
        this.salvando.set(false);
        this.categorias.reload();
      },
      error: (e) => {
        if (!aplicarErrosDoServidor(this.form, e)) {
          this.toast.erro(mensagemDeErro(e));
        }
        this.salvando.set(false);
      },
    });
  }

  async excluir(categoria: Categoria): Promise<void> {
    if (categoria.totalProdutos > 0) {
      this.toast.erro(`${categoria.nome} tem ${categoria.totalProdutos} produto(s). Mova-os para outra categoria antes de excluir.`);
      return;
    }
    if (await this.confirm.pedir({ titulo: `Excluir ${categoria.nome}?`, mensagem: 'Esta ação não pode ser desfeita.', confirmar: 'Excluir', perigo: true })) {
      this.api.excluirCategoria(categoria.id).subscribe({
        next: () => {
          this.toast.sucesso('Categoria excluída.');
          this.categorias.reload();
        },
        error: (e) => this.toast.erro(mensagemDeErro(e)),
      });
    }
  }
}
