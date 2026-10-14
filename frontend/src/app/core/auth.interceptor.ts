import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/** Envia o JWT nas chamadas à API e encerra a sessão quando o servidor responde 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token;
  const ehApi = req.url.startsWith('/api/');
  const ehAuth = req.url.startsWith('/api/auth/');

  const request =
    ehApi && !ehAuth && token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((erro: unknown) => {
      if (erro instanceof HttpErrorResponse && erro.status === 401 && ehApi && !ehAuth) {
        auth.logout('expirada');
      }
      return throwError(() => erro);
    }),
  );
};
