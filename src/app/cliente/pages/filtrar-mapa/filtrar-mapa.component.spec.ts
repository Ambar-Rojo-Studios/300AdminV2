import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FilterMapComponent } from './filtrar-mapa.component';

describe('Filtro del mapa público', () => {
  it('carga categorías públicas, filtra con los nombres legacy de coordenadas y restaura lugares al limpiar', () => {
    TestBed.configureTestingModule({ imports: [FilterMapComponent], providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(FilterMapComponent);
    const component = fixture.componentInstance;
    const emitido = jasmine.createSpy(); component.coordenadasFiltradas.subscribe(emitido);
    fixture.detectChanges();
    http.expectOne('/api/etiquetasPublic/list-movileapp').flush({ codigoEstatus: 1, cuerpoDeRespuesta: [] });
    http.expectOne(req => req.url === '/api/establecimientosPublic/list').flush({ codigoEstatus: 1, cuerpoDeRespuesta: [] });
    component.alternarEtiqueta(3);
    const filtro = http.expectOne(req => req.url === '/api/establecimientosPublic/filter-list');
    expect(filtro.request.params.get('fldEtiquetCsv')).toBe('3');
    filtro.flush({ codigoEstatus: 1, cuerpoDeRespuesta: [{ idEstablecimiento: 1, fldNombre: 'Lugar', fldCoorLatitud: '16.75', fldCoodLongitud: '-93.11' }] });
    expect(emitido).toHaveBeenCalledWith([jasmine.objectContaining({ id: 1, lat: 16.75, lng: -93.11 })]);
    component.limpiarFiltros();
    http.expectOne(req => req.url === '/api/establecimientosPublic/list').flush(null);
    expect(component.total).toBe(0); expect(component.error).toBe('');
    http.verify(); fixture.destroy();
  });
});
