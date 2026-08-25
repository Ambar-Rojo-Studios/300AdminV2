import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'admin/**', renderMode: RenderMode.Client },
  { path: 'mi-lugar/**', renderMode: RenderMode.Client },
  { path: '', renderMode: RenderMode.Server },
  { path: 'mapa', renderMode: RenderMode.Server },
  { path: 'mapa-filtro', renderMode: RenderMode.Server },
  { path: 'buscar', renderMode: RenderMode.Server },
  { path: 'detalleEstablecimiento/:id', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Prerender },
];