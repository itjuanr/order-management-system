import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  return auth.estaLogado()
    ? true
    : inject(Router).createUrlTree(['/login'], { queryParams: { voltar: state.url } });
};

export const visitanteGuard: CanActivateFn = () =>
  inject(AuthService).estaLogado() ? inject(Router).createUrlTree(['/']) : true;
