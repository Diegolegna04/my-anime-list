import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.accessoEffettuato$.pipe(
    map(accessoEffettuato => {
      // Dopo il login si arriva alla pagina chiesta
      return accessoEffettuato
        || router.createUrlTree(['/register-login'], { queryParams: { returnUrl: state.url } });
    })
  )
};
