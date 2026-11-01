import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { FiltroBusquedaComponent } from './filtro-busqueda.component';
import { authInterceptorFn } from '../../../auth/interceptors/auth.interceptor';
import { apiBaseInterceptorFn } from '../../../core/interceptors/api-base.interceptor';
import { AuthService } from '../../../auth/services/auth.service';

const respuesta = (data: unknown[]) => ({ codigoEstatus: 1, mensaje: '', cuerpoDeRespuesta: data });

describe('Búsqueda pública', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [FiltroBusquedaComponent], providers: [
      provideRouter([]), provideHttpClient(withInterceptors([authInterceptorFn, apiBaseInterceptorFn])), provideHttpClientTesting(),
      { provide: AuthService, useValue: { obtenerToken: () => 'token-vencido', cerrarSesion: jasmine.createSpy() } }
    ] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('consulta el endpoint público sin JWT y cancela la consulta anterior al cambiar el texto', fakeAsync(() => {
    const fixture = TestBed.createComponent(FiltroBusquedaComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.onSearchChange('cafe'); tick(300);
    const anterior = http.expectOne(req => req.url.endsWith('/api/establecimientosPublic/list'));
    expect(anterior.request.params.get('fldNombre')).toBe('cafe');
    expect(anterior.request.headers.has('Authorization')).toBeFalse();
    component.onSearchChange('restaurante');
    expect(anterior.cancelled).toBeTrue();
    tick(300);
    http.expectOne(req => req.params.get('fldNombre') === 'restaurante').flush(respuesta([]));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No encontramos lugares');
    fixture.destroy();
  }));

  it('permite reintentar tras un error y elegir una sugerencia con teclado', fakeAsync(() => {
    const fixture = TestBed.createComponent(FiltroBusquedaComponent);
    const component = fixture.componentInstance;
    const seleccionado = jasmine.createSpy('seleccionado');
    component.establecimientoSeleccionado.subscribe(seleccionado);
    fixture.detectChanges();
    component.onSearchChange('cafe'); tick(300);
    http.expectOne(req => req.params.get('fldNombre') === 'cafe').flush('', { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Reintentar');
    fixture.nativeElement.querySelector('button').click(); tick(300);
    http.expectOne(req => req.params.get('fldNombre') === 'cafe').flush(respuesta([{ idEstablecimiento: 7, fldNombre: 'Café' }]));
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(input.getAttribute('aria-activedescendant')).toBe('busqueda-header-opcion-0');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(seleccionado).toHaveBeenCalledWith(jasmine.objectContaining({ idEstablecimiento: 7 }));
    fixture.destroy();
  }));
});
