import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Áreas privadas: se renderizan en el cliente (dependen del token)
  { path: 'admin/**', renderMode: RenderMode.Client },
  { path: 'mi-lugar/**', renderMode: RenderMode.Client },
  // Web pública y auth: prerender para SEO
  { path: '**', renderMode: RenderMode.Prerender }
];
