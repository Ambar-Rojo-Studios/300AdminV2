import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  MapaEstablecimientoComponent,
  EstablecimientoMarker,
} from '../../../shared/components/mapa-establecimiento';
import {
  FilterMapComponent,
  CoordenadaFiltradaV1,
} from '../filtrar-mapa/filtrar-mapa.component';

/**
 * Pantalla `/mapa-filtro` del sitio público — combina panel externo de
 * filtros + mapa unificado.
 *
 * Flujo:
 *   <app-filter-map> emite coordenadasFiltradas (shape v1)
 *        → este wrapper mapea a EstablecimientoMarker[] (lat/lng number)
 *        → <app-mapa-establecimiento> los pinta
 *        → markerClick → navega a detalle
 *
 * La lógica de filtrado (Servicio HTTP) vive en FilterMapComponent
 * (stub por ahora). Este wrapper solo orquesta layout + mapeo.
 */
@Component({
  selector: 'app-mapa-filtro',
  standalone: true,
  imports: [CommonModule, MapaEstablecimientoComponent, FilterMapComponent],
  templateUrl: './mapa-filtro.component.html',
  styleUrls: ['./mapa-filtro.component.css'],
})
export class MapaFiltroComponent {
  private readonly router = inject(Router);

  /** Lista filtrada ya mapeada a EstablecimientoMarker[]. */
  readonly filtrados = signal<EstablecimientoMarker[]>([]);

  /** Recibe coords del FilterMapComponent (shape v1) y las mapea. */
  onCoordenadasFiltradas(list: CoordenadaFiltradaV1[]): void {
    const mapped: EstablecimientoMarker[] = list
      .map((c) => {
        if (!Number.isFinite(c.lat) || !Number.isFinite(c.lng)) return null;
        return {
          id: 0, // v1 no llevaba id en este flujo; el detalle usa [establecimientoId]
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
    // En el flujo de filtro no tenemos id del establecimiento (solo coords).
    // Cuando se porte FilterMapComponent real, debe incluir `id` en el shape
    // y habilitar navegación. Por ahora no navegamos.
    console.log('[MapaFiltro] markerClick sin id navegable:', est);
  }
}