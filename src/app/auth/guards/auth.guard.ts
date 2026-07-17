import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard que protege rutas y obliga a iniciar sesión antes de acceder.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.estaAutenticado()) {
    return true;
  }

  const redirectUrl = state.url.startsWith('/admin') ? '/login/usuario' : '/login/cliente';
  router.navigate([redirectUrl], { queryParams: { returnUrl: state.url } });
  return false;
};