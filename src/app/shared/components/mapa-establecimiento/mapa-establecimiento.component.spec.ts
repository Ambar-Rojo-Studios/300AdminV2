import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';

import {
  MapaEstablecimientoComponent,
  EstablecimientoMarker,
} from './mapa-establecimiento.component';

/**
 * Spec básico del componente unificado de mapa (Fase 1).
 *
 * No invoca Google Maps real (el navegador en headless no tiene `google`
 * cargado, y el componente hace early-return en ese caso). Solo verifica:
 *  - creación del componente.
 *  - render del contenedor del mapa (`.map-container-inner`).
 *  - lectura del input `establecimientos`.
 *  - emisión correcta de `markerClick` vía `triggerMarkerClick`.
 *
 * Los tests de integración con Google Maps real (modo lista, modo single,
 * modo selección con drag) quedan para verificación manual o E2E.
 */
describe('MapaEstablecimientoComponent', () => {
  let component: MapaEstablecimientoComponent;
  let fixture: ComponentFixture<MapaEstablecimientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapaEstablecimientoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MapaEstablecimientoComponent);
    component = fixture.componentInstance;
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debe renderizar el contenedor del mapa (.map-container-inner)', () => {
    fixture.detectChanges();
    const mapDiv = fixture.nativeElement.querySelector(
      '.map-container-inner'
    ) as HTMLDivElement | null;
    expect(mapDiv).not.toBeNull();
    expect(mapDiv?.tagName).toBe('DIV');
  });

  it('debe leer el input `establecimientos` con valores ya parseados', () => {
    const sample: EstablecimientoMarker[] = [
      { id: 1, nombre: 'Restaurante A', lat: 16.75, lng: -93.11, direccion: 'Calle 1' },
      { id: 2, nombre: 'Café B', lat: 16.76, lng: -93.12, imagen: 'https://x/y.jpg' },
    ];
    component.establecimientos = sample;
    expect(component.establecimientos).toBe(sample);
    expect(component.establecimientos?.length).toBe(2);
    expect(component.establecimientos?.[0].lat).toBe(16.75);
    expect(typeof component.establecimientos?.[0].lat).toBe('number');
  });

  it('triggerMarkerClick emite markerClick con el establecimiento recibido', () => {
    const est: EstablecimientoMarker = {
      id: 7,
      nombre: 'Test',
      lat: 16.75,
      lng: -93.11,
      direccion: 'X',
    };
    let received: EstablecimientoMarker | undefined;
    const sub = component.markerClick.subscribe((e) => (received = e));

    component.triggerMarkerClick(est);

    expect(received).toEqual(est);
    sub.unsubscribe();
  });
});