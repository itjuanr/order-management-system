import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private storageKey = 'theme';
  isDark = false;

  constructor() {
    const stored = localStorage.getItem(this.storageKey);
    this.apply(stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  toggle(): void {
    this.apply(!this.isDark);
    localStorage.setItem(this.storageKey, this.isDark ? 'dark' : 'light');
  }

  private apply(dark: boolean): void {
    this.isDark = dark;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }
}
