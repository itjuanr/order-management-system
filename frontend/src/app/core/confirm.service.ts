import { Injectable, signal } from '@angular/core';

export interface Confirmacao {
  titulo: string;
  mensagem: string;
  confirmar?: string;
  perigo?: boolean;
}

/** Diálogo de confirmação global: `if (await confirm.pedir({...})) { ... }`. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly atual = signal<Confirmacao | null>(null);
  private resolver?: (ok: boolean) => void;

  pedir(confirmacao: Confirmacao): Promise<boolean> {
    this.resolver?.(false);
    this.atual.set(confirmacao);
    return new Promise((resolve) => (this.resolver = resolve));
  }

  responder(ok: boolean): void {
    this.resolver?.(ok);
    this.resolver = undefined;
    this.atual.set(null);
  }
}
