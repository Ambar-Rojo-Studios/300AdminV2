import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="admin-shell">
      <aside class="admin-sidebar">
        <p class="brand">300 Admin</p>
        <nav>
          <a routerLink="/admin/dashboard">Dashboard</a>
          <a routerLink="/admin/cuentas-botanero">Cuentas de botaneros</a>
          <a routerLink="/admin/empresas">Empresas</a>
          <a routerLink="/admin/establecimientos">Establecimientos</a>
          <!-- ponytail: los links de CRUDs se agregan conforme se migren las páginas -->
        </nav>
        <button type="button" (click)="cerrarSesion()">Cerrar sesión</button>
      </aside>
      <main class="admin-content"><router-outlet /></main>
    </div>
  `,
  styles: `
    .admin-shell { display: flex; min-height: 100vh; }
    .admin-sidebar {
      width: 220px;
      padding: 1rem;
      border-right: 1px solid var(--border, #e5e5e5);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .admin-sidebar nav { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }
    .admin-sidebar a { text-decoration: none; }
    .brand { font-weight: 700; margin: 0; }
    .admin-content { flex: 1; padding: 1.5rem; }
  `
})
export class AdminLayoutComponent {
  private readonly auth = inject(AuthService);

  cerrarSesion(): void {
    this.auth.cerrarSesion();
  }
}
