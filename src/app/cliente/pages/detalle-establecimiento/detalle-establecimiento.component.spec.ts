import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, RouterLink } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { DetalleEstablecimientoComponent } from './detalle-establecimiento.component';

describe('Navegación entre establecimientos', () => {
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let http: HttpTestingController;
  beforeEach(() => {
    params = new BehaviorSubject(convertToParamMap({ id: '1' }));
    TestBed.configureTestingModule({ imports: [DetalleEstablecimientoComponent], providers: [
      provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
      { provide: ActivatedRoute, useValue: { paramMap: params.asObservable() } }
    ] }).overrideComponent(DetalleEstablecimientoComponent, {
      set: { imports: [CommonModule, RouterLink], schemas: [NO_ERRORS_SCHEMA] }
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('cancela la carga anterior y muestra los datos del ID nuevo, con galería y menú', () => {
    const fixture = TestBed.createComponent(DetalleEstablecimientoComponent);
    fixture.detectChanges();
    const primera = http.expectOne(req => req.params.get('id') === '1');
    params.next(convertToParamMap({ id: '2' }));
    expect(primera.cancelled).toBeTrue();
    http.expectOne(req => req.params.get('id') === '2').flush({ codigoEstatus: 1, cuerpoDeRespuesta: {
      idEstablecimiento: 2, fldNombre: 'Lugar nuevo', fldDireccion: 'Calle 2', fldCiudad: 'Tuxtla',
      fldCoordLatitud: '16.75', fldCoordLongitud: '-93.11',
      imagenesPerfil: ['https://example.test/1.jpg', 'https://example.test/2.jpg'],
      imagenesMenu: ['https://example.test/menu.jpg'], fldLunes: true
    }});
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Lugar nuevo');
    expect(fixture.nativeElement.querySelectorAll('.detalle__miniaturas button').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Abrir menú');
    expect(fixture.componentInstance.enlaceMaps()).toContain('16.75%2C-93.11');
    const menu = fixture.nativeElement.querySelector('#menu-lugar') as HTMLElement;
    const scroll = spyOn(menu, 'scrollIntoView');
    const menuButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(button => button.textContent?.trim() === 'Ver menú')!;
    menuButton.click();
    expect(scroll).toHaveBeenCalled(); expect(document.activeElement).toBe(menu);
    params.next(convertToParamMap({ id: '3' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Lugar nuevo');
    http.expectOne(req => req.params.get('id') === '3').flush(null, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No encontramos este establecimiento');
    fixture.destroy();
  });

  it('rechaza IDs inválidos sin consultar el servidor', () => {
    params.next(convertToParamMap({ id: 'abc' }));
    const fixture = TestBed.createComponent(DetalleEstablecimientoComponent); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('no es válido');
    http.expectNone(() => true); fixture.destroy();
  });
});
