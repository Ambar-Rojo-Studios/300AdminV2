import { Component, AfterViewInit, ViewChild, ElementRef, Input, Output, EventEmitter, signal, PLATFORM_ID, inject, OnDestroy, OnChanges, SimpleChanges, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleMapsLinkExtractorDirective, GoogleMapsCoords } from '../../../utils/google-maps-link-extractor.directive';

// Declaración para TypeScript
declare const google: any;

/**
 * Interfaz para las coordenadas del establecimiento
 */
export interface MapaEstablecimientoCoords {
  lat: string;
  lng: string;
}

/**
 * Opciones de configuración del mapa
 */
export interface MapaOptions {
  center?: { lat: number; lng: number };
  zoom?: number;
  mapId?: string;
}

/**
 * Componente standalone para mostrar y gestionar el mapa de establecimientos.
 * Utiliza la API moderna de Google Maps con AdvancedMarkerElement y Signals.
 */
@Component({
  selector: 'app-mapa-establecimiento',
  standalone: true,
  imports: [CommonModule, FormsModule, GoogleMapsLinkExtractorDirective],
  templateUrl: './mapa-establecimiento.component.html',
  styleUrls: ['./mapa-establecimiento.component.css']
})
export class MapaEstablecimientoComponent implements  AfterViewInit, OnDestroy, OnChanges {
  
  // Inyección de dependencias
  private platformId = inject(PLATFORM_ID);

  // === VIEW CHILDREN ===
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  // === INPUTS ===
  /** Coordenadas iniciales del establecimiento */
  @Input() coords: MapaEstablecimientoCoords | null = null;
  
  /** Modo del mapa: 'crear' o 'editar' */
  @Input() modo: 'crear' | 'editar' = 'crear';
  
  /** Deshabilitar interacciones */
  @Input() disabled: boolean = false;

  // === OUTPUTS ===
  /** Emite cuando las coordenadas cambian */
  @Output() coordsChange = new EventEmitter<MapaEstablecimientoCoords>();
  
  /** Emite cuando hay un error */
  @Output() error = new EventEmitter<string>();
  
  /** Emite mensajes de éxito */
  @Output() success = new EventEmitter<string>();

  // === SEÑALES (SIGNALS) ===
  /** Mapa de Google Maps */
  map = signal<google.maps.Map | null>(null);
  
  /** Marcador en el mapa */
  marker = signal<any | null>(null);
  
  /** Enlace de Google Maps */
  googleMapsLink = signal<string>('');
  
  /** Error en la extracción de coordenadas */
  coordExtractionError = signal<string>('');
  
  /** Indica si el mapa está listo */
  isMapReady = signal(false);
  
  /** Indica si está cargando */
  isLoading = signal(false);

  // === CONFIGURACIÓN ===
  private readonly defaultCenter = { lat: 16.75, lng: -93.1167 }; // Chiapas
  private readonly defaultZoom = 12;
  private readonly mapId = '4504f8b37365c3d0';

  constructor() {
    // Mantiene el marcador sincronizado cuando cambian las coordenadas recibidas.
    effect(() => {
      const currentCoords = this.coords;
      if (currentCoords && this.isMapReady()) {
        this.updateMarkerFromCoords(currentCoords);
      }
    });
  }

  /** Inicializa el mapa una vez que la vista ya está disponible. */
  ngAfterViewInit(): Promise<void> {
    return this.initMap();
  }

