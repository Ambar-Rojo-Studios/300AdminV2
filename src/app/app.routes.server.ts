import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'admin/**', renderMode: RenderMode.Client },
  { path: 'mi-lugar/**', renderMode: RenderMode.Client },
  { path: 'detalleEstablecimiento/:id', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Prerender },
];