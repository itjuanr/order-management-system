import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme.service';
import { OverlaysComponent } from './shared/overlays.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, OverlaysComponent],
  template: `
    <router-outlet />
    <app-overlays />
  `,
})
export class App {
  // Instancia o serviço já na abertura para o tema salvo valer também no login.
  private readonly theme = inject(ThemeService);
}
