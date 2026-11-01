import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ThemeService } from '../../shared/services/theme.service';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-botanero-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <header class="botanero-header">
      <a routerLink="/mi-lugar" class="brand"><span class="brand-mark">300</span><span>Mi Lugar<small>Tu espacio en 300 Lugares</small></span></a>
      <nav class="botanero-nav" aria-label="Opciones del panel">
        <a routerLink="/mi-lugar" class="panel-link"><i class="fas fa-table-cells-large" aria-hidden="true"></i> Mi panel</a><a routerLink="/" class="site-link">Ver sitio <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a>
        <button type="button" class="btn-secondary theme-toggle" (click)="theme.toggle()" [attr.aria-label]="theme.theme() === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"><i class="fas" [class.fa-sun]="theme.theme() === 'dark'" [class.fa-moon]="theme.theme() === 'light'" aria-hidden="true"></i></button>
        <button type="button" class="btn-secondary logout" (click)="cerrarSesion()"><i class="fas fa-right-from-bracket" aria-hidden="true"></i><span>Cerrar sesión</span></button>
      </nav>
    </header>
    <main class="botanero-content"><router-outlet /></main>
  `,
  styleUrl: './botanero-layout.component.css',
})
export class BotaneroLayoutComponent {
  readonly theme = inject(ThemeService);
  private readonly auth = inject(AuthService);

  cerrarSesion(): void {
    this.auth.cerrarSesion();
  }
}
