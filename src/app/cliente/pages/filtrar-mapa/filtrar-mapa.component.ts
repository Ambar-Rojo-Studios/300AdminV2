import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Shape que v1 emitía en `coordenadasFiltradas`. Se conserva en v2 para
 * que la migración de FilterMapComponent sea drop-in cuando se porte la
 * versión HTTP real. El wrapper `MapaFiltroComponent` se encarga de
 * mapear este shape a `EstablecimientoMarker` (lat/lng como number).
 */
export interface CoordenadaFiltradaV1 {
  lat: number;
  lng: number;
  nombre: string;
  imagen?: string;
  /** v1 llamaba `dir` a este campo (no `direccion`). Conservado. */
  dir?: string;
}

/**
 * STUB de FilterMapComponent para v2.
 *
 * Panel externo de filtros por etiqueta/categoría. En v1 este componente
 * llamaba a `EtiquetasService` y `EstablecimientosService.filtrarPorEtiquetas`
 * y emitía la lista filtrada. Aquí es un stub vacío que emite `[]` al init
 * para que el wrapper compile y pueda integrarse con el mapa unificado.
 *
 * Cuando se porte la lógica real de v1, mantener el selector `app-filter-map`
 * y el `@Output() coordenadasFiltradas` para no romper al wrapper.
 */
@Component({
  selector: 'app-filter-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filtrar-mapa.component.html',
  styleUrls: ['./filtrar-mapa.component.css'],
})
export class FilterMapComponent {
  @Output() coordenadasFiltradas = new EventEmitter<CoordenadaFiltradaV1[]>();

  /** Emite lista vacía al iniciar — el mapa mostrará empty state. */
  emitirVacio(): void {
    this.coordenadasFiltradas.emit([]);
  }
}