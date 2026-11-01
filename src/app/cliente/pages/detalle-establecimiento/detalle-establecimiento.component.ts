import { Component, OnInit, inject, signal, computed, PLATFORM_ID, TransferState, makeStateKey, DestroyRef } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformServer } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, distinctUntilChanged, map, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { MapaEstablecimientoComponent, EstablecimientoMarker } from '../../../shared/components/mapa-establecimiento';
import { EtiquetasListadoPublicComponent } from '../../components/etiquetas-listado-public/etiquetas-listado-public.component';
import { ComentariosClienteComponent } from '../../components/comentarios-cliente/comentarios-cliente.component';
import { EstablecimientosPublicService } from '../../../services/establecimientos-public.service';
import { idEstablecimiento } from '../../../models/establecimiento.model';

@Component({
  selector: 'app-detalle-establecimiento', standalone: true,
  imports: [CommonModule, RouterLink, MapaEstablecimientoComponent, EtiquetasListadoPublicComponent, ComentariosClienteComponent],
  templateUrl: './detalle-establecimiento.component.html', styleUrls: ['./detalle-establecimiento.component.css'],
})
export class DetalleEstablecimientoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(EstablecimientosPublicService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transferState = inject(TransferState);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly retry$ = new Subject<void>();
  readonly establecimiento = signal<idEstablecimiento | null>(null);
  readonly establecimientoId = signal<number | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly imagenActual = signal(0);
  readonly mensajeCompartir = signal('');
  readonly enlaceCompartir = signal('');

  readonly imagenes = computed(() => {
    const est = this.establecimiento();
    if (!est) return [];
    const imagenes = est.imagenesPerfil?.length ? est.imagenesPerfil : [est.fldImgRefs, est.fldImgRefs2, est.fldImgRefs3, est.fldImgRefs4];
    return [...new Set(imagenes.filter((url): url is string => !!url))];
  });
  readonly menus = computed(() => {
    const est = this.establecimiento();
    const menus = est?.imagenesMenu?.length ? est.imagenesMenu : [est?.fldMenu];
    return menus.filter((url): url is string => !!url && /^https?:\/\//i.test(url));
  });
  readonly markers = computed<EstablecimientoMarker[]>(() => {
    const est = this.establecimiento();
    if (!est) return [];
    const lat = parseFloat(est.fldCoordLatitud);
    const lng = parseFloat(est.fldCoordLongitud);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return [];
    return [{ id: est.idEstablecimiento, nombre: est.fldNombre, lat, lng, direccion: est.fldDireccion }];
  });
  readonly direccion = computed(() => {
    const est = this.establecimiento();
    return [est?.fldDireccion, est?.fldCiudad, est?.fldEstado].filter(Boolean).join(', ');
  });
  readonly enlaceMaps = computed(() => {
    const marker = this.markers()[0];
    const destino = marker ? `${marker.lat},${marker.lng}` : this.direccion();
    return destino ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}` : null;
  });
  readonly diasSemana: Array<[string, keyof idEstablecimiento]> = [
    ['Lunes', 'fldLunes'], ['Martes', 'fldMartes'], ['Miércoles', 'fldMiercoles'],
    ['Jueves', 'fldJueves'], ['Viernes', 'fldViernes'], ['Sábado', 'fldSabado'], ['Domingo', 'fldDomingo'],
  ];

  ngOnInit() {
    combineLatest([
      this.route.paramMap.pipe(map(params => Number(params.get('id'))), distinctUntilChanged()),
      this.retry$.pipe(startWith(undefined))
    ]).pipe(
      tap(([id]) => {
        this.establecimientoId.set(id);
        this.cargando.set(true); this.error.set(null); this.establecimiento.set(null);
        this.imagenActual.set(0); this.mensajeCompartir.set(''); this.enlaceCompartir.set('');
      }),
      switchMap(([id]) => {
        if (!Number.isInteger(id) || id <= 0) return of({ est: null, error: 'Este enlace de establecimiento no es válido.' });
        const key = makeStateKey<idEstablecimiento>(`detalle-${id}`);
        const cached = this.transferState.get(key, null);
        this.transferState.remove(key);
        if (cached) return of({ est: cached, error: null });
        return this.service.obtenerEstablecimientoPorId(id).pipe(
          map(res => {
            const est = res?.codigoEstatus === 1 ? res.cuerpoDeRespuesta : null;
            if (est && isPlatformServer(this.platformId)) this.transferState.set(key, est);
            return { est, error: est ? null : 'No encontramos este establecimiento.' };
          }),
          catchError((err) => of({ est: null, error: err.status === 404 ? 'No encontramos este establecimiento.' : 'No pudimos cargar el establecimiento. Intenta de nuevo.' }))
        );
      }), takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ est, error }) => {
      this.establecimiento.set(est); this.error.set(error); this.cargando.set(false);
      this.titleService.setTitle(est ? `${est.fldNombre} — 300 Lugares` : 'Establecimiento no disponible — 300 Lugares');
      this.metaService.updateTag({ name: 'description', content: est?.fldDescripcion?.slice(0, 160) || 'Descubre lugares en 300 Lugares.' });
    });
  }

  reintentar() { this.retry$.next(); }

  verMenu(): void {
    const menu = this.document.getElementById('menu-lugar');
    menu?.scrollIntoView({ block: 'start' });
    menu?.focus({ preventScroll: true });
  }

  async compartir() {
    const est = this.establecimiento();
    const win = this.document.defaultView;
    if (!est || !win) return;
    const url = new URL(`/detalleEstablecimiento/${est.idEstablecimiento}`, win.location.origin).href;
    try {
      if (win.navigator.share) {
        await win.navigator.share({ title: est.fldNombre, url });
      } else if (win.navigator.clipboard?.writeText) {
        await win.navigator.clipboard.writeText(url);
        this.mensajeCompartir.set('Enlace copiado.');
      } else {
        this.enlaceCompartir.set(url);
      }
    } catch (err) {
      if (!(err instanceof Error && err.name === 'AbortError')) this.enlaceCompartir.set(url);
    }
  }
}
