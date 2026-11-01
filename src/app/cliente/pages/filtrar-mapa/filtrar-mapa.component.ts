import { Component, EventEmitter, OnInit, OnDestroy, Output, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, firstValueFrom, map, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { EtiquetasPublicService } from '../../../services/etiquetas-public.service';
import { EstablecimientosPublicService } from '../../../services/establecimientos-public.service';
import { ApiResponseEstablecimiento, EstablecimientoListDTO, EstablecimientoResponseDTO } from '../../../models/establecimiento.model';
import { ListCategoriaConEtiquetasDTO } from '../../../models/etiquetas.model';

export interface CoordenadaFiltrada {
  lat: number; lng: number; nombre: string; imagen?: string; dir?: string; id?: number;
}

@Component({
  selector: 'app-filter-map', standalone: true, imports: [CommonModule],
  templateUrl: './filtrar-mapa.component.html', styleUrls: ['./filtrar-mapa.component.css'],
})
export class FilterMapComponent implements OnInit, OnDestroy {
  @Output() panelCambio = new EventEmitter<boolean>();
  @Output() coordenadasFiltradas = new EventEmitter<CoordenadaFiltrada[]>();
  categoriasConEtiquetas: ListCategoriaConEtiquetasDTO[] = [];
  fldEtiquetCsv: number[] = [];
  esBusquedaEstricta = false;
  panelOculto = false;
  cargandoCategorias = false;
  errorCategorias = '';
  cargando = false;
  error = '';
  total = 0;
  sinCoordenadas = 0;
  private readonly etiquetasService = inject(EtiquetasPublicService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly service = inject(EstablecimientosPublicService);
  private readonly consultas$ = new Subject<void>();
  private readonly destroy$ = new Subject<void>();

  constructor() {
    this.consultas$.pipe(
      switchMap(() => {
        this.cargando = true;
        this.error = '';
        this.coordenadasFiltradas.emit([]);
        const consulta: Observable<ApiResponseEstablecimiento<Array<EstablecimientoListDTO | EstablecimientoResponseDTO>>> = this.fldEtiquetCsv.length
          ? this.service.filtrarPorEtiquetas(this.fldEtiquetCsv, this.esBusquedaEstricta)
          : this.service.obtenerEstablecimientosPublicos(1, 100);
        return consulta.pipe(
          map((res) => {
            if (res && res.codigoEstatus !== 1) throw new Error(res.mensaje);
            const lista = res?.cuerpoDeRespuesta ?? [];
            const coords = lista.flatMap((est): CoordenadaFiltrada[] => {
              const lat = parseFloat('fldCoordLatitud' in est ? est.fldCoordLatitud : est.fldCoorLatitud);
              const lng = parseFloat('fldCoordLongitud' in est ? est.fldCoordLongitud : est.fldCoodLongitud);
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
              return [{ id: est.idEstablecimiento, lat, lng, nombre: est.fldNombre,
                imagen: est.fldImgRefs ?? undefined, dir: est.fldDireccion }];
            });
            return { total: lista.length, coords, error: '' };
          }),
          catchError(() => of({ total: 0, coords: [] as CoordenadaFiltrada[], error: 'No pudimos cargar los lugares. Intenta de nuevo.' }))
        );
      }), takeUntil(this.destroy$)
    ).subscribe((res) => {
      this.total = res.total;
      this.sinCoordenadas = res.total - res.coords.length;
      this.error = res.error;
      this.cargando = false;
      this.coordenadasFiltradas.emit(res.coords);
      this.cdr.markForCheck();
    });
  }

  ngOnInit() { void this.obtenerCategoriasConEtiquetas(); this.aplicarFiltrado(); }
  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  async obtenerCategoriasConEtiquetas() {
    this.cargandoCategorias = true;
    this.errorCategorias = '';
    try {
      const res = await firstValueFrom(this.etiquetasService.obtenerCategoriasConEtiquetas());
      if (res && res.codigoEstatus !== 1) throw new Error(res.mensaje);
      this.categoriasConEtiquetas = res?.cuerpoDeRespuesta ?? [];
    } catch {
      this.errorCategorias = 'No pudimos cargar los filtros.';
    } finally { this.cargandoCategorias = false; this.cdr.markForCheck(); }
  }

  alternarEtiqueta(id: number) {
    this.fldEtiquetCsv = this.estaSeleccionada(id) ? this.fldEtiquetCsv.filter((actual) => actual !== id) : [...this.fldEtiquetCsv, id];
    this.aplicarFiltrado();
  }
  alternarBusquedaEstricta() { this.esBusquedaEstricta = !this.esBusquedaEstricta; this.aplicarFiltrado(); }
  aplicarFiltrado() { this.consultas$.next(); }
  limpiarFiltros() { this.fldEtiquetCsv = []; this.esBusquedaEstricta = false; this.aplicarFiltrado(); }
  estaSeleccionada(id: number) { return this.fldEtiquetCsv.includes(id); }
  alternarPanel() { this.panelOculto = !this.panelOculto; this.panelCambio.emit(this.panelOculto); }
}
