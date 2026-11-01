import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgForm } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EstablecimientoFormComponent } from './establecimiento-form.component';
import { MapaEstablecimientoComponent } from '../mapa-establecimiento/mapa-establecimiento.component';
import { EtiquetasSelectorComponent } from '../etiquetas-selector/etiquetas-selector.component';
import { getEmptyEstablecimientoFormValue } from '../../models/establecimiento-form.model';
import { imagenesAConservar } from '../../../utils/imagenes-conservadas';

describe('Edición compartida de establecimientos', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [EstablecimientoFormComponent], providers: [provideHttpClient(), provideHttpClientTesting()] })
      .overrideComponent(EstablecimientoFormComponent, { remove: { imports: [MapaEstablecimientoComponent, EtiquetasSelectorComponent] }, add: { schemas: [NO_ERRORS_SCHEMA] } });
  });
  async function crear() {
    const fixture = TestBed.createComponent(EstablecimientoFormComponent);
    fixture.componentRef.setInput('mode', 'botanero');
    fixture.componentRef.setInput('value', { ...getEmptyEstablecimientoFormValue(), idEstablecimiento: 7,
      fldNombre: 'Lugar', fldEstado: 'Chiapas', fldCiudad: 'Tuxtla', fldDireccion: 'Calle 1', fldReferenciaGeografica: 'Centro',
      fldCoordLatitud: '16.75', fldCoordLongitud: '-93.11', fldHorarioApertura: '10:00', fldHorarioCierre: '23:00' });
    fixture.detectChanges(); await fixture.whenStable(); return fixture;
  }
  it('recalcula validaciones y cambios pendientes al editar un campo del DOM', async () => {
    const fixture = await crear(); const c = fixture.componentInstance;
    expect(c.missingFields()).toEqual([]); expect(c.dirty()).toBeFalse();
    const input = fixture.nativeElement.querySelector('app-text-field[name="fldNombre"] input') as HTMLInputElement;
    input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })); fixture.detectChanges();
    expect(c.missingFields()).toContain('Nombre'); expect(c.dirty()).toBeTrue();
    input.value = 'Lugar'; input.dispatchEvent(new Event('input', { bubbles: true })); fixture.detectChanges();
    expect(c.missingFields()).toEqual([]); expect(c.dirty()).toBeFalse();
    c.onCoordsChange({ lat: '0', lng: '0' }); expect(c.coordsActuales()).toEqual({ lat: '0', lng: '0' });
    expect(fixture.nativeElement.querySelector('app-etiquetas-selector')).toBeNull();
    fixture.destroy();
  });
  it('bloquea guardar con coordenadas inválidas, imagen pendiente o archivo rechazado', async () => {
    const fixture = await crear(); const c = fixture.componentInstance;
    const submit = jasmine.createSpy(); c.formSubmit.subscribe(submit);
    const form = fixture.debugElement.query(By.directive(NgForm)).injector.get(NgForm);
    c.updateField('fldCoordLatitud', '100'); c.handleSubmit(form); expect(submit).not.toHaveBeenCalled();
    expect(c.formError()).toContain('ubicación válida');
    c.updateField('fldCoordLatitud', '16.75'); c.processing.set({ foto: true }); c.handleSubmit(form);
    expect(c.formError()).toContain('procesarse');
    c.processing.set({}); await c.onFileSelected('foto', new File(['texto'], 'archivo.txt', { type: 'text/plain' })); c.handleSubmit(form);
    expect(c.formError()).toContain('archivos marcados'); expect(submit).not.toHaveBeenCalled();
    await c.onFileSelected('foto', null); c.handleSubmit(form); expect(submit).toHaveBeenCalled();
    fixture.destroy();
  });
  it('conserva fotos adicionales y la segunda imagen del menú al reemplazar archivos', () => {
    const file = new File([], 'foto.png', { type: 'image/png' });
    const result = imagenesAConservar(['1','2','3','4','5'], ['menu1','menu2'], { foto: file, foto2: null, foto3: null, foto4: null, menu: file });
    expect(result.imagenesPerfil).toEqual(['2','3','4','5']); expect(result.imagenesMenu).toEqual(['menu2']);
    const segundaPagina = imagenesAConservar(['1','2','3','4','5'], ['menu1','menu2'], { foto: null, foto2: null, foto3: null, foto4: null, foto5: file, menu: null, menu2: file });
    expect(segundaPagina.imagenesPerfil).toEqual(['1','2','3','4']); expect(segundaPagina.imagenesMenu).toEqual(['menu1']);
  });
  it('muestra y enfoca el resumen de errores al intentar guardar una ubicación inválida', async () => {
    const fixture = await crear();
    const form = fixture.debugElement.query(By.directive(NgForm)).injector.get(NgForm);
    fixture.componentInstance.updateField('fldCoordLatitud', '100');
    fixture.componentInstance.handleSubmit(form);
    fixture.detectChanges(); await fixture.whenStable();
    const summary = fixture.nativeElement.querySelector('[role="alert"]');
    expect(summary.textContent).toContain('ubicación válida');
    expect(document.activeElement).toBe(summary);
    fixture.destroy();
  });
});
