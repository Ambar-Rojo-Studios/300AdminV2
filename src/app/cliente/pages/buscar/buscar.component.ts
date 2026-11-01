import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { EstadoBusqueda, FiltroBusquedaComponent } from '../../components/filtro-busqueda/filtro-busqueda.component';
import { MapaEstablecimientoComponent, EstablecimientoMarker } from '../../../shared/components/mapa-establecimiento';

@Component({
  selector: 'app-buscar', standalone: true,
  imports: [CommonModule, RouterLink, FiltroBusquedaComponent, MapaEstablecimientoComponent],
  templateUrl: './buscar.component.html', styleUrls: ['./buscar.component.css'],
})
export class BuscarComponent {
  readonly router = inject(Router);
  readonly estado = signal<EstadoBusqueda>({ termino: '', resultados: [], cargando: false, error: null });
  readonly markers = signal<EstablecimientoMarker[]>([]);

  onEstado(estado: EstadoBusqueda) {
    this.estado.set(estado);
    this.markers.set(estado.resultados.flatMap((est) => {
      const lat = parseFloat(est.fldCoordLatitud ?? '');
      const lng = parseFloat(est.fldCoordLongitud ?? '');
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
      return [{ id: est.idEstablecimiento, nombre: est.fldNombre, lat, lng,
        imagen: est.fldImgRefs ?? undefined, direccion: est.fldDireccion ?? undefined }];
    }));
  }
}
