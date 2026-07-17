import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Interceptor que adjunta el token JWT a las peticiones autenticadas.
 */
export const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.obtenerToken();
  const isApiRequest = req.url.startsWith('/api/');

  if (token && isApiRequest) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          authService.cerrarSesion();
          const redirectUrl = req.url.includes('/admin') ? '/login/usuario' : '/login/cliente';
          router.navigate([redirectUrl]);
        }
        return throwError(() => error);
      })
    );
  }

  return next(req);
};