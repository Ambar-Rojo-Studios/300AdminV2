import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CanjesService } from '../../../services/canjes.service';
import { CanjesComponent } from './canjes.component';

describe('CanjesComponent', () => {
  const establecimiento = {
    idEstablecimiento: 8, nombreEstablecimiento: 'Lugar de prueba', hoy: 1, semana: 1, mes: 1, total: 1,
  };

  function setup(listarDetalle = jasmine.createSpy().and.returnValue(of({
    codigoEstatus: 1, cuerpoDeRespuesta: { filas: [], pagina: 0, tamano: 20, total: 0 },
  }))) {
    const listarResumen = jasmine.createSpy().and.returnValue(of({ codigoEstatus: 1, cuerpoDeRespuesta: [establecimiento] }));
    TestBed.configureTestingModule({ imports: [CanjesComponent], providers: [{
      provide: CanjesService, useValue: { listarResumen, listarDetalle },
    }] });
    const fixture = TestBed.createComponent(CanjesComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, listarDetalle };
  }

  it('carga el resumen y permite abrir el detalle vacío', () => {
    const { component, listarDetalle } = setup();
    component.abrirDetalle(establecimiento);
    expect(component.detalleCargando()).toBeFalse();
    expect(component.detalleFilas()).toEqual([]);
    expect(component.detalleTotal()).toBe(0);
    expect(listarDetalle).toHaveBeenCalledWith(8, jasmine.objectContaining({ pagina: 0, tamano: 20 }));
  });

  it('muestra error y permite reintentar el detalle', () => {
    const listarDetalle = jasmine.createSpy().and.returnValues(
      throwError(() => new Error('offline')),
      of({ codigoEstatus: 1, cuerpoDeRespuesta: { filas: [], pagina: 0, tamano: 20, total: 0 } }),
    );
    const { component } = setup(listarDetalle);
    component.abrirDetalle(establecimiento);
    expect(component.detalleError()).toContain('No se pudieron cargar');
    component.cargarDetalle();
    expect(component.detalleError()).toBe('');
  });

  it('cambia el rango y solicita la primera página', () => {
    const { component, listarDetalle } = setup();
    component.abrirDetalle(establecimiento);
    component.aplicarRango('hoy');
    expect(component.desde()).toBe(component.hasta());
    expect(listarDetalle).toHaveBeenCalledTimes(2);
    expect(listarDetalle.calls.mostRecent().args[1].pagina).toBe(0);
  });
});
