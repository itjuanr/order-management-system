// login.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { MessageService } from '../message.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loginError: string | null = null;
  loginSuccess: string | null = null; 

  constructor(
    private authService: AuthService,
    private router: Router,
    private formBuilder: FormBuilder,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.initializeForm();

    this.messageService.message$.subscribe(message => {
      if (message.type === 'success') {
        this.loginSuccess = message.text; 
      } else if (message.type === 'error') {
        this.loginError = message.text;
      }
    });
  }

  initializeForm() {
    this.loginForm = this.formBuilder.group({
      login: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  login() {
    this.authService.login(this.loginForm.value).subscribe(
      () => {
        this.loginError = null;

        this.messageService.showMessage({ text: 'Login bem-sucedido!', type: 'success' });

        this.router.navigate(['/dashboard']);
      },
      (error) => {
        console.error('Erro no login:', error);
        this.loginError = this.authService.handleLoginError(error);

        this.messageService.showMessage({ text: this.loginError, type: 'error' });
      }
    );
  }
}
