import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { Sessao } from './models';

const STORAGE_KEY = 'sessao';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private sessao = signal<Sessao | null>(lerSessao());

  readonly usuario = computed(() => this.sessao()?.login ?? null);
  readonly nome = computed(() => this.sessao()?.nome || this.sessao()?.login || '');
  readonly primeiroNome = computed(() => this.nome().split(' ')[0]);
  readonly iniciais = computed(() =>
    this.nome()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0].toUpperCase())
      .join(''),
  );
  readonly role = computed(() => this.sessao()?.role ?? null);
  readonly expiraEm = computed(() => this.sessao()?.expiraEm ?? null);

  get token(): string | null {
    const s = this.sessao();
    return s && new Date(s.expiraEm) > new Date() ? s.token : null;
  }

  estaLogado(): boolean {
    return this.token !== null;
  }

  login(login: string, senha: string): Observable<Sessao> {
    return this.http.post<Sessao>('/api/auth/login', { login, senha }).pipe(
      tap((sessao) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessao));
        this.sessao.set(sessao);
      }),
    );
  }

  registrar(dados: { nome: string; login: string; email: string; senha: string }): Observable<void> {
    return this.http.post<void>('/api/auth/registro', dados);
  }

  /** Mantém o nome exibido no header em dia depois de editar o perfil. */
  atualizarNome(nome: string): void {
    const atual = this.sessao();
    if (atual) {
      const nova = { ...atual, nome };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nova));
      this.sessao.set(nova);
    }
  }

  logout(motivo?: 'expirada'): void {
    localStorage.removeItem(STORAGE_KEY);
    this.sessao.set(null);
    this.router.navigate(['/login'], { queryParams: motivo ? { sessao: motivo } : {} });
  }
}

function lerSessao(): Sessao | null {
  try {
    const bruto = localStorage.getItem(STORAGE_KEY);
    return bruto ? (JSON.parse(bruto) as Sessao) : null;
  } catch {
    return null;
  }
}
