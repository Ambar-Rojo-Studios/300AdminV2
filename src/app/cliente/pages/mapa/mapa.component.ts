import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  MapaEstablecimientoComponent,
  EstablecimientoMarker,
} from '../../../shared/components/mapa-establecimiento';
import { EstablecimientosPublicService } from '../../../services/establecimientos-public.service';

/**
 * Pantalla `/mapa` del sitio público — variante fullscreen del inicio.
 *
 * Carga la misma lista que `InicioComponent` y renderiza el mapa ocupando
 * toda la viewport. Tip: si la lógica de carga crece, extraer a un
 * `EstablecimientosStore` compartido; para v2 basta duplicar la carga
 * mínima en dos wrappers (KISS).
 */
@Component({
  selector: 'app-mapa-page',
  standalone: true,
  imports: [CommonModule, MapaEstablecimientoComponent],
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.css'],
})
export class MapaComponent implements OnInit, OnDestroy {
  private readonly publicService = inject(EstablecimientosPublicService);
  private readonly router = inject(Router);

  readonly markers = signal<EstablecimientoMarker[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.publicService
      .obtenerEstablecimientosPublicos(1, 100)
      .subscribe({
        next: (res: any) => {
          const list = (res?.cuerpoDeRespuesta ?? []) as any[];
          this.markers.set(this.mapear(list));
          this.cargando.set(false);
        },
        error: (err) => {
          console.error('[Mapa] error cargando establecimientos:', err);
          this.error.set('No se pudieron cargar los establecimientos.');
          this.cargando.set(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private mapear(list: any[]): EstablecimientoMarker[] {
    return list
      .map((est) => {
        const lat = parseFloat(est.fldCoordLatitud);
        const lng = parseFloat(est.fldCoordLongitud);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
        return {
          id: est.idEstablecimiento,
          nombre: est.fldNombre ?? '',
          lat,
          lng,
          imagen: est.fldImgRefs,
          direccion: est.fldDireccion,
        } as EstablecimientoMarker;
      })
      .filter((x): x is EstablecimientoMarker => x !== null);
  }

  irAlDetalle(est: EstablecimientoMarker): void {
    this.router.navigate(['/detalleEstablecimiento', est.id]);
  }
}