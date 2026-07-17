import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard que evita que usuarios autenticados entren nuevamente a pantallas de acceso.
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.estaAutenticado()) {
    return true;
  }

  if (authService.estaUsuarioLogueado()) {
    router.navigate(['/admin/dashboard']);
  } else {
    router.navigate(['/inicio']);
  }
  return false;
};