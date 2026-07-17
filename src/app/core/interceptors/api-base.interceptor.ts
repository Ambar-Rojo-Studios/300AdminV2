import { HttpInterceptorFn } from '@angular/common/http';
import { API_BASE_URL } from '../api-config';

/**
 * Endpoints cuyo controller en el backend NO vive bajo /api (rutas legacy).
 * Para estos se quita el prefijo /api antes de mandar la petición.
 * El backend es inconsistente a propósito: la unificación /api se revirtió
 * el 2026-07-08 por compatibilidad con la app móvil. Ver ESTADO.md.
 */
const REMOVE_API_PREFIX_ENDPOINTS = [
  'auth',
  'suscripcion',
  'promocion',
  'etiqueta_x_tipo_establecimiento',
  'etiqueta_x_establecimiento',
  'etiqueta_x_cliente',
  'usuario',
  'capsula',
  'historial'
];

/**
 * Antepone API_BASE_URL a las peticiones relativas /api/** y quita el prefijo
 * /api para los endpoints legacy. Debe registrarse DESPUÉS del authInterceptor,
 * que decide adjuntar el token mirando el prefijo /api de la URL relativa.
 */
export const apiBaseInterceptorFn: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('http://') && !req.url.startsWith('https://') && req.url.startsWith('/api/')) {
    const match = REMOVE_API_PREFIX_ENDPOINTS.find(endpoint => req.url.startsWith(`/api/${endpoint}`));
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const url = match ? baseUrl + req.url.replace(/^\/api\//, '/') : baseUrl + req.url;
    req = req.clone({ url });
  }
  return next(req);
};
