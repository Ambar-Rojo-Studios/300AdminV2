import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';
import { guestGuard } from './auth/guards/guest.guard';
import { createRoleGuard } from './auth/guards/role.guard';

export const routes: Routes = [
  // ── Web pública ──────────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./layouts/public-layout/public-layout.component').then(m => m.PublicLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./cliente/pages/inicio/inicio.component').then(m => m.InicioComponent)
      }
    ]
  },

  // ── Auth (sin layout) ────────────────────────────────────────
  {
    path: 'login/usuario',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/components/login-acceso-usuario/login-acceso-usuario.component').then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./auth/components/password-reset-controller/components/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'validate-code',
    loadComponent: () => import('./auth/components/password-reset-controller/components/validate-code/validate-code.component').then(m => m.ValidateCode)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./shared/components/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },

  // ── Panel admin (ROLE_USUARIO) ───────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard, createRoleGuard(['usuario'])],
    loadComponent: () => import('./layouts/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./admin/pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'cuentas-botanero',
        loadComponent: () => import('./admin/pages/cuentas-botanero/cuentas-botanero.component').then(m => m.CuentasBotaneroComponent)
      },
      {
        path: 'empresas',
        loadComponent: () => import('./admin/pages/empresa/empresa.component').then(m => m.EmpresaComponent)
      },
      {
        path: 'establecimientos',
        loadComponent: () => import('./admin/pages/establecimientos/establecimientos.component').then(m => m.EstablecimientosComponent)
      },
      {
        path: 'marca',
        loadComponent: () => import('./admin/pages/marca/marca.component').then(m => m.MarcaComponent)
      },
      {
        path: 'tipos-establecimientos',
        loadComponent: () => import('./admin/pages/tipos-establecimientos/tipos-establecimientos.component').then(m => m.TiposEstablecimientosComponent)
      },
      {
        // ojo: la ruta vieja era /admin/CategoriaEtiqueta (PascalCase); esta va en minusculas
        path: 'categoria-etiqueta',
        loadComponent: () => import('./admin/pages/categoria-etiqueta/categoria-etiqueta.component').then(m => m.CategoriaEtiquetaComponent)
      },
      {
        path: 'etiquetas',
        loadComponent: () => import('./admin/pages/etiquetas/etiquetas.component').then(m => m.EtiquetasComponent)
      },
      {
        path: 'promociones',
        loadComponent: () => import('./admin/pages/promocion/promocion.component').then(m => m.PromocionComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // ── Portal de botaneros (ROLE_BOTANERO) ──────────────────────
  {
    path: 'mi-lugar',
    canActivate: [authGuard, createRoleGuard(['botanero'])],
    loadComponent: () => import('./layouts/botanero-layout/botanero-layout.component').then(m => m.BotaneroLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./botanero/pages/mis-establecimientos/mis-establecimientos.component').then(m => m.MisEstablecimientosComponent)
      },
      {
        path: 'establecimiento/:id',
        loadComponent: () => import('./botanero/pages/establecimiento-detalle/establecimiento-detalle.component').then(m => m.EstablecimientoDetalleComponent)
      }
    ]
  },

  { path: '**', redirectTo: '' }
];
