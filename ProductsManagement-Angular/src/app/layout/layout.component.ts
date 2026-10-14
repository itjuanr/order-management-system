import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { ThemeService } from '../theme.service';
import { NAV_ITEMS, NavItem } from '../nav-items';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  navGroups: { label: string; items: NavItem[] }[] = ['Cadastros', 'Vendas'].map((label) => ({
    label,
    items: NAV_ITEMS.filter((item) => item.group === label),
  }));
  navOpen = false;
  username: string;

  constructor(private authService: AuthService, public theme: ThemeService) {
    this.username = this.readUsername();
  }

  logout(): void {
    this.authService.logout();
  }

  // O login do usuário vem no "sub" do JWT emitido pela API.
  private readUsername(): string {
    try {
      const payload = this.authService.token!.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(payload)).sub || 'Usuário';
    } catch {
      return 'Usuário';
    }
  }
}
