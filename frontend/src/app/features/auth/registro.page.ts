import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { aplicarErrosDoServidor, mensagemDeErro } from '../../core/api-errors';
import { AuthService } from '../../core/auth.service';
import { MARCA } from '../../core/marca';
import { CampoComponent } from '../../shared/campo.component';
import { LogoComponent } from '../../shared/logo.component';
import { AuthRodapeComponent } from './auth-rodape.component';

@Component({
  selector: 'app-registro-page',
  imports: [ReactiveFormsModule, RouterLink, CampoComponent, LogoComponent, AuthRodapeComponent],
  template: `
    <div class="auth">
      <header class="auth-top">
        <app-logo comNome />
      </header>

      <main class="auth-main">
        <form class="auth-card form" [formGroup]="form" (ngSubmit)="registrar()">
          <div>
            <h1>Criar conta</h1>
            <p>Novos acessos entram com perfil de operador.</p>
          </div>

          @if (erro()) {
            <div class="alert alert--danger"><i class="icon-circle-alert"></i> {{ erro() }}</div>
          }

          <app-campo rotulo="Nome completo" [controle]="form.controls.nome">
            <input class="input" formControlName="nome" autocomplete="name" autofocus />
          </app-campo>

          <app-campo rotulo="Email" [controle]="form.controls.email">
            <input class="input" type="email" formControlName="email" autocomplete="email" />
          </app-campo>

          <app-campo rotulo="Usuário" [controle]="form.controls.login" dica="Usado para entrar no sistema">
            <input class="input" formControlName="login" autocomplete="username" />
          </app-campo>

          <app-campo rotulo="Senha" [controle]="form.controls.senha" dica="Mínimo de 6 caracteres">
            <input class="input" type="password" formControlName="senha" autocomplete="new-password" />
          </app-campo>

          <button type="submit" class="btn btn-primary btn-lg btn-block" [disabled]="enviando()">
            @if (enviando()) { <i class="icon-loader-circle spin"></i> }
            Criar conta
          </button>
        </form>

        <p class="auth-switch">Já tem acesso? <a routerLink="/login">Entrar</a></p>
      </main>

      <app-auth-rodape />
    </div>
  `,
})
export class RegistroPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  protected readonly marca = MARCA;

  protected form = inject(NonNullableFormBuilder).group({
    nome: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    login: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
  });
  protected enviando = signal(false);
  protected erro = signal<string | null>(null);

  registrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.erro.set(null);
    this.auth.registrar(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/login'], { queryParams: { registrado: 1 } }),
      error: (e) => {
        if (!aplicarErrosDoServidor(this.form, e)) {
          this.erro.set(mensagemDeErro(e, 'Não foi possível criar a conta.'));
        }
        this.enviando.set(false);
      },
    });
  }
}
