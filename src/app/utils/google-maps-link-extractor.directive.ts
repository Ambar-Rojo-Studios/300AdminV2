import { Directive, Input, Output, EventEmitter, HostListener, signal } from '@angular/core';

/**
 * Interfaz para las coordenadas extraídas
 */

export interface GoogleMapsCoords {
  lat: string;
  lng: string;
}

/**
 * Directive que extrae coordenadas de enlaces de Google Maps.
 * Emite las coordenadas o errores al componente padre.
 */

@Directive({
  selector: '[appGoogleMapsLinkExtractor]',
  standalone: true
})

export class GoogleMapsLinkExtractorDirective {
  
  /** Enlace de Google Maps a procesar */
  @Input() googleMapsLink: string = '';
  
  /** Deshabilitar el botón */
  @Input() disabled: boolean = false;
  
  /** Emite cuando se extraen coordenadas exitosamente */
  @Output() coordsExtracted = new EventEmitter<GoogleMapsCoords>();
  
  /** Emite cuando hay un error */
  @Output() error = new EventEmitter<string>();
  
  /** Emite para mostrar mensajes de éxito */
  @Output() success = new EventEmitter<string>();

  /** Señal para estado de carga, usada para bloquear o mostrar un spinner. */
  isExtractingCoords = signal(false);

  /**
   * Procesa el enlace de Google Maps y extrae las coordenadas.
   * Se activa al hacer clic en el elemento que usa esta directiva.
   */
  @HostListener('click')
  async extractCoords(): Promise<void> {
    const link = this.googleMapsLink?.trim() || '';

    if (!link) {
      this.error.emit('Por favor ingresa un enlace válido de Google Maps.');
      return;
    }

    if (this.disabled) {
      return;
    }

    this.isExtractingCoords.set(true);
    this.error.emit('');

    try {
      // 1. Detectar si es un enlace corto, ya que estos enlaces no incluyen coordenadas visibles.
      if (link.includes('maps.app.goo.gl')) {
        this.error.emit('Los enlaces cortos no contienen coordenadas visibles. Por favor, usa un enlace largo (con el símbolo @) o ingresa las coordenadas manualmente.');
        return;
      }

      // 2. Patrón para extraer coordenadas del parámetro !3d...!4d... que suele ser más preciso.
      // Ejemplo: !3d16.7288636!4d-93.0982558
      const precisePattern = /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/;
      const preciseMatch = link.match(precisePattern);

      // 3. Patrón alternativo para extraer coordenadas después del @.
      // Ejemplo: @16.7292502,-93.0984919,19z
      const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
      const atMatch = link.match(atPattern);

      let lat = '';
      let lng = '';

      // Preferir el patrón !3d!4d que suele ser más preciso para el marcador
      if (preciseMatch) {
        lat = preciseMatch[1];
        lng = preciseMatch[2];
      } else if (atMatch) {
        lat = atMatch[1];
        lng = atMatch[2];
      }

      // 4. Validar que se encontraron coordenadas
      if (!lat || !lng) {
        this.error.emit('No se encontraron coordenadas en el enlace. Asegúrate de usar un enlace largo de Google Maps.');
        return;
      }

      // 5. Validación de rangos geográficos
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);

      if (isNaN(latNum) || isNaN(lngNum)) {
        this.error.emit('Las coordenadas extraídas no son válidas.');
        return;
      }

      if (latNum < -90 || latNum > 90) {
        this.error.emit('La latitud está fuera del rango válido (-90 a 90).');
        return;
      }

      if (lngNum < -180 || lngNum > 180) {
        this.error.emit('La longitud está fuera del rango válido (-180 a 180).');
        return;
      }

      // 6. Emisión exitosa
      this.coordsExtracted.emit({ lat, lng });
      this.success.emit(`Coordenadas extraídas: ${lat}, ${lng}`);

    } catch (error) {
      console.error('Error extrayendo coordenadas:', error);
      this.error.emit('Error al procesar el enlace.');
    } finally {
      this.isExtractingCoords.set(false);
    }
  }
}

