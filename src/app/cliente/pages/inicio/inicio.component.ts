import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { CarruselEstablecimientosComponent } from '../../components/carrusel-establecimientos/carrusel-establecimientos.component';
import { CardEstablecimientoComponent } from '../../components/card-establecimiento/card-establecimiento.component';
import {
  MapaEstablecimientoComponent,
  EstablecimientoMarker,
} from '../../../shared/components/mapa-establecimiento';
import { EstablecimientosPublicService } from '../../../services/establecimientos-public.service';
import { EstablecimientoListDTO } from '../../../models/establecimiento.model';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    CommonModule,
    CarruselEstablecimientosComponent,
    CardEstablecimientoComponent,
    MapaEstablecimientoComponent,
  ],
  templateUrl: './inicio.component.html',
})
export class InicioComponent implements OnInit {
  private readonly publicService = inject(EstablecimientosPublicService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly establecimientos = signal<EstablecimientoListDTO[]>([]);
  readonly carrusel = signal<EstablecimientoListDTO[]>([]);
  readonly markers = signal<EstablecimientoMarker[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const res: any = await firstValueFrom(
        this.publicService.obtenerEstablecimientosPublicos(1, 100)
      );
      const list = (res?.cuerpoDeRespuesta ?? []) as EstablecimientoListDTO[];
      this.establecimientos.set(list);
      this.carrusel.set(list.slice(0, 6));
      this.markers.set(this.mapear(list));
    } catch (e) {
      console.error('[Inicio] error cargando establecimientos:', e);
      this.error.set('No se pudieron cargar los establecimientos.');
    } finally {
      this.cargando.set(false);
    }
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

  irAlDetalle(est: EstablecimientoMarker | EstablecimientoListDTO): void {
    const id = 'id' in est
      ? (est as EstablecimientoMarker).id
      : (est as EstablecimientoListDTO).idEstablecimiento;
    this.router.navigate(['/detalleEstablecimiento', id]);
  }
}