  /** Actualiza la vista del mapa cuando las coordenadas externas cambian. */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['coords'] && !changes['coords'].firstChange) {
      if (this.coords && this.isMapReady()) {
        this.updateMarkerFromCoords(this.coords);
      }
    }
  }

  ngOnDestroy(): void {
    // Limpiar mapa y marcador al destruir el componente
    this.cleanupMap();
  }

  /**
   * Inicializa el mapa de Google Maps
   */
  private async initMap(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || typeof google === 'undefined' || !google.maps) {
      console.warn('Google Maps no está disponible');
      return;
    }

    try {
      await google.maps.importLibrary('maps');
      
      const mapOptions: google.maps.MapOptions = {
        center: this.defaultCenter,
        zoom: this.defaultZoom,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapId: this.mapId,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
      };

      if (this.mapContainer?.nativeElement) {
        this.map.set(new google.maps.Map(this.mapContainer.nativeElement, mapOptions));
        this.isMapReady.set(true);
        
        // Si hay coordenadas iniciales, mostrar marcador
        if (this.coords) {
          this.updateMarkerFromCoords(this.coords);
        }

        console.log('✅ [MapaEstablecimiento] Mapa inicializado');
      }
    } catch (error) {
      console.error('❌ [MapaEstablecimiento] Error al inicializar mapa:', error);
      this.error.emit('Error al inicializar el mapa');
    }
  }

  /**
   * Actualiza o crea el marcador en el mapa
   */
  private async createOrUpdateMarker(lat: number, lng: number): Promise<void> {
    if (typeof google === 'undefined' || !google.maps) return;

    const currentMap = this.map();
    if (!currentMap) return;

    try {
      await google.maps.importLibrary('marker');

      // Eliminar marcador existente
      if (this.marker()) {
        this.marker().map = null;
      }

      // Crear nuevo marcador avanzado
      const newMarker = new google.maps.marker.AdvancedMarkerElement({
        map: currentMap,
        position: { lat, lng },
        title: 'Establecimiento',
        gmpDraggable: true
      });

      // Hacer el marcador arrastrable
      newMarker.addListener('dragend', (event: any) => {
        const position = event.latLng;
        if (position) {
          const coords: MapaEstablecimientoCoords = {
            lat: position.lat().toString(),
            lng: position.lng().toString()
          };
          this.coordsChange.emit(coords);
          this.updateCoordsInput(coords);
        }
      });

      this.marker.set(newMarker);
      
      // Centrar el mapa en el marcador
      currentMap.setCenter({ lat, lng });
      currentMap.setZoom(15);

    } catch (error) {
      console.error('❌ [MapaEstablecimiento] Error al crear marcador:', error);
    }
  }

  /**
   * Actualiza el marcador desde las coordenadas
   */
  private updateMarkerFromCoords(coords: MapaEstablecimientoCoords | null): void {
    if (!coords || !this.isValidNumber(coords.lat) || !this.isValidNumber(coords.lng)) return;

    const lat = parseFloat(coords.lat);
    const lng = parseFloat(coords.lng);

    if (!isNaN(lat) && !isNaN(lng)) {
      this.createOrUpdateMarker(lat, lng);
    }
  }

  /**
   * Maneja el cambio en el enlace de Google Maps
   */
  onGoogleMapsLinkChange(value: string): void {
    this.googleMapsLink.set(value);
    if (value) {
      this.coordExtractionError.set('');
    }
  }

  /**
   * Maneja las coordenadas extraídas por el directive
   */
  async onCoordsExtracted(coords: GoogleMapsCoords): Promise<void> {
    const mappedCoords: MapaEstablecimientoCoords = {
      lat: coords.lat,
      lng: coords.lng
    };

    // Emitir coordenadas al padre
    this.coordsChange.emit(mappedCoords);
    
    // Actualizar input visual
    this.googleMapsLink.set('');
    this.updateCoordsInput(mappedCoords);
    
    // Actualizar marcador en el mapa
    await this.createOrUpdateMarker(parseFloat(coords.lat), parseFloat(coords.lng));
    
    this.success.emit(`Coordenadas extraídas: ${coords.lat}, ${coords.lng}`);
  }

  /**
   * Maneja errores del directive de extracción
   */
  onCoordError(errorMessage: string): void {
    this.coordExtractionError.set(errorMessage);
    this.error.emit(errorMessage);
  }

  /**
   * Maneja mensajes de éxito del directive
   */
  onCoordSuccess(message: string): void {
    this.success.emit(message);
  }

  /**
   * Actualiza los inputs de coordenadas
   */
  private updateCoordsInput(coords: MapaEstablecimientoCoords): void {
    // Actualizar directamente los elementos del DOM
    const latInput = document.getElementById('mapaCoordLat') as HTMLInputElement;
    const lngInput = document.getElementById('mapaCoordLng') as HTMLInputElement;
    
    if (latInput) latInput.value = coords.lat;
    if (lngInput) lngInput.value = coords.lng;
  }

  /**
   * Valida si un valor es un número válido
   */
  private isValidNumber(value: string | null | undefined): boolean {
    if (value === null || typeof value === 'undefined' || value.trim() === '') return false;
    const regex = /^-?\d*\.?\d+$/;
    return regex.test(value);
  }

  /**
   * Limpia el mapa y marcador al destruir el componente
   */
  private cleanupMap(): void {
    if (this.marker()) {
      this.marker().map = null;
    }
    this.marker.set(null);
    this.map.set(null);
    this.isMapReady.set(false);
  }

  /**
   * Fuerza el redimensionamiento del mapa
   */
  resizeMap(): void {
    const currentMap = this.map();
    if (currentMap) {
      google.maps.event.trigger(currentMap, 'resize');
    }
  }
}

