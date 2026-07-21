import {
  Component,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  signal,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import {
  GoogleMapsLinkExtractorDirective,
  GoogleMapsCoords,
} from '../../../utils/google-maps-link-extractor.directive';
import { EstablecimientosService } from '../../../services/establecimientos.service';

// Declaración para TypeScript (cargado via <script> en index.html)
declare const google: any;

/**
 * Marcador que el componente sabe pintar en el mapa.
 *
 * Nota: `lat`/`lng` son `number` ya parseado. La conversión desde el
 * string del DTO del backend (fldCoordLatitud / fldCoordLongitud) la
 * hace el padre o el servicio que llama al componente. Esto evita el
 * `parseFloat` repetido que v1 hacía en cada variante de mapa.
 */
export interface EstablecimientoMarker {
  id: number;
  nombre: string;
  lat: number;
  lng: number;
  imagen?: string;
  direccion?: string;
}

/**
 * Coordenadas para el modo selección (form).
 * String porque el DTO del backend las recibe/expe como string.
 */
export interface Coords {
  lat: string;
  lng: string;
}

type ModoMapa = 'ver' | 'seleccionar';

/**
 * Componente UNIFICADO de mapa que reemplaza a las 5 variantes de v1:
 *  - cliente/mapa             → [establecimientos]
 *  - cliente/mapa-con-filtro  → padre externo + [establecimientos] (filtrado)
 *  - cliente/mapa-filtrado    → [establecimientos] (ya filtrado)
 *  - cliente/mapa-idEstablecimiento → [establecimientoId] (resuelve vía servicio)
 *  - shared/mapa-establecimiento (base v1) → modo='seleccionar' + [coords]
 *
 * Mutuamente excluyentes: `establecimientos`, `establecimientoId` y
 * `modo === 'seleccionar' + coords`. Ver {@link validateMode}.
 *
 * ssr-safe: en cualquier plataforma que no sea browser no toca Google Maps.
 */
@Component({
  selector: 'app-mapa-establecimiento',
  standalone: true,
  imports: [CommonModule, FormsModule, GoogleMapsLinkExtractorDirective],
  templateUrl: './mapa-establecimiento.component.html',
  styleUrls: ['./mapa-establecimiento.component.css'],
})
export class MapaEstablecimientoComponent
  implements AfterViewInit, OnDestroy, OnChanges
{
  // === Inyección ===
  private readonly platformId = inject(PLATFORM_ID);
  /**
   * Servicio para resolver un establecimiento por id (modo single / híbrido).
   * `optional: true` permite que el componente se instantiate sin el
   * servicio (tests, o mientras el esqueleto aún no lo provee). En modo
   * single sin servicio disponible se emite error vía {@link error}.
   */
  private readonly establecimientosService = inject(EstablecimientosService, {
    optional: true,
  });

  // === ViewChild ===
  @ViewChild('mapContainer') mapContainerRef?: ElementRef<HTMLDivElement>;

  // === DATA INPUTS (mutuamente excluyentes) ===
  @Input() establecimientos?: EstablecimientoMarker[] | null;
  @Input() establecimientoId: number | null = null;
  @Input() coords: Coords | null = null;

  // === Comportamiento ===
  @Input() modo: ModoMapa = 'ver';
  @Input() disabled = false;

  // === Visual ===
  @Input() center: { lat: number; lng: number } = { lat: 16.75, lng: -93.1167 };
  @Input() zoom = 13;
  @Input() mapId = '4504f8b37365c3d0';
  @Input() height = '400px';
  @Input() infoWindow = true;
  @Input() showLinkInput = false;

  // === OUTPUTS ===
  @Output() markerClick = new EventEmitter<EstablecimientoMarker>();
  @Output() coordsChange = new EventEmitter<Coords>();
  @Output() ready = new EventEmitter<void>();
  @Output() error = new EventEmitter<string>();
  @Output() success = new EventEmitter<string>();

  // === Signals internos ===
  readonly map = signal<any | null>(null);
  readonly markers = signal<any[]>([]);
  readonly infoWindows = signal<any[]>([]);
  readonly singleMarker = signal<any | null>(null);
  readonly isMapReady = signal(false);
  readonly isLoading = signal(false);

  // === Estado UI del extractor de enlace (modo selección) ===
  readonly googleMapsLink = signal('');
  readonly coordExtractionError = signal('');

  // === Privados ===
  private singleSubscription?: Subscription;
  private destroyed = false;

  // ---------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.validateMode();
    if (!this.isMapReady()) return;

    if (changes['establecimientos'] && this.establecimientos) {
      this.renderLista(this.establecimientos);
    }
    if (changes['establecimientoId'] && this.establecimientoId != null) {
      this.renderSingle(this.establecimientoId);
    }
    if (changes['coords'] && this.modo === 'seleccionar') {
      this.renderSeleccion(this.coords);
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.cleanupMap();
  }

  // ---------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------

  private async initMap(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    if (typeof google === 'undefined' || !google.maps) {
      console.warn(
        '[MapaEstablecimiento] Google Maps no está disponible (posible SSR sin API key)'
      );
      return;
    }
    const host = this.mapContainerRef?.nativeElement;
    if (!host) return;

    try {
      await google.maps.importLibrary('maps');
      const opts = {
        center: this.center,
        zoom: this.zoom,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapId: this.mapId,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      };
      this.map.set(new google.maps.Map(host, opts));
      this.isMapReady.set(true);
      this.ready.emit();

      // Primera renderización según inputs que vengan seteados.
      if (this.modo === 'seleccionar' && this.coords) {
        this.renderSeleccion(this.coords);
      } else if (this.establecimientos?.length) {
        this.renderLista(this.establecimientos);
      } else if (this.establecimientoId != null) {
        this.renderSingle(this.establecimientoId);
      }
    } catch (err) {
      console.error('[MapaEstablecimiento] Error al inicializar mapa:', err);
      this.error.emit('Error al inicializar el mapa');
    }
  }

  // ---------------------------------------------------------------
  // Modo lista
  // ---------------------------------------------------------------

  private async renderLista(
    list: EstablecimientoMarker[] | null | undefined
  ): Promise<void> {
    if (this.destroyed) return;
    const googleMap = this.map();
    if (!googleMap) return;

    this.clearMarkers();

    const safe = list ?? [];
    if (safe.length === 0) {
      googleMap.setCenter(this.center);
      googleMap.setZoom(this.zoom);
      return;
    }

    try {
      await google.maps.importLibrary('marker');
      const { AdvancedMarkerElement, PinElement } = google.maps.marker;

      const bounds = new google.maps.LatLngBounds();
      const newMarkers: any[] = [];
      const newInfoWindows: any[] = [];

      for (const est of safe) {
        if (!Number.isFinite(est.lat) || !Number.isFinite(est.lng)) continue;

        const pin = new PinElement({
          background: 'rgb(255, 51, 51)',
          glyphColor: 'white',
          borderColor: 'rgb(255, 51, 51)',
          scale: 1.5,
        });
        const marker = new AdvancedMarkerElement({
          map: googleMap,
          position: { lat: est.lat, lng: est.lng },
          content: pin.element,
          title: est.nombre,
        });

        if (this.infoWindow) {
          const infoWindow = new google.maps.InfoWindow({
            content: this.buildInfoWindowHtml(est),
          });
          marker.addListener('click', () => {
            infoWindow.open(googleMap, marker);
            this.triggerMarkerClick(est);
          });
          newInfoWindows.push(infoWindow);
        } else {
          marker.addListener('click', () => this.triggerMarkerClick(est));
        }

        newMarkers.push(marker);
        bounds.extend({ lat: est.lat, lng: est.lng });
      }

      this.markers.set(newMarkers);
      this.infoWindows.set(newInfoWindows);

      googleMap.fitBounds(bounds);
    } catch (err) {
      console.error('[MapaEstablecimiento] renderLista error:', err);
      this.error.emit('Error al renderizar marcadores');
    }
  }

  // ---------------------------------------------------------------
  // Modo single (resolver por id)
  // ---------------------------------------------------------------

  private renderSingle(id: number): void {
    if (this.destroyed) return;
    if (!this.establecimientosService) {
      this.error.emit('EstablecimientosService no disponible para resolver el id');
      console.warn('[MapaEstablecimiento] establecimientosService no inyectado');
      return;
    }
    const googleMap = this.map();
    if (!googleMap) return;

    this.clearMarkers();
    this.singleSubscription?.unsubscribe();
    this.isLoading.set(true);

    this.singleSubscription = this.establecimientosService
      .obtenerIdPorEstablecimiento(id)
      .subscribe({
        next: (res: any) => {
          const est = res?.cuerpoDeRespuesta;
          if (!est) {
            this.error.emit('Respuesta vacía del servicio');
            return;
          }
          const lat = parseFloat(est.fldCoordLatitud);
          const lng = parseFloat(est.fldCoordLongitud);
          if (Number.isNaN(lat) || Number.isNaN(lng)) {
            this.error.emit('El establecimiento no tiene coordenadas válidas.');
            return;
          }
          const marker: EstablecimientoMarker = {
            id,
            nombre: est.fldNombre ?? '',
            lat,
            lng,
            imagen: est.fldImgRefs,
            direccion: est.fldDireccion,
          };
          this.dropSingleMarker(marker, /*centerWithBounds*/ true);
        },
        error: (err: any) => {
          console.error('[MapaEstablecimiento] renderSingle error:', err);
          this.error.emit('Error al obtener el establecimiento por id');
        },
      });
  }

  // ---------------------------------------------------------------
  // Modo selección (form)
  // ---------------------------------------------------------------

  private async renderSeleccion(coords: Coords | null): Promise<void> {
    if (this.destroyed) return;
    const googleMap = this.map();
    if (!googleMap || !coords) return;

    const lat = parseFloat(coords.lat);
    const lng = parseFloat(coords.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    const marker: EstablecimientoMarker = {
      id: 0,
      nombre: 'Establecimiento',
      lat,
      lng,
    };
    this.dropSingleMarker(marker, false, /*draggable*/ true);
  }

  // ---------------------------------------------------------------
  // Helpers de marker único
  // ---------------------------------------------------------------

  private async dropSingleMarker(
    marker: EstablecimientoMarker,
    centerWithBounds: boolean,
    draggable = false
  ): Promise<void> {
    if (this.destroyed) return;
    const googleMap = this.map();
    if (!googleMap) return;

    try {
      this.clearMarkers();
      await google.maps.importLibrary('marker');
      const { AdvancedMarkerElement, PinElement } = google.maps.marker;

      const pin = new PinElement({
        background: 'rgb(255, 51, 51)',
        glyphColor: 'white',
        borderColor: 'rgb(255, 51, 51)',
        scale: 1.5,
      });
      const gMarker = new AdvancedMarkerElement({
        map: googleMap,
        position: { lat: marker.lat, lng: marker.lng },
        content: pin.element,
        title: marker.nombre,
        gmpDraggable: draggable,
      });

      if (this.infoWindow) {
        const infoWindow = new google.maps.InfoWindow({
          content: this.buildInfoWindowHtml(marker),
        });
        gMarker.addListener('click', () => {
          infoWindow.open(googleMap, gMarker);
          this.triggerMarkerClick(marker);
        });
        this.infoWindows.set([infoWindow]);
      } else {
        gMarker.addListener('click', () => this.triggerMarkerClick(marker));
      }

      if (draggable) {
        gMarker.addListener('dragend', (event: any) => {
          const position = event?.latLng;
          if (!position) return;
          const newCoords: Coords = {
            lat: position.lat().toString(),
            lng: position.lng().toString(),
          };
          this.coordsChange.emit(newCoords);
        });
      }

      this.singleMarker.set(gMarker);

      if (centerWithBounds) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: marker.lat, lng: marker.lng });
        googleMap.fitBounds(bounds);
        googleMap.setZoom(16);
      } else {
        googleMap.setCenter({ lat: marker.lat, lng: marker.lng });
        googleMap.setZoom(15);
      }
    } catch (err) {
      console.error('[MapaEstablecimiento] dropSingleMarker error:', err);
      this.error.emit('Error al crear el marcador');
    }
    this.isLoading.set(false);
  }

  // ---------------------------------------------------------------
  // InfoWindow HTML
  // ---------------------------------------------------------------

  private buildInfoWindowHtml(est: EstablecimientoMarker): string {
    const img = est.imagen
      ? `<img src="${est.imagen}" alt="${this.escapeHtml(est.nombre)}" style="width:100px;height:100px;object-fit:cover;border-radius:8px;"><br>`
      : '';
    return `<div style="font-family: Arial; font-size: 14px;">
      ${img}
      <strong>${this.escapeHtml(est.nombre)}</strong><br>
      ${this.escapeHtml(est.direccion ?? '')}
    </div>`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ---------------------------------------------------------------
  // Handlers públicos del extractor de enlace (modo selección)
  // ---------------------------------------------------------------

  /**
   * Dispara manualmente {@link markerClick}. Útil tanto para tests
   * (no requieren Google Maps) como para que un padre pueda emular un
   * click programáticamente si lo necesita.
   */
  triggerMarkerClick(est: EstablecimientoMarker): void {
    this.markerClick.emit(est);
  }

  onGoogleMapsLinkChange(value: string): void {
    this.googleMapsLink.set(value);
    if (value) this.coordExtractionError.set('');
  }

  async onCoordsExtracted(coords: GoogleMapsCoords): Promise<void> {
    this.coordsChange.emit(coords);
    this.googleMapsLink.set('');
    await this.renderSeleccion(coords);
    this.success.emit(`Coordenadas extraídas: ${coords.lat}, ${coords.lng}`);
  }

  onCoordError(msg: string): void {
    this.coordExtractionError.set(msg);
    this.error.emit(msg);
  }

  onCoordSuccess(msg: string): void {
    this.success.emit(msg);
  }

  // ---------------------------------------------------------------
  // Validaciones de modo
  // ---------------------------------------------------------------

  private validateMode(): void {
    if (this.establecimientos?.length && this.establecimientoId != null) {
      this.error.emit(
        'No se puede pasar establecimientos y establecimientoId a la vez'
      );
      return;
    }
    if (this.modo === 'seleccionar' && this.establecimientos?.length) {
      console.warn(
        '[MapaEstablecimiento] modo=seleccionar con establecimientos: ignorando establecimientos'
      );
      this.establecimientos = null;
    }
  }

  // ---------------------------------------------------------------
  // Limpieza
  // ---------------------------------------------------------------

  private clearMarkers(): void {
    for (const m of this.markers()) m.map = null;
    this.markers.set([]);
    for (const w of this.infoWindows()) {
      try {
        w.close();
      } catch {}
    }
    this.infoWindows.set([]);

    const sm = this.singleMarker();
    if (sm) {
      sm.map = null;
      this.singleMarker.set(null);
    }
  }

  private cleanupMap(): void {
    this.clearMarkers();
    this.singleSubscription?.unsubscribe();
    const m = this.map();
    if (m) {
      try {
        google.maps.event.clearInstanceListeners(m);
      } catch {}
    }
    this.map.set(null);
    this.isMapReady.set(false);
  }

  // ---------------------------------------------------------------
  // Util pública (para padres que quieran forzar resize)
  // ---------------------------------------------------------------

  resizeMap(): void {
    const m = this.map();
    if (m) {
      google.maps.event.trigger(m, 'resize');
    }
  }
}