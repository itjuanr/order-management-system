import { Component } from '@angular/core';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ProductsManagement-Angular';

  // Injetado aqui para o tema salvo ser aplicado também nas telas de login/registro.
  constructor(private theme: ThemeService) {}
}
