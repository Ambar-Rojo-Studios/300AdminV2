import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';
import { guestGuard } from './auth/guards/guest.guard';
import { createRoleGuard } from './auth/guards/role.guard';

/**
 * Rutas de 300 Lugares v2.
 *
 * Estructura base aportada por el esqueleto (layouts + auth + guards).
 * Rutas del mapa unificado añadidas en la rama `mapa`:
 *   - `mapa`                     (público, fullscreen)
 *   - `mapa-filtro`              (público, filtros + mapa)
 *   - `detalleEstablecimiento/:id` (público, single-by-id)
 *   - `admin/establecimiento`    (admin, form selección de coords)
 *
 * El path `''` (inicio) estaba como placeholder en el esqueleto; se
 * reemplazó por `InicioComponent` completo (carga HTTP + mapa + navigate).
 *
 * Convención: lazy-load con `loadComponent` (AGENTS.md §5.2 #5). Sin
 * `NgModule`. Rutas admin/botanero con `authGuard` + `createRoleGuard`.
 */
export const routes: Routes = [
  // ── Web pública (public-layout) ───────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./layouts/public-layout/public-layout.component').then(
        (m) => m.PublicLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./cliente/pages/inicio/inicio.component').then(
            (m) => m.InicioComponent
          ),
      },
      {
        path: 'mapa',
        title: 'Mapa — 300 Lugares',
        loadComponent: () =>
          import('./cliente/pages/mapa/mapa.component').then(
            (m) => m.MapaComponent
          ),
      },
      {
        path: 'mapa-filtro',
        title: 'Mapa con filtros — 300 Lugares',
        loadComponent: () =>
          import('./cliente/pages/mapa-filtro/mapa-filtro.component').then(
            (m) => m.MapaFiltroComponent
          ),
      },
      {
        path: 'detalleEstablecimiento/:id',
        title: 'Detalle del establecimiento — 300 Lugares',
        loadComponent: () =>
          import(
            './cliente/pages/detalle-establecimiento/detalle-establecimiento.component'
          ).then((m) => m.DetalleEstablecimientoComponent),
      },
    ],
  },

  // ── Auth (sin layout) ────────────────────────────────────────
  {
    path: 'login/usuario',
    canActivate: [guestGuard],
    loadComponent: () =>
      import(
        './auth/components/login-acceso-usuario/login-acceso-usuario.component'
      ).then((m) => m.LoginComponent),
  },
  {
    path: 'login/cliente',
    canActivate: [guestGuard],
    loadComponent: () =>
      import(
        './auth/components/login-acceso-cliente/login-acceso-cliente.component'
      ).then((m) => m.LoginAccesoClienteComponent),
  },
  {
    path: 'registro/cliente',
    loadComponent: () =>
      import(
        './auth/components/registro-cliente/registro-cliente.component'
      ).then((m) => m.RegistroClienteComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import(
        './auth/components/password-reset-controller/components/forgot-password/forgot-password.component'
      ).then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'validate-code',
    loadComponent: () =>
      import(
        './auth/components/password-reset-controller/components/validate-code/validate-code.component'
      ).then((m) => m.ValidateCode),
  },
  // Nota: `reset-password` no se registra aún porque el componente del
  // esqueleto está completamente comentado (stub pendiente). Cuando el
  // humano del esqueleto lo implemente, añadir aquí:
  //   { path: 'reset-password', loadComponent: () =>
  //       import('.../reset-password/reset-password.component')
  //         .then(m => m.ResetPasswordComponent) }
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./shared/components/unauthorized/unauthorized.component').then(
        (m) => m.UnauthorizedComponent
      ),
  },

  // ── Panel admin (ROLE_USUARIO) ───────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard, createRoleGuard(['usuario'])],
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./admin/pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'cuentas-botanero',
        loadComponent: () =>
          import(
            './admin/pages/cuentas-botanero/cuentas-botanero.component'
          ).then((m) => m.CuentasBotaneroComponent),
      },
      {
        path: 'establecimiento',
        title: 'Admin — Establecimiento',
        loadComponent: () =>
          import(
            './admin/pages/establecimiento/establecimiento-form.component'
          ).then((m) => m.EstablecimientoFormComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // ── Portal de botaneros (ROLE_BOTANERO) ──────────────────────
  {
    path: 'mi-lugar',
    canActivate: [authGuard, createRoleGuard(['botanero'])],
    loadComponent: () =>
      import('./layouts/botanero-layout/botanero-layout.component').then(
        (m) => m.BotaneroLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import(
            './botanero/pages/mis-establecimientos/mis-establecimientos.component'
          ).then((m) => m.MisEstablecimientosComponent),
      },
      {
        path: 'establecimiento/:id',
        loadComponent: () =>
          import(
            './botanero/pages/establecimiento-detalle/establecimiento-detalle.component'
          ).then((m) => m.EstablecimientoDetalleComponent),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];