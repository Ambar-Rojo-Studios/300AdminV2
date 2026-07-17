import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-botanero-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <header class="botanero-header">
      <a routerLink="/mi-lugar" class="brand">Mi Lugar · 300 Lugares</a>
      <button type="button" (click)="cerrarSesion()">Cerrar sesión</button>
    </header>
    <main class="botanero-content"><router-outlet /></main>
  `,
  styles: `
    .botanero-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.5rem;
      border-bottom: 1px solid var(--border, #e5e5e5);
    }
    .brand { font-weight: 700; text-decoration: none; color: inherit; }
    .botanero-content { padding: 1.5rem; max-width: 960px; margin: 0 auto; }
  `
})
export class BotaneroLayoutComponent {
  private readonly auth = inject(AuthService);

  cerrarSesion(): void {
    this.auth.cerrarSesion();
  }
}
