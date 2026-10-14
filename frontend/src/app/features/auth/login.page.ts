import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { mensagemDeErro } from '../../core/api-errors';
import { AuthService } from '../../core/auth.service';
import { MARCA } from '../../core/marca';
import { CampoComponent } from '../../shared/campo.component';
import { LogoComponent } from '../../shared/logo.component';
import { AuthRodapeComponent } from './auth-rodape.component';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink, CampoComponent, LogoComponent, AuthRodapeComponent],
  template: `
    <div class="auth">
      <header class="auth-top">
        <app-logo comNome />
      </header>

      <main class="auth-main">
        <form class="auth-card form" [formGroup]="form" (ngSubmit)="entrar()">
          <div>
            <h1>Entrar no {{ marca.produto }}</h1>
            <p>Acesse o painel da {{ marca.loja }}.</p>
          </div>

          @if (sessao() === 'expirada') {
            <div class="alert alert--warning"><i class="icon-clock"></i> Sua sessão expirou. Entre novamente.</div>
          }
          @if (registrado()) {
            <div class="alert alert--success"><i class="icon-circle-check"></i> Conta criada. Agora é só entrar.</div>
          }
          @if (erro()) {
            <div class="alert alert--danger"><i class="icon-circle-alert"></i> {{ erro() }}</div>
          }

          <app-campo rotulo="Usuário" [controle]="form.controls.login">
            <input class="input" formControlName="login" autocomplete="username" autofocus />
          </app-campo>

          <app-campo rotulo="Senha" [controle]="form.controls.senha">
            <input class="input" type="password" formControlName="senha" autocomplete="current-password" />
          </app-campo>

          <button type="submit" class="btn btn-primary btn-lg btn-block" [disabled]="enviando()">
            @if (enviando()) { <i class="icon-loader-circle spin"></i> }
            Entrar
          </button>

          <div class="demo-hint">
            <span>Demonstração: <strong>admin</strong> / <strong>admin123</strong></span>
            <button type="button" class="btn btn-ghost btn-sm" (click)="preencherDemo()">Usar</button>
          </div>
        </form>

        <p class="auth-switch">Ainda não tem acesso? <a routerLink="/registro">Criar conta</a></p>
      </main>

      <app-auth-rodape />
    </div>
  `,
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  protected readonly marca = MARCA;

  /** Query params: ?sessao=expirada, ?registrado=1, ?voltar=/rota */
  readonly sessao = input<string>();
  readonly registrado = input<string>();
  readonly voltar = input<string>();

  protected form = inject(NonNullableFormBuilder).group({
    login: ['', Validators.required],
    senha: ['', Validators.required],
  });
  protected enviando = signal(false);
  protected erro = signal<string | null>(null);

  preencherDemo(): void {
    this.form.setValue({ login: 'admin', senha: 'admin123' });
  }

  entrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.erro.set(null);
    const { login, senha } = this.form.getRawValue();
    this.auth.login(login, senha).subscribe({
      next: () => this.router.navigateByUrl(this.voltar() || '/dashboard'),
      error: (e) => {
        this.erro.set(mensagemDeErro(e, 'Não foi possível entrar.'));
        this.enviando.set(false);
      },
    });
  }
}
