import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <header class="public-header">
      <a routerLink="/" class="brand">300 Lugares</a>
      <nav>
        <a routerLink="/login/usuario">Iniciar sesión</a>
      </nav>
    </header>
    <main><router-outlet /></main>
  `,
  styles: `
    .public-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.5rem;
      border-bottom: 1px solid var(--border, #e5e5e5);
    }
    .brand { font-weight: 700; text-decoration: none; color: inherit; }
    nav a { text-decoration: none; }
  `
})
export class PublicLayoutComponent {}
