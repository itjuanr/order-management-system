import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AoVivoService } from './ao-vivo.service';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Atividade } from './models';
import { ToastService } from './toast.service';

const CHAVE_LIDAS = 'notificacoes.ultimaLida';
const CHAVE_PREFERENCIAS = 'notificacoes.preferencias';

interface Preferencias {
  avisosNaTela: boolean;
  navegador: boolean;
}

/**
 * Notificações do que acontece com os pedidos, a partir do feed /api/atividades.
 * Ações do próprio usuário não viram notificação; o resto (outros usuários e a simulação) sim.
 */
@Injectable({ providedIn: 'root' })
export class NotificacoesService {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private aoVivo = inject(AoVivoService);

  readonly itens = signal<Atividade[]>([]);
  readonly preferencias = signal<Preferencias>(lerPreferencias());
  readonly permissaoNavegador = signal<NotificationPermission | 'indisponivel'>(
    'Notification' in window ? Notification.permission : 'indisponivel',
  );

  private ultimaLida = signal<number>(Number(lerStorage(CHAVE_LIDAS) ?? 0));
  /** Maior id já processado nesta aba, para avisar só do que é realmente novo. */
  private ultimoVisto = 0;
  private timer?: ReturnType<typeof setTimeout>;

  readonly notificacoes = computed(() => this.itens().filter((a) => a.autor !== this.auth.usuario()));
  readonly naoLidas = computed(() => this.notificacoes().filter((a) => a.id > this.ultimaLida()).length);

  constructor() {
    // Busca mais rápido com a simulação ligada; mais devagar quando a loja está "parada".
    effect(() => {
      const intervalo = this.aoVivo.ativo() ? 5000 : 20000;
      clearTimeout(this.timer);
      const ciclo = () => {
        this.buscar();
        this.timer = setTimeout(ciclo, intervalo);
      };
      ciclo();
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  foiLida(atividade: Atividade): boolean {
    return atividade.id <= this.ultimaLida();
  }

  marcarTodasComoLidas(): void {
    const maior = Math.max(0, ...this.itens().map((a) => a.id));
    this.ultimaLida.set(maior);
    salvarStorage(CHAVE_LIDAS, String(maior));
  }

  alterarPreferencia(chave: keyof Preferencias, valor: boolean): void {
    if (chave === 'navegador' && valor && this.permissaoNavegador() !== 'granted') {
      this.pedirPermissao();
      return;
    }
    this.salvarPreferencias({ ...this.preferencias(), [chave]: valor });
  }

  private pedirPermissao(): void {
    if (!('Notification' in window)) {
      return;
    }
    Notification.requestPermission().then((permissao) => {
      this.permissaoNavegador.set(permissao);
      this.salvarPreferencias({ ...this.preferencias(), navegador: permissao === 'granted' });
      if (permissao === 'denied') {
        this.toast.erro('O navegador bloqueou as notificações. Libere nas configurações do site para ativar.');
      }
    });
  }

  private buscar(): void {
    this.api
      .atividades(30)
      .pipe(catchError(() => of(null)))
      .subscribe((lista) => {
        if (!lista) {
          return;
        }
        const maior = Math.max(0, ...lista.map((a) => a.id));
        // A API guarda os eventos em memória: se ela reiniciou, os ids recomeçam do zero.
        if (maior < this.ultimaLida()) {
          this.ultimaLida.set(maior);
          salvarStorage(CHAVE_LIDAS, String(maior));
        }
        const primeiraCarga = this.ultimoVisto === 0;
        const novas = lista.filter((a) => a.id > this.ultimoVisto && a.autor !== this.auth.usuario());
        this.ultimoVisto = Math.max(this.ultimoVisto, maior);
        this.itens.set(lista);
        if (!primeiraCarga && novas.length) {
          this.avisar(novas);
        }
      });
  }

  private avisar(novas: Atividade[]): void {
    const { avisosNaTela, navegador } = this.preferencias();
    const mensagem = novas.length === 1 ? novas[0].descricao : `${novas.length} novos eventos nos pedidos`;
    const link = novas.length === 1 ? `/pedidos/${novas[0].pedidoId}` : undefined;

    if (avisosNaTela && !this.router.url.startsWith('/dashboard')) {
      this.toast.info(mensagem, link);
    }
    if (navegador && this.permissaoNavegador() === 'granted' && document.hidden) {
      const notificacao = new Notification('Kairo · Ponto Norte', { body: mensagem, icon: '/favicon.svg', tag: 'kairo' });
      notificacao.onclick = () => {
        window.focus();
        this.router.navigateByUrl(link ?? '/dashboard');
        notificacao.close();
      };
    }
  }

  private salvarPreferencias(p: Preferencias): void {
    this.preferencias.set(p);
    salvarStorage(CHAVE_PREFERENCIAS, JSON.stringify(p));
  }
}

function lerPreferencias(): Preferencias {
  try {
    return { avisosNaTela: true, navegador: false, ...JSON.parse(lerStorage(CHAVE_PREFERENCIAS) ?? '{}') };
  } catch {
    return { avisosNaTela: true, navegador: false };
  }
}

function lerStorage(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function salvarStorage(chave: string, valor: string): void {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    // armazenamento indisponível: preferências valem só nesta sessão
  }
}
