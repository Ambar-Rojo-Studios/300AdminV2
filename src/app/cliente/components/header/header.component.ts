import { Component, inject, signal, HostListener, DestroyRef, ViewChild, ElementRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';

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

  @ViewChild('menuToggle') menuToggle?: ElementRef<HTMLButtonElement>;

  constructor() {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => this.cerrarMenu());
  }

  cerrarMenu() { this.menuMovilAbierto.set(false); }

  @HostListener('document:keydown.escape')
  cerrarConEscape() {
    if (this.menuMovilAbierto()) { this.cerrarMenu(); this.menuToggle?.nativeElement.focus(); }
    this.cancelarLogout();
  }

  readonly menuMovilAbierto = signal(false);
  readonly showLogoutModal = signal(false);

  alternarMenuMovil(): void {
    this.menuMovilAbierto.update((v) => !v);
  }

  estaClienteLogueado(): boolean {
    return this.authService.estaClienteLogueado();
  }

  cerrarSesionCliente(): void {
    this.showLogoutModal.set(true);
  }

  confirmarLogout(): void {
    this.authService.logoutCliente();
    this.showLogoutModal.set(false);
    this.menuMovilAbierto.set(false);
  }

  cancelarLogout(): void {
    this.showLogoutModal.set(false);
  }

  irADetalle(est: EstablecimientoListDTO): void {
    this.router.navigate(['/detalleEstablecimiento', est.idEstablecimiento]);
    this.menuMovilAbierto.set(false);
  }
}