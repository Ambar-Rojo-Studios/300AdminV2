import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  MapaEstablecimientoComponent,
  Coords,
} from '../../../shared/components/mapa-establecimiento';

/**
 * Form de admin para crear/editar un Establecimiento — sección de
 * captura de coordenadas.
 *
 * Renderiza el mapa unificado en modo `'seleccionar'` con el bloque de
 * "pegar enlace de Google Maps" activo. Captura `coordsChange` y los
 * enchufa al form (campos `fldCoordLatitud` / `fldCoordLongitud`).
 *
 * El resto del form (nombre, dirección, fotos, menú, etc.) se agrega en
 * otra iteración. Esta Fase 2 solo prueba la integración del modo
 * selección del mapa unificado.
 */
@Component({
  selector: 'app-establecimiento-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MapaEstablecimientoComponent],
  templateUrl: './establecimiento-form.component.html',
})
export class EstablecimientoFormComponent {
  /** Coordenadas actuales del form (strings, igual que el DTO del backend). */
  readonly coords = signal<Coords | null>(null);

  /** Coordenadas iniciales si fuera edición (placeholder). */
  readonly coordsIniciales: Coords | null = null;

  /** Captura coords emitidos por el mapa (drag o extracción de enlace). */
  onCoordsChange(coords: Coords): void {
    this.coords.set(coords);
    // Aquí se actualizaría el formGroup/reactive form con fldCoordLatitud
    // y fldCoordLongitud cuando el resto del form exista.
    console.log('[EstablecimientoForm] coords actualizadas:', coords);
  }
}