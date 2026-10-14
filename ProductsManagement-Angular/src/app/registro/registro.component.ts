import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
})
export class RegistroComponent {
  registroForm: FormGroup;
  registroError: string | null = null;

  constructor(private authService: AuthService, private router: Router, private fb: FormBuilder) {
    this.registroForm = this.fb.group({
      login: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  registrar() {
    this.authService.registrar(this.registroForm.value).subscribe(
      () => {
        this.router.navigate(['/auth/login'], { queryParams: { registroSucesso: 'true' } });
      },
      (error) => {
        this.registroError = 'Erro ao registrar. Verifique suas informações.';
        console.error(error);
      }
    );
  }
}
