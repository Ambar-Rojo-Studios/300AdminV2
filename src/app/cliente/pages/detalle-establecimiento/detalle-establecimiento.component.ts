import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import {
  MapaEstablecimientoComponent,
  EstablecimientoMarker,
} from '../../../shared/components/mapa-establecimiento';

/**
 * Pantalla `/detalleEstablecimiento/:id` del sitio público.
 *
 * Lee `:id` de la ruta y se lo pasa al mapa unificado en modo "single"
 * híbrido: el componente resolve el establecimiento vía
 * `EstablecimientosService.obtenerIdPorEstablecimiento(id)` y pinta un
 * único marcador centrado.
 *
 * El resto del detalle (galería, comentarios, rating) se agrega en
 * otra iteración. Esta Fase 2 solo prueba la integración del modo single.
 */
@Component({
  selector: 'app-detalle-establecimiento',
  standalone: true,
  imports: [CommonModule, MapaEstablecimientoComponent],
  templateUrl: './detalle-establecimiento.component.html',
})
export class DetalleEstablecimientoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  readonly establecimientoId = signal<number | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    // `:id` puede venir como param de ruta o como snapshot inicial.
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (Number.isNaN(id) || id <= 0) {
      this.error.set('ID de establecimiento inválido.');
      return;
    }
    this.establecimientoId.set(id);
  }

  onMarkerClick(_est: EstablecimientoMarker): void {
    // En el detalle, el click del marcador no navega (ya estamos en el
    // detalle). El handler existe para no romper el output pero no-op.
  }

  onMapaError(msg: string): void {
    this.error.set(msg);
  }
}