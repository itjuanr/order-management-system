import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'tema';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly escuro = signal(false);

  constructor() {
    let salvo: string | null = null;
    try {
      salvo = localStorage.getItem(STORAGE_KEY);
    } catch {
      // armazenamento indisponível: segue o sistema
    }
    this.aplicar(salvo ? salvo === 'escuro' : matchMedia('(prefers-color-scheme: dark)').matches);
  }

  alternar(): void {
    this.aplicar(!this.escuro());
    try {
      localStorage.setItem(STORAGE_KEY, this.escuro() ? 'escuro' : 'claro');
    } catch {
      // ignora
    }
  }

  private aplicar(escuro: boolean): void {
    this.escuro.set(escuro);
    document.documentElement.setAttribute('data-theme', escuro ? 'dark' : 'light');
  }
}
