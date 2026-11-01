import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { BotaneroService } from '../../../services/botanero.service';
import { EstablecimientoDetalleComponent } from './establecimiento-detalle.component';
import { BotaneroEstablecimientoDTO } from '../../../models/botanero.model';
import { getEmptyEstablecimientoFormValue } from '../../../shared/models/establecimiento-form.model';

describe('Panel del botanero', () => {
  it('carga los últimos canjes vacíos y cambia el rango desde el servidor', () => {
    const params = new BehaviorSubject(convertToParamMap({ id: '5' }));
    const obtenerCanjes = jasmine.createSpy().and.returnValue(of({
      codigoEstatus: 1, mensaje: 'ok', cuerpoDeRespuesta: { filas: [], pagina: 0, tamano: 20, total: 0 },
    }));
    TestBed.configureTestingModule({ imports: [EstablecimientoDetalleComponent], providers: [
      { provide: ActivatedRoute, useValue: { paramMap: params.asObservable(), snapshot: { paramMap: params.value } } },
      { provide: BotaneroService, useValue: {
        obtenerEstablecimiento: () => of({ codigoEstatus: 1, cuerpoDeRespuesta: { ...getEmptyEstablecimientoFormValue(), idEstablecimiento: 5, fldNombre: 'Lugar' } }),
        obtenerStats: () => of({ codigoEstatus: 1, cuerpoDeRespuesta: { calificacionPromedio: 0, totalComentarios: 0, totalCanjes: 0 } }),
        obtenerCanjesResumen: () => of({ codigoEstatus: 1, cuerpoDeRespuesta: { hoy: 0, semana: 0, mes: 0, total: 0, idEstablecimiento: 5, nombreEstablecimiento: 'Lugar' } }),
        obtenerCanjes,
        listarComentarios: () => of({ codigoEstatus: 1, cuerpoDeRespuesta: [] }),
      } },
    ] }).overrideComponent(EstablecimientoDetalleComponent, { set: { template: '' } });
    const fixture = TestBed.createComponent(EstablecimientoDetalleComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();

    expect(component.canjesDetalle()).toEqual([]);
    expect(component.canjesDetalleError()).toBe('');
    component.aplicarFiltroCanjes('hoy');
    expect(component.canjesDesde()).toBe(component.canjesHasta());
    expect(obtenerCanjes).toHaveBeenCalledTimes(2);
    expect(obtenerCanjes.calls.mostRecent().args[1].pagina).toBe(0);
    fixture.destroy();
  });

  it('muestra error de detalle de canjes y admite reintento', () => {
    const params = new BehaviorSubject(convertToParamMap({ id: '5' }));
    const obtenerCanjes = jasmine.createSpy().and.returnValues(
      throwError(() => new Error('offline')),
      of({ codigoEstatus: 1, cuerpoDeRespuesta: { filas: [], pagina: 0, tamano: 20, total: 0 } }),
    );
    TestBed.configureTestingModule({ imports: [EstablecimientoDetalleComponent], providers: [
      { provide: ActivatedRoute, useValue: { paramMap: params.asObservable(), snapshot: { paramMap: params.value } } },
      { provide: BotaneroService, useValue: {
        obtenerEstablecimiento: () => of({ codigoEstatus: 1, cuerpoDeRespuesta: { ...getEmptyEstablecimientoFormValue(), idEstablecimiento: 5, fldNombre: 'Lugar' } }),
        obtenerStats: () => of({ codigoEstatus: 1, cuerpoDeRespuesta: { calificacionPromedio: 0, totalComentarios: 0, totalCanjes: 0 } }),
        obtenerCanjesResumen: () => of({ codigoEstatus: 1, cuerpoDeRespuesta: { hoy: 0, semana: 0, mes: 0, total: 0, idEstablecimiento: 5, nombreEstablecimiento: 'Lugar' } }),
        obtenerCanjes,
        listarComentarios: () => of({ codigoEstatus: 1, cuerpoDeRespuesta: [] }),
      } },
    ] }).overrideComponent(EstablecimientoDetalleComponent, { set: { template: '' } });
    const fixture = TestBed.createComponent(EstablecimientoDetalleComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();

    expect(component.canjesDetalleError()).toContain('No se pudieron cargar');
    component.cargarDetalleCanjes();
    expect(component.canjesDetalleError()).toBe('');
    fixture.destroy();
  });

  it('distingue errores de estadísticas/comentarios y conserva promociones e imágenes al editar', async () => {
    const lugar = { ...getEmptyEstablecimientoFormValue(), idEstablecimiento: 5, fldNombre: 'Lugar',
      fldPromo300Lugares: 'Beneficio exclusivo', imagenesPerfil: ['foto1', 'foto2', 'foto3', 'foto4', 'foto5'], imagenesMenu: ['menu1', 'menu2'] } as unknown as BotaneroEstablecimientoDTO;
    const editar = jasmine.createSpy().and.returnValue(of({ codigoEstatus: -1, mensaje: 'No guardado' }));
    const params = new BehaviorSubject(convertToParamMap({ id: '5' }));
    TestBed.configureTestingModule({ imports: [EstablecimientoDetalleComponent], providers: [
      { provide: ActivatedRoute, useValue: { paramMap: params.asObservable(), snapshot: { paramMap: params.value } } },
      { provide: BotaneroService, useValue: {
        obtenerEstablecimiento: () => of({ codigoEstatus: 1, cuerpoDeRespuesta: lugar }),
        obtenerStats: () => throwError(() => new Error('sin conexión')),
        obtenerCanjesResumen: () => of({ codigoEstatus: 1, mensaje: 'ok', cuerpoDeRespuesta: { idEstablecimiento: 1, nombreEstablecimiento: 'Lugar', hoy: 0, semana: 0, mes: 0, total: 0 } }),
        obtenerCanjes: () => of({ codigoEstatus: 1, mensaje: 'ok', cuerpoDeRespuesta: { filas: [], pagina: 0, tamano: 20, total: 0 } }),
        listarComentarios: () => throwError(() => new Error('sin conexión')),
        editarEstablecimiento: editar
      } }
    ] }).overrideComponent(EstablecimientoDetalleComponent, { set: { template: '' } });
    const fixture = TestBed.createComponent(EstablecimientoDetalleComponent); const c = fixture.componentInstance;
    c.ngOnInit(); expect(c.statsError()).toBeTruthy(); expect(c.comentariosError()).toBeTruthy();
    c.abrirModalEditar();
    c.onEstablecimientoSubmit({ values: c.formValue()!, files: { foto: null, foto2: null, foto3: null, foto4: null, menu: null } });
    const datos = (editar.calls.mostRecent().args[1] as FormData).get('datos') as Blob;
    const payload = JSON.parse(await datos.text());
    expect(payload.fldPromo300Lugares).toBe('Beneficio exclusivo'); expect(payload.imagenesPerfil.length).toBe(5); expect(payload.imagenesMenu).toEqual(['menu1','menu2']);
    expect(c.showFormModal()).toBeTrue(); expect(c.guardando()).toBeFalse();
    params.next(convertToParamMap({ id: '-1' })); expect(c.error()).toContain('no válido');
    fixture.destroy();
  });
});
