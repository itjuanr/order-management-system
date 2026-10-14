import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  tipo: 'sucesso' | 'erro' | 'info';
  mensagem: string;
  /** Rota aberta ao clicar no aviso (ex.: o pedido citado). */
  link?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private proximoId = 1;
  readonly toasts = signal<Toast[]>([]);

  sucesso(mensagem: string): void {
    this.mostrar('sucesso', mensagem);
  }

  erro(mensagem: string): void {
    this.mostrar('erro', mensagem);
  }

  /** Aviso de algo que aconteceu no sistema (notificação). */
  info(mensagem: string, link?: string): void {
    this.mostrar('info', mensagem, link);
  }

  fechar(id: number): void {
    this.toasts.update((lista) => lista.filter((t) => t.id !== id));
  }

  private mostrar(tipo: Toast['tipo'], mensagem: string, link?: string): void {
    const id = this.proximoId++;
    this.toasts.update((lista) => [...lista.slice(-3), { id, tipo, mensagem, link }]);
    setTimeout(() => this.fechar(id), tipo === 'sucesso' ? 3500 : 6000);
  }
}
