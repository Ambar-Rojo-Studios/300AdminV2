import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

/**
 * Interceptor que adjunta el token JWT a las peticiones autenticadas.
 */
export const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.obtenerToken();
  const isApiRequest = req.url.startsWith('/api/');

  const esPublica = ['/api/password-reset/', '/api/establecimientosPublic/', '/api/etiquetasPublic/', '/api/comentariosPublic/', '/api/etiquetaPorEstablecimientoPublic/']
    .some(prefijo => req.url.startsWith(prefijo));

  if (token && isApiRequest && !esPublica) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          const rol = authService.obtenerRol();
          const redirectUrl = rol === 'usuario' || rol === 'botanero' ? '/login/usuario' : '/login/cliente';
          authService.cerrarSesion(redirectUrl);
        }
        return throwError(() => error);
      })
    );
  }

  return next(req);
};