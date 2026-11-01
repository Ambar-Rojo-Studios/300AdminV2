import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';
import { guestGuard } from './auth/guards/guest.guard';
import { createRoleGuard } from './auth/guards/role.guard';

/**
 * Rutas de 300 Lugares v2.
 *
 * Fusion de:
 *   - Esqueleto (main): layouts + auth + guards + CRUDs admin + portal botanero
 *   - Agente (mapa):  web publica completa + admin/establecimiento form
 *
 * Rutas del mapa unificado (agente):
 *   - `mapa`                     (público, fullscreen)
 *   - `mapa-filtro`              (público, filtros + mapa)
 *   - `buscar`                   (público, buscador + mapa)
 *   - `detalleEstablecimiento/:id` (público, single-by-id)
 *   - `admin/establecimiento`    (admin, form selección de coords)
 *
 * Convencion: lazy-load con `loadComponent` (AGENTS.md §5.2 #5).
 * Sin `NgModule`. Rutas admin/botanero con `authGuard` + `createRoleGuard`.
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
        title: '300 Lugares — Descubre establecimientos',
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
        path: 'buscar',
        title: 'Buscar — 300 Lugares',
        loadComponent: () =>
          import('./cliente/pages/buscar/buscar.component').then(
            (m) => m.BuscarComponent
          ),
      },
      {
        path: 'detalleEstablecimiento/:id',
        title: 'Detalle — 300 Lugares',
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
    title: 'Acceso al panel — 300 Lugares',
    canActivate: [guestGuard],
    loadComponent: () =>
      import(
        './auth/components/login-acceso-usuario/login-acceso-usuario.component'
      ).then((m) => m.LoginComponent),
  },
  {
    path: 'login/cliente',
    title: 'Iniciar sesión — 300 Lugares',
    canActivate: [guestGuard],
    loadComponent: () =>
      import(
        './auth/components/login-acceso-cliente/login-acceso-cliente.component'
      ).then((m) => m.LoginAccesoClienteComponent),
  },
  {
    path: 'registro/cliente',
    title: 'Crear cuenta — 300 Lugares',
    loadComponent: () =>
      import(
        './auth/components/registro-cliente/registro-cliente.component'
      ).then((m) => m.RegistroClienteComponent),
  },
  {
    path: 'forgot-password',
    title: 'Recuperar contraseña — 300 Lugares',
    loadComponent: () =>
      import(
        './auth/components/password-reset-controller/components/forgot-password/forgot-password.component'
      ).then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'validate-code',
    title: 'Confirmar código — 300 Lugares',
    loadComponent: () =>
      import(
        './auth/components/password-reset-controller/components/validate-code/validate-code.component'
      ).then((m) => m.ValidateCode),
  },
  {
    path: 'reset-password',
    title: 'Nueva contraseña — 300 Lugares',
    loadComponent: () => import('./auth/components/password-reset-controller/components/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
  },
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
    title: 'Administración — 300 Lugares',
    canActivate: [authGuard, createRoleGuard(['usuario'])],
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    children: [
      {
        path: 'dashboard',
        title: 'Dashboard de administración — 300 Lugares',
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
        path: 'empresas',
        loadComponent: () =>
          import('./admin/pages/empresa/empresa.component').then(
            (m) => m.EmpresaComponent
          ),
      },
      {
        path: 'establecimientos',
        title: 'Establecimientos · Administración — 300 Lugares',
        loadComponent: () =>
          import(
            './admin/pages/establecimientos/establecimientos.component'
          ).then((m) => m.EstablecimientosComponent),
      },
      { path: 'establecimiento', redirectTo: 'establecimientos', pathMatch: 'full' },
      {
        path: 'marca',
        loadComponent: () =>
          import('./admin/pages/marca/marca.component').then(
            (m) => m.MarcaComponent
          ),
      },
      {
        path: 'tipos-establecimientos',
        loadComponent: () =>
          import(
            './admin/pages/tipos-establecimientos/tipos-establecimientos.component'
          ).then((m) => m.TiposEstablecimientosComponent),
      },
      {
        path: 'categoria-etiqueta',
        loadComponent: () =>
          import(
            './admin/pages/categoria-etiqueta/categoria-etiqueta.component'
          ).then((m) => m.CategoriaEtiquetaComponent),
      },
      {
        path: 'etiquetas',
        loadComponent: () =>
          import('./admin/pages/etiquetas/etiquetas.component').then(
            (m) => m.EtiquetasComponent
          ),
      },
      {
        path: 'promociones',
        loadComponent: () =>
          import('./admin/pages/promocion/promocion.component').then(
            (m) => m.PromocionComponent
          ),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./admin/pages/usuario/usuario.component').then(
            (m) => m.UsuarioComponent
          ),
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./admin/pages/cliente/cliente.component').then(
            (m) => m.ClienteComponent
          ),
      },
      {
        path: 'suscripciones',
        loadComponent: () =>
          import('./admin/pages/suscripcion/suscripcion.component').then(
            (m) => m.SuscripcionComponent
          ),
      },
      {
        path: 'capsulas',
        loadComponent: () =>
          import('./admin/pages/capsula/capsula.component').then(
            (m) => m.CapsulaComponent
          ),
      },
      {
        path: 'historial',
        loadComponent: () =>
          import('./admin/pages/historial/historial.component').then(
            (m) => m.HistorialComponent
          ),
      },
      {
        path: 'canjes',
        title: 'Canjes — Administración — 300 Lugares',
        loadComponent: () =>
          import('./admin/pages/canjes/canjes.component').then(m => m.CanjesComponent),
      },
      {
        path: 'comentarios',
        loadComponent: () =>
          import('./admin/pages/comentarios/comentarios.component').then(
            (m) => m.ComentariosComponent
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // ── Portal de botaneros (ROLE_BOTANERO) ──────────────────────
  {
    path: 'mi-lugar',
    title: 'Mi panel — 300 Lugares',
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
