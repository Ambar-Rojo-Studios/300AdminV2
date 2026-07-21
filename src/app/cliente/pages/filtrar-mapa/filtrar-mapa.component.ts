import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import { EtiquetasService } from '../../../services/etiquetas.service';
import { EstablecimientosService } from '../../../services/establecimientos.service';
import {
  ListCategoriaConEtiquetasDTO,
} from '../../../models/etiquetas.model';
import { EstablecimientoResponseDTO } from '../../../models/establecimiento.model';

export interface CoordenadaFiltrada {
  lat: number;
  lng: number;
  nombre: string;
  imagen?: string;
  dir?: string;
  id?: number;
}

@Component({
  selector: 'app-filter-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filtrar-mapa.component.html',
  styleUrls: ['./filtrar-mapa.component.css'],
})
export class FilterMapComponent implements OnInit {
  @Output() coordenadasFiltradas = new EventEmitter<CoordenadaFiltrada[]>();

  categoriasConEtiquetas: ListCategoriaConEtiquetasDTO[] = [];
  fldEtiquetCsv: number[] = [];
  esBusquedaEstricta = false;
  panelOculto = false;

  constructor(
    private readonly etiquetasService: EtiquetasService,
    private readonly establecimientosService: EstablecimientosService
  ) {}

  ngOnInit(): void {
    this.obtenerCategoriasConEtiquetas();
  }

  async obtenerCategoriasConEtiquetas(): Promise<void> {
    try {
      const res: any = await firstValueFrom(
        this.etiquetasService.obtenerCategoriasConEtiquetas()
      );
      this.categoriasConEtiquetas = res?.cuerpoDeRespuesta ?? [];
    } catch (err) {
      console.error('[FilterMap] error al cargar categorías:', err);
    }
  }

  alternarEtiqueta(idEtiqueta: number): void {
    const idx = this.fldEtiquetCsv.indexOf(idEtiqueta);
    if (idx === -1) this.fldEtiquetCsv.push(idEtiqueta);
    else this.fldEtiquetCsv.splice(idx, 1);
    this.aplicarFiltrado();
  }

  alternarBusquedaEstricta(): void {
    this.esBusquedaEstricta = !this.esBusquedaEstricta;
    this.aplicarFiltrado();
  }

  async aplicarFiltrado(): Promise<void> {
    if (this.fldEtiquetCsv.length === 0) {
      this.coordenadasFiltradas.emit([]);
      return;
    }
    try {
      const res: any = await firstValueFrom(
        this.establecimientosService.filtrarPorEtiquetas(
          this.fldEtiquetCsv,
          this.esBusquedaEstricta
        )
      );
      const list = (res?.cuerpoDeRespuesta ?? []) as EstablecimientoResponseDTO[];
      const coords: CoordenadaFiltrada[] = list
        .map((est) => {
          const lat = parseFloat(est.fldCoorLatitud);
          const lng = parseFloat(est.fldCoodLongitud);
          if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
          return {
            id: est.idEstablecimiento,
            lat,
            lng,
            nombre: est.fldNombre,
            imagen: est.fldImgRefs,
            dir: est.fldDireccion,
          } as CoordenadaFiltrada;
        })
        .filter((x): x is CoordenadaFiltrada => x !== null);
      this.coordenadasFiltradas.emit(coords);
    } catch (err) {
      console.error('[FilterMap] error al filtrar:', err);
    }
  }

  estaSeleccionada(idEtiqueta: number): boolean {
    return this.fldEtiquetCsv.includes(idEtiqueta);
  }

  alternarPanel(): void {
    this.panelOculto = !this.panelOculto;
  }
}