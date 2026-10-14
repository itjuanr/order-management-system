import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { mensagemDeErro } from '../../core/api-errors';
import { ApiService } from '../../core/api.service';
import { ConfirmService } from '../../core/confirm.service';
import { debounced } from '../../core/debounced';
import { Cliente } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { DocumentoPipe, IniciaisPipe } from '../../shared/formatos';
import { PaginadorComponent } from '../../shared/paginador.component';
import { ClienteFormComponent } from './cliente-form.component';

const TAMANHO = 15;

@Component({
  selector: 'app-clientes-page',
  imports: [DatePipe, RouterLink, DocumentoPipe, IniciaisPipe, PaginadorComponent, ClienteFormComponent],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Clientes</h1>
          <p>Quem compra com você, com histórico de pedidos.</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="editando.set(null)"><i class="icon-plus"></i> Novo cliente</button>
      </header>

      <div class="card">
        <div class="toolbar">
          <div class="search-field search-field--grow">
            <i class="icon-search"></i>
            <input class="input" type="search" placeholder="Buscar por nome, email ou CPF" aria-label="Buscar clientes"
              [value]="busca()" (input)="busca.set($any($event.target).value); pagina.set(0)" />
          </div>
          @if (clientes.value(); as c) {
            <span class="muted toolbar-count">{{ c.totalElements }} {{ c.totalElements === 1 ? 'cliente' : 'clientes' }}</span>
          }
        </div>

        @if (erro()) {
          <div class="card-body"><div class="alert alert--danger"><i class="icon-circle-alert"></i> {{ erro() }}</div></div>
        }

        <div class="table-wrap" [class.is-loading]="clientes.isLoading()">
          @if (clientes.value()?.content?.length) {
            <table class="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>CPF</th>
                  <th>Telefone</th>
                  <th>Cidade</th>
                  <th>Cliente desde</th>
                  <th class="col-actions"><span class="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                @for (c of clientes.value()!.content; track c.id) {
                  <tr>
                    <td>
                      <div class="person">
                        <span class="avatar">{{ c.nome | iniciais }}</span>
                        <div>
                          <span class="cell-strong">{{ c.nome }}</span>
                          <div class="cell-meta">{{ c.email }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="num">{{ c.cpf | documento: 'cpf' }}</td>
                    <td class="num">{{ c.telefone | documento: 'telefone' }}</td>
                    <td>{{ c.endereco ? c.endereco.cidade + '/' + c.endereco.uf : '—' }}</td>
                    <td class="muted">{{ c.criadoEm | date: 'MMM yyyy' }}</td>
                    <td class="col-actions">
                      <a class="btn btn-ghost btn-sm" routerLink="/pedidos" [queryParams]="{ clienteId: c.id }">Pedidos</a>
                      <button type="button" class="icon-btn" title="Editar" aria-label="Editar" (click)="editando.set(c)"><i class="icon-pencil"></i></button>
                      <button type="button" class="icon-btn icon-btn--danger" title="Excluir" aria-label="Excluir" (click)="excluir(c)"><i class="icon-trash-2"></i></button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else if (!clientes.isLoading()) {
            <div class="empty">
              <i class="icon-users"></i>
              <strong>Nenhum cliente encontrado</strong>
              <span>Ajuste a busca ou cadastre um novo cliente.</span>
            </div>
          }
        </div>

        @if (clientes.value(); as c) {
          <app-paginador [pagina]="c.page" [tamanho]="tamanho" [total]="c.totalElements" (mudar)="pagina.set($event)" />
        }
      </div>
    </section>

    @if (editando() !== undefined) {
      <app-cliente-form [cliente]="editando() ?? null" (fechar)="editando.set(undefined)" (salvo)="aoSalvar()" />
    }
  `,
})
export class ClientesPage {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  protected readonly tamanho = TAMANHO;

  protected busca = signal('');
  private buscaAtrasada = debounced(this.busca);
  protected pagina = signal(0);
  protected editando = signal<Cliente | null | undefined>(undefined);

  protected clientes = rxResource({
    params: () => ({ busca: this.buscaAtrasada(), page: this.pagina(), size: TAMANHO }),
    stream: ({ params }) => this.api.clientes(params),
  });
  protected erro = computed(() => (this.clientes.error() ? mensagemDeErro(this.clientes.error()) : null));

  aoSalvar(): void {
    this.editando.set(undefined);
    this.clientes.reload();
  }

  async excluir(cliente: Cliente): Promise<void> {
    const ok = await this.confirm.pedir({
      titulo: `Excluir ${cliente.nome}?`,
      mensagem: 'Clientes com pedidos não podem ser excluídos, para preservar o histórico de vendas.',
      confirmar: 'Excluir',
      perigo: true,
    });
    if (!ok) {
      return;
    }
    this.api.excluirCliente(cliente.id).subscribe({
      next: () => {
        this.toast.sucesso('Cliente excluído.');
        this.clientes.reload();
      },
      error: (e) => this.toast.erro(mensagemDeErro(e)),
    });
  }
}
