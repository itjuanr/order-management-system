import { DatePipe } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { aplicarErrosDoServidor, mensagemDeErro } from '../../core/api-errors';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ConfirmService } from '../../core/confirm.service';
import { MARCA } from '../../core/marca';
import { ThemeService } from '../../core/theme.service';
import { ToastService } from '../../core/toast.service';
import { CampoComponent } from '../../shared/campo.component';
import { IniciaisPipe } from '../../shared/formatos';

function senhasIguais(grupo: AbstractControl): ValidationErrors | null {
  const nova = grupo.get('novaSenha')?.value;
  const confirmacao = grupo.get('confirmacao');
  if (confirmacao && confirmacao.value && nova !== confirmacao.value) {
    confirmacao.setErrors({ servidor: 'As senhas não conferem' });
  }
  return null;
}

@Component({
  selector: 'app-perfil-page',
  imports: [DatePipe, ReactiveFormsModule, CampoComponent, IniciaisPipe],
  templateUrl: './perfil.page.html',
  styleUrl: './perfil.page.css',
})
export class PerfilPage {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  protected auth = inject(AuthService);
  protected tema = inject(ThemeService);
  protected readonly marca = MARCA;

  protected perfil = rxResource({ stream: () => this.api.perfil() });

  private fb = inject(NonNullableFormBuilder);
  protected dados = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
  });
  protected senha = this.fb.group(
    {
      senhaAtual: ['', Validators.required],
      novaSenha: ['', [Validators.required, Validators.minLength(6)]],
      confirmacao: ['', Validators.required],
    },
    { validators: senhasIguais },
  );

  protected salvandoDados = signal(false);
  protected salvandoSenha = signal(false);

  constructor() {
    effect(() => {
      const p = this.perfil.value();
      if (p) {
        this.dados.reset({ nome: p.nome, email: p.email });
      }
    });
  }

  salvarDados(): void {
    if (this.dados.invalid) {
      this.dados.markAllAsTouched();
      return;
    }
    this.salvandoDados.set(true);
    this.api.salvarPerfil(this.dados.getRawValue()).subscribe({
      next: (perfil) => {
        this.perfil.set(perfil);
        this.auth.atualizarNome(perfil.nome);
        this.toast.sucesso('Perfil atualizado.');
        this.salvandoDados.set(false);
      },
      error: (e) => {
        if (!aplicarErrosDoServidor(this.dados, e)) {
          this.toast.erro(mensagemDeErro(e));
        }
        this.salvandoDados.set(false);
      },
    });
  }

  alterarSenha(): void {
    if (this.senha.invalid) {
      this.senha.markAllAsTouched();
      return;
    }
    this.salvandoSenha.set(true);
    const { senhaAtual, novaSenha } = this.senha.getRawValue();
    this.api.alterarSenha({ senhaAtual, novaSenha }).subscribe({
      next: () => {
        this.toast.sucesso('Senha alterada. Use a nova senha no próximo acesso.');
        this.senha.reset();
        this.salvandoSenha.set(false);
      },
      error: (e) => {
        if (!aplicarErrosDoServidor(this.senha, e)) {
          this.toast.erro(mensagemDeErro(e));
        }
        this.salvandoSenha.set(false);
      },
    });
  }

  async sair(): Promise<void> {
    if (await this.confirm.pedir({ titulo: 'Encerrar a sessão?', mensagem: 'Você vai precisar entrar novamente.', confirmar: 'Sair' })) {
      this.auth.logout();
    }
  }
}
