import { Component, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../auth/services/auth.service';
import { ThemeService } from '../../shared/services/theme.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'General',
    items: [{ path: '/admin/dashboard', label: 'Dashboard', icon: 'fa-gauge-high' }]
  },
  {
    title: 'Negocios',
    items: [
      { path: '/admin/establecimientos', label: 'Establecimientos', icon: 'fa-store' },
      { path: '/admin/empresas', label: 'Empresas', icon: 'fa-building' },
      { path: '/admin/marca', label: 'Marcas', icon: 'fa-copyright' },
      { path: '/admin/tipos-establecimientos', label: 'Tipos de establecimiento', icon: 'fa-shapes' },
      { path: '/admin/promociones', label: 'Promociones', icon: 'fa-bullhorn' }
    ]
  },
  {
    title: 'Etiquetas',
    items: [
      { path: '/admin/categoria-etiqueta', label: 'Categorías de etiqueta', icon: 'fa-layer-group' },
      { path: '/admin/etiquetas', label: 'Etiquetas', icon: 'fa-tag' }
    ]
  },
  {
    title: 'Contenido',
    items: [
      { path: '/admin/capsulas', label: 'Cápsulas culturales', icon: 'fa-book-open' },
      { path: '/admin/comentarios', label: 'Comentarios', icon: 'fa-comments' },
      { path: '/admin/historial', label: 'Historial de códigos', icon: 'fa-clock-rotate-left' },
      { path: '/admin/canjes', label: 'Canjes', icon: 'fa-ticket' }
    ]
  },
  {
    title: 'Personas',
    items: [
      { path: '/admin/usuarios', label: 'Usuarios', icon: 'fa-user-shield' },
      { path: '/admin/cuentas-botanero', label: 'Cuentas de botaneros', icon: 'fa-user-tie' },
      { path: '/admin/clientes', label: 'Clientes', icon: 'fa-users' },
      { path: '/admin/suscripciones', label: 'Suscripciones', icon: 'fa-id-card' }
    ]
  }
];

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly theme = inject(ThemeService);

  readonly navGroups = NAV_GROUPS;
  readonly menuAbierto = signal(false);

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.menuAbierto.set(false));
  }

  alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  cerrarMenu(boton: HTMLButtonElement): void {
    if (!this.menuAbierto()) return;
    this.menuAbierto.set(false);
    boton.focus();
  }

  cerrarSesion(): void {
    this.auth.cerrarSesion();
  }
}
