import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { FiltroBusquedaComponent } from '../../components/filtro-busqueda/filtro-busqueda.component';
import {
  MapaEstablecimientoComponent,
  EstablecimientoMarker,
} from '../../../shared/components/mapa-establecimiento';
import { EstablecimientosService } from '../../../services/establecimientos.service';
import { EstablecimientoListDTO } from '../../../models/establecimiento.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-buscar',
  standalone: true,
  imports: [CommonModule, FiltroBusquedaComponent, MapaEstablecimientoComponent],
  templateUrl: './buscar.component.html',
  styleUrls: ['./buscar.component.css'],
})
export class BuscarComponent {
  private readonly establecimientosService = inject(EstablecimientosService);
  private readonly router = inject(Router);

  readonly markers = signal<EstablecimientoMarker[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly termino = signal('');

  async onBuscar(termino: string): Promise<void> {
    const value = termino.trim();
    this.termino.set(value);
    if (!value) {
      this.markers.set([]);
      return;
    }
    this.cargando.set(true);
    try {
      const res: any = await firstValueFrom(
        this.establecimientosService.obtenerEstablecimientoFiltrado(1, 50, value)
      );
      const list = (res?.cuerpoDeRespuesta ?? []) as EstablecimientoListDTO[];
      this.markers.set(this.mapear(list));
    } catch (e) {
      console.error('[Buscar] error:', e);
      this.error.set('No se pudo completar la búsqueda.');
    } finally {
      this.cargando.set(false);
    }
  }

  onSeleccionado(est: EstablecimientoListDTO): void {
    this.router.navigate(['/detalleEstablecimiento', est.idEstablecimiento]);
  }

  onMarkerClick(est: EstablecimientoMarker): void {
    this.router.navigate(['/detalleEstablecimiento', est.id]);
  }

  private mapear(list: EstablecimientoListDTO[]): EstablecimientoMarker[] {
    return list
      .map((est) => {
        const lat = parseFloat(est.fldCoordLatitud ?? '');
        const lng = parseFloat(est.fldCoordLongitud ?? '');
        if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
        return {
          id: est.idEstablecimiento,
          nombre: est.fldNombre ?? '',
          lat,
          lng,
          imagen: est.fldImgRefs ?? undefined,
          direccion: est.fldDireccion ?? undefined,
        } as EstablecimientoMarker;
      })
      .filter((x): x is EstablecimientoMarker => x !== null);
  }
}