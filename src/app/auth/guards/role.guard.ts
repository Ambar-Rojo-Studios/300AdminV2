import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Crea un guard dinámico para restringir acceso según uno o varios roles permitidos.
 */
export const createRoleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.estaAutenticado()) {
      const redirectUrl = state.url.startsWith('/admin') ? '/login/usuario' : '/login/cliente';
      router.navigate([redirectUrl], { queryParams: { returnUrl: state.url } });
      return false;
    }

    const userRole = authService.obtenerRol();
    if (userRole === null || !allowedRoles.includes(userRole)) {
      router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  };
};