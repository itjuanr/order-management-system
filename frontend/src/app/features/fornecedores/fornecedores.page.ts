import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { aplicarErrosDoServidor, mensagemDeErro } from '../../core/api-errors';
import { ApiService } from '../../core/api.service';
import { ConfirmService } from '../../core/confirm.service';
import { Fornecedor } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { CampoComponent } from '../../shared/campo.component';
import { DocumentoPipe, formatar } from '../../shared/formatos';
import { MascaraDirective } from '../../shared/mascara.directive';
import { ModalComponent } from '../../shared/modal.component';

@Component({
  selector: 'app-fornecedores-page',
  imports: [ReactiveFormsModule, ModalComponent, CampoComponent, MascaraDirective, DocumentoPipe],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Fornecedores</h1>
          <p>Quem abastece o seu catálogo.</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="abrir(null)"><i class="icon-plus"></i> Novo fornecedor</button>
      </header>

      @if (erro()) {
        <div class="alert alert--danger"><i class="icon-circle-alert"></i> {{ erro() }}</div>
      }

      <div class="card">
        <div class="table-wrap">
          @if (fornecedores.value()?.length) {
            <table class="table">
              <thead>
                <tr>
                  <th>Fornecedor</th>
                  <th>CNPJ</th>
                  <th>Telefone</th>
                  <th class="col-num">Produtos</th>
                  <th class="col-actions"><span class="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                @for (f of fornecedores.value()!; track f.id) {
                  <tr>
                    <td>
                      <span class="cell-strong">{{ f.nome }}</span>
                      <div class="cell-meta">{{ f.email || 'Sem email' }}</div>
                    </td>
                    <td class="num">{{ f.cnpj | documento: 'cnpj' }}</td>
                    <td class="num">{{ f.telefone | documento: 'telefone' }}</td>
                    <td class="col-num">{{ f.totalProdutos }}</td>
                    <td class="col-actions">
                      <button type="button" class="icon-btn" title="Editar" aria-label="Editar" (click)="abrir(f)"><i class="icon-pencil"></i></button>
                      <button type="button" class="icon-btn icon-btn--danger" title="Excluir" aria-label="Excluir" (click)="excluir(f)"><i class="icon-trash-2"></i></button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else if (!fornecedores.isLoading()) {
            <div class="empty"><i class="icon-truck"></i><strong>Nenhum fornecedor ainda</strong></div>
          }
        </div>
      </div>
    </section>

    @if (editando() !== undefined) {
      <app-modal [titulo]="editando() ? 'Editar fornecedor' : 'Novo fornecedor'" (fechar)="editando.set(undefined)">
        <form id="fornecedor-form" class="form" [formGroup]="form" (ngSubmit)="salvar()">
          <app-campo rotulo="Razão social" [controle]="form.controls.nome">
            <input class="input" formControlName="nome" maxlength="120" />
          </app-campo>
          <app-campo rotulo="CNPJ" [controle]="form.controls.cnpj">
            <input class="input" formControlName="cnpj" appMascara="cnpj" placeholder="00.000.000/0000-00" />
          </app-campo>
          <div class="form-grid">
            <app-campo rotulo="Email" [controle]="form.controls.email" opcional>
              <input class="input" type="email" formControlName="email" />
            </app-campo>
            <app-campo rotulo="Telefone" [controle]="form.controls.telefone" opcional>
              <input class="input" formControlName="telefone" appMascara="telefone" placeholder="(00) 0000-0000" />
            </app-campo>
          </div>
        </form>
        <div modal-footer>
          <button type="button" class="btn btn-secondary" (click)="editando.set(undefined)">Cancelar</button>
          <button type="submit" form="fornecedor-form" class="btn btn-primary" [disabled]="salvando()">Salvar</button>
        </div>
      </app-modal>
    }
  `,
})
export class FornecedoresPage {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  protected fornecedores = rxResource({ stream: () => this.api.fornecedores() });
  protected erro = computed(() => (this.fornecedores.error() ? mensagemDeErro(this.fornecedores.error()) : null));

  protected editando = signal<Fornecedor | null | undefined>(undefined);
  protected salvando = signal(false);
  protected form = inject(NonNullableFormBuilder).group({
    nome: ['', [Validators.required, Validators.maxLength(120)]],
    cnpj: ['', [Validators.required, Validators.pattern(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)]],
    email: ['', Validators.email],
    telefone: ['', Validators.pattern(/^$|^\(\d{2}\) \d{4,5}-\d{4}$/)],
  });

  abrir(f: Fornecedor | null): void {
    this.form.reset({
      nome: f?.nome ?? '',
      cnpj: formatar(f?.cnpj, 'cnpj'),
      email: f?.email ?? '',
      telefone: formatar(f?.telefone, 'telefone'),
    });
    this.editando.set(f);
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando.set(true);
    const v = this.form.getRawValue();
    this.api
      .salvarFornecedor({ ...v, email: v.email || undefined, telefone: v.telefone || undefined }, this.editando()?.id)
      .subscribe({
        next: () => {
          this.toast.sucesso('Fornecedor salvo.');
          this.editando.set(undefined);
          this.salvando.set(false);
          this.fornecedores.reload();
        },
        error: (e) => {
          if (!aplicarErrosDoServidor(this.form, e)) {
            this.toast.erro(mensagemDeErro(e));
          }
          this.salvando.set(false);
        },
      });
  }

  async excluir(f: Fornecedor): Promise<void> {
    if (f.totalProdutos > 0) {
      this.toast.erro(`${f.nome} fornece ${f.totalProdutos} produto(s) e não pode ser excluído.`);
      return;
    }
    if (await this.confirm.pedir({ titulo: `Excluir ${f.nome}?`, mensagem: 'Esta ação não pode ser desfeita.', confirmar: 'Excluir', perigo: true })) {
      this.api.excluirFornecedor(f.id).subscribe({
        next: () => {
          this.toast.sucesso('Fornecedor excluído.');
          this.fornecedores.reload();
        },
        error: (e) => this.toast.erro(mensagemDeErro(e)),
      });
    }
  }
}
