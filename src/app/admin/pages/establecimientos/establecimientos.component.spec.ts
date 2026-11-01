import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { EstablecimientosComponent } from './establecimientos.component';
import { EstablecimientosService } from '../../../services/establecimientos.service';
import { EmpresasService } from '../../../services/empresa.service';
import { SuscripcionesService } from '../../../services/suscripcion.service';
import { TiposEstablecimientoService } from '../../../services/tipo-establecimiento.service';
import { EstablecimientoListDTO } from '../../../models/establecimiento.model';

const respuesta = (cuerpoDeRespuesta: unknown[]) => ({ codigoEstatus: 1, mensaje: '', cuerpoDeRespuesta });

describe('Filtros del catálogo de establecimientos', () => {
  it('encuentra registros de otras páginas y pagina después de filtrar', async () => {
    const obtener = jasmine.createSpy().and.callFake((pagina: number) => of(respuesta(pagina === 1
      ? Array.from({ length: 100 }, (_, i) => ({ idEstablecimiento: i + 1, fldNombre: 'Lugar ' + i, fldCiudad: 'Tuxtla', fkIdEmpresa: 1, fkIdTipoEstablecimiento: 1 }))
      : [{ idEstablecimiento: 101, fldNombre: 'Café buscado', fldCiudad: 'San Cristóbal', fkIdEmpresa: 2, fkIdTipoEstablecimiento: 3 }])));
    TestBed.configureTestingModule({ imports: [EstablecimientosComponent], providers: [
      { provide: EstablecimientosService, useValue: { obtenerEstablecimientos: obtener } },
      { provide: EmpresasService, useValue: { obtenerEmpresas: () => of(respuesta([])) } },
      { provide: SuscripcionesService, useValue: { obtenerSuscripcionesCliente: () => of(respuesta([])), obtenerSuscripcionesNoCliente: () => of(respuesta([])) } },
      { provide: TiposEstablecimientoService, useValue: { obtenerTipos: () => of(respuesta([])) } }
    ] }).overrideComponent(EstablecimientosComponent, { set: { template: '' } });
    const fixture = TestBed.createComponent(EstablecimientosComponent);
    const component = fixture.componentInstance;
    await component.ngOnInit();
    expect(obtener).toHaveBeenCalledWith(2, 100);
    expect(component.totalPages()).toBe(11);
    component.filtroNombre.set('café'); component.filtroCiudad.set('San Cristóbal');
    component.filtroEmpresa.set('2'); component.filtroTipo.set('3');
    expect(component.paginaActual().map(est => est.idEstablecimiento)).toEqual([101]);
    expect(component.totalPages()).toBe(1);
    component.limpiarFiltros(); expect(component.establecimientosFiltrados().length).toBe(101);
    component.currentPage.set(11);
    // Simula la eliminación del último registro de la última página.
    obtener.and.returnValue(of(respuesta(Array.from({ length: 5 }, (_, i) => ({ idEstablecimiento: i, fldNombre: 'Lugar' } as EstablecimientoListDTO)))));
    await component.cargarEstablecimientos();
    expect(component.currentPage()).toBe(1);
    fixture.destroy();
  });
});

describe('Edición administrativa con ficha completa', () => {
  it('obtiene el detalle antes de editar y conserva imágenes y promociones al guardar', async () => {
    const base = { idEstablecimiento: 7, fkIdEmpresa: 1, fkIdSuscripcion: 2, fldNombre: 'Lugar' } as EstablecimientoListDTO;
    const detalle = { ...base, imagenesPerfil: ['1','2','3','4','5'], imagenesMenu: ['menu1','menu2'], fldPromo300Lugares: 'Promo exclusiva' };
    const guardar = jasmine.createSpy().and.returnValue(of({ codigoEstatus: 1 }));
    const obtenerDetalle = jasmine.createSpy().and.returnValue(of({ codigoEstatus: 1, cuerpoDeRespuesta: detalle }));
    TestBed.configureTestingModule({ imports: [EstablecimientosComponent], providers: [
      { provide: EstablecimientosService, useValue: { obtenerIdPorEstablecimiento: obtenerDetalle, editEstablecimiento: guardar, obtenerEstablecimientos: () => of(respuesta([])) } },
      { provide: EmpresasService, useValue: {} }, { provide: SuscripcionesService, useValue: {} }, { provide: TiposEstablecimientoService, useValue: {} }
    ] }).overrideComponent(EstablecimientosComponent, { set: { template: '' } });
    const fixture = TestBed.createComponent(EstablecimientosComponent); const c = fixture.componentInstance;
    await c.abrirModalEditar(base); expect(obtenerDetalle).toHaveBeenCalledWith(7);
    expect(c.formValue()?.imagenesPerfil?.length).toBe(5);
    await c.onEstablecimientoSubmit({ values: c.formValue()!, files: { foto: null, foto2: null, foto3: null, foto4: null, menu: null } });
    const payload = guardar.calls.mostRecent().args[0];
    expect(payload.imagenesPerfil.length).toBe(5); expect(payload.imagenesMenu).toEqual(['menu1','menu2']);
    expect(payload.fldPromo300Lugares).toBe('Promo exclusiva'); expect(c.showFormModal()).toBeFalse();
    fixture.destroy();
  });
});
