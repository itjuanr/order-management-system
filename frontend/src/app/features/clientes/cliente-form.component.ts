import { Component, ElementRef, inject, input, OnInit, output, signal, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { aplicarErrosDoServidor, mensagemDeErro } from '../../core/api-errors';
import { ApiService } from '../../core/api.service';
import { Cliente, Endereco } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { CampoComponent } from '../../shared/campo.component';
import { formatar } from '../../shared/formatos';
import { MascaraDirective } from '../../shared/mascara.directive';
import { ModalComponent } from '../../shared/modal.component';

type BuscaCep = 'ocioso' | 'buscando' | 'encontrado' | 'nao-encontrado' | 'indisponivel';

@Component({
  selector: 'app-cliente-form',
  imports: [ReactiveFormsModule, ModalComponent, CampoComponent, MascaraDirective],
  template: `
    <app-modal [titulo]="cliente() ? 'Editar cliente' : 'Novo cliente'" largo (fechar)="fechar.emit()">
      <form id="cliente-form" class="form" [formGroup]="form" (ngSubmit)="salvar()">
        <section class="form-section">
          <h3 class="form-section-title">Dados do cliente</h3>
          <div class="form">
            <app-campo rotulo="Nome completo" [controle]="form.controls.nome">
              <input class="input" formControlName="nome" maxlength="120" autocomplete="off" />
            </app-campo>
            <div class="form-grid">
              <app-campo rotulo="CPF" [controle]="form.controls.cpf">
                <input class="input" formControlName="cpf" appMascara="cpf" placeholder="000.000.000-00" />
              </app-campo>
              <app-campo rotulo="Telefone" [controle]="form.controls.telefone" opcional>
                <input class="input" formControlName="telefone" appMascara="telefone" placeholder="(00) 00000-0000" />
              </app-campo>
            </div>
            <app-campo rotulo="Email" [controle]="form.controls.email">
              <input class="input" type="email" formControlName="email" maxlength="120" />
            </app-campo>
          </div>
        </section>

        <section class="form-section" formGroupName="endereco">
          <h3 class="form-section-title">Endereço de entrega <span class="field-optional">opcional</span></h3>
          <div class="form">
            <div class="form-grid form-grid--cep">
              <app-campo rotulo="CEP" [controle]="form.controls.endereco.controls.cep" [dica]="dicaCep()">
                <input class="input" formControlName="cep" appMascara="cep" placeholder="00000-000" (input)="aoDigitarCep()" />
              </app-campo>
              <app-campo rotulo="Logradouro" [controle]="form.controls.endereco.controls.logradouro">
                <input class="input" formControlName="logradouro" maxlength="150" />
              </app-campo>
            </div>
            <div class="form-grid form-grid--numero">
              <app-campo rotulo="Número" [controle]="form.controls.endereco.controls.numero">
                <input #numero class="input" formControlName="numero" maxlength="20" />
              </app-campo>
              <app-campo rotulo="Complemento" [controle]="form.controls.endereco.controls.complemento" opcional>
                <input class="input" formControlName="complemento" maxlength="80" placeholder="Apto, bloco, referência" />
              </app-campo>
            </div>
            <div class="form-grid form-grid--cidade">
              <app-campo rotulo="Bairro" [controle]="form.controls.endereco.controls.bairro">
                <input class="input" formControlName="bairro" maxlength="80" />
              </app-campo>
              <app-campo rotulo="Cidade" [controle]="form.controls.endereco.controls.cidade">
                <input class="input" formControlName="cidade" maxlength="80" />
              </app-campo>
              <app-campo rotulo="UF" [controle]="form.controls.endereco.controls.uf">
                <input class="input input--upper" formControlName="uf" maxlength="2" />
              </app-campo>
            </div>
          </div>
        </section>
      </form>

      <div modal-footer>
        <button type="button" class="btn btn-secondary" (click)="fechar.emit()">Cancelar</button>
        <button type="submit" form="cliente-form" class="btn btn-primary" [disabled]="salvando()">
          @if (salvando()) { <i class="icon-loader-circle spin"></i> }
          {{ cliente() ? 'Salvar alterações' : 'Cadastrar cliente' }}
        </button>
      </div>
    </app-modal>
  `,
  styles: `
    .form-grid--cep { grid-template-columns: 180px minmax(0, 1fr); }
    .form-grid--numero { grid-template-columns: 180px minmax(0, 1fr); }
    .form-grid--cidade { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 90px; }
    @media (max-width: 640px) {
      .form-grid--cep, .form-grid--numero, .form-grid--cidade { grid-template-columns: minmax(0, 1fr); }
    }
  `,
})
export class ClienteFormComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private campoNumero = viewChild<ElementRef<HTMLInputElement>>('numero');

  readonly cliente = input<Cliente | null>(null);
  readonly fechar = output<void>();
  readonly salvo = output<Cliente>();

  protected salvando = signal(false);
  protected buscaCep = signal<BuscaCep>('ocioso');

  private fb = inject(NonNullableFormBuilder);
  protected form = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(120)]],
    cpf: ['', [Validators.required, Validators.pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)]],
    email: ['', [Validators.required, Validators.email]],
    telefone: ['', Validators.pattern(/^$|^\(\d{2}\) \d{4,5}-\d{4}$/)],
    endereco: this.fb.group({
      cep: ['', Validators.pattern(/^$|^\d{5}-\d{3}$/)],
      logradouro: [''],
      numero: [''],
      complemento: [''],
      bairro: [''],
      cidade: [''],
      uf: ['', Validators.pattern(/^$|^[A-Za-z]{2}$/)],
    }),
  });

  protected dicaCep = () =>
    ({
      ocioso: 'Preenche o endereço automaticamente',
      buscando: 'Consultando o CEP…',
      encontrado: 'Endereço encontrado via ViaCEP',
      'nao-encontrado': 'CEP não encontrado; preencha manualmente',
      indisponivel: 'Consulta de CEP indisponível; preencha manualmente',
    })[this.buscaCep()];

  ngOnInit(): void {
    const c = this.cliente();
    if (c) {
      const e = c.endereco;
      this.form.setValue({
        nome: c.nome,
        cpf: formatar(c.cpf, 'cpf'),
        email: c.email,
        telefone: formatar(c.telefone, 'telefone'),
        endereco: {
          cep: formatar(e?.cep, 'cep'),
          logradouro: e?.logradouro ?? '',
          numero: e?.numero ?? '',
          complemento: e?.complemento ?? '',
          bairro: e?.bairro ?? '',
          cidade: e?.cidade ?? '',
          uf: e?.uf ?? '',
        },
      });
    }
  }

  aoDigitarCep(): void {
    const cep = this.form.controls.endereco.controls.cep.value;
    if (!/^\d{5}-\d{3}$/.test(cep)) {
      this.buscaCep.set('ocioso');
      return;
    }
    this.buscaCep.set('buscando');
    this.api.cep(cep).subscribe({
      next: (e) => {
        this.form.controls.endereco.patchValue({
          logradouro: e.logradouro,
          bairro: e.bairro,
          cidade: e.cidade,
          uf: e.uf,
        });
        this.buscaCep.set('encontrado');
        this.campoNumero()?.nativeElement.focus();
      },
      error: (erro) => this.buscaCep.set(erro?.status === 404 ? 'nao-encontrado' : 'indisponivel'),
    });
  }

  salvar(): void {
    const endereco = this.enderecoPreenchido();
    if (this.form.invalid || endereco === 'incompleto') {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando.set(true);
    const v = this.form.getRawValue();
    this.api
      .salvarCliente(
        { nome: v.nome, cpf: v.cpf, email: v.email, telefone: v.telefone || undefined, endereco: endereco ?? undefined },
        this.cliente()?.id,
      )
      .subscribe({
        next: (cliente) => {
          this.toast.sucesso(this.cliente() ? 'Cliente atualizado.' : 'Cliente cadastrado.');
          this.salvo.emit(cliente);
        },
        error: (e) => {
          if (!aplicarErrosDoServidor(this.form, e)) {
            this.toast.erro(mensagemDeErro(e));
          }
          this.salvando.set(false);
        },
      });
  }

  /** Endereço é opcional, mas se algum campo foi preenchido os principais passam a ser obrigatórios. */
  private enderecoPreenchido(): Endereco | null | 'incompleto' {
    const grupo = this.form.controls.endereco;
    const e = grupo.getRawValue();
    const algum = Object.values(e).some((v) => v.trim() !== '');
    if (!algum) {
      return null;
    }
    let incompleto = false;
    for (const campo of ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'uf'] as const) {
      if (!e[campo].trim()) {
        grupo.controls[campo].setErrors({ required: true });
        incompleto = true;
      }
    }
    return incompleto ? 'incompleto' : { ...e, uf: e.uf.toUpperCase(), complemento: e.complemento || undefined };
  }
}
