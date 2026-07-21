import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../auth/services/auth.service';
import { FiltroBusquedaComponent } from '../filtro-busqueda/filtro-busqueda.component';
import { EstablecimientoListDTO } from '../../../models/establecimiento.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FiltroBusquedaComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly menuMovilAbierto = signal(false);

  alternarMenuMovil(): void {
    this.menuMovilAbierto.update((v) => !v);
  }

  estaClienteLogueado(): boolean {
    return this.authService.estaClienteLogueado();
  }

  cerrarSesionCliente(): void {
    this.authService.logoutCliente();
  }

  irADetalle(est: EstablecimientoListDTO): void {
    this.router.navigate(['/detalleEstablecimiento', est.idEstablecimiento]);
    this.menuMovilAbierto.set(false);
  }
}