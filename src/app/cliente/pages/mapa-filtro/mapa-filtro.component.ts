import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  MapaEstablecimientoComponent,
  EstablecimientoMarker,
} from '../../../shared/components/mapa-establecimiento';
import {
  FilterMapComponent,
  CoordenadaFiltrada,
} from '../filtrar-mapa/filtrar-mapa.component';

@Component({
  selector: 'app-mapa-filtro',
  standalone: true,
  imports: [CommonModule, MapaEstablecimientoComponent, FilterMapComponent],
  templateUrl: './mapa-filtro.component.html',
  styleUrls: ['./mapa-filtro.component.css'],
})
export class MapaFiltroComponent {
  private readonly router = inject(Router);

  readonly filtrados = signal<EstablecimientoMarker[]>([]);

  onCoordenadasFiltradas(list: CoordenadaFiltrada[]): void {
    const mapped: EstablecimientoMarker[] = list
      .map((c) => {
        if (!Number.isFinite(c.lat) || !Number.isFinite(c.lng)) return null;
        return {
          id: c.id ?? 0,
          nombre: c.nombre,
          lat: c.lat,
          lng: c.lng,
          imagen: c.imagen,
          direccion: c.dir,
        } as EstablecimientoMarker;
      })
      .filter((x): x is EstablecimientoMarker => x !== null);

    this.filtrados.set(mapped);
  }

  irAlDetalle(est: EstablecimientoMarker): void {
    if (est.id && est.id > 0) {
      this.router.navigate(['/detalleEstablecimiento', est.id]);
    } else {
      console.warn('[MapaFiltro] markerClick sin id navegable:', est);
    }
  }
}