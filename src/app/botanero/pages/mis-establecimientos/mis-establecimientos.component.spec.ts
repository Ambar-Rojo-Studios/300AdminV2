import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { BotaneroService } from '../../../services/botanero.service';
import { MisEstablecimientosComponent } from './mis-establecimientos.component';

describe('Resumen del botanero', () => {
  it('mantiene el dashboard visible aunque haya un solo lugar y muestra tareas pendientes', () => {
    TestBed.configureTestingModule({ imports: [MisEstablecimientosComponent], providers: [provideRouter([]),
      { provide: BotaneroService, useValue: { listarMisEstablecimientos: () => of({ codigoEstatus: 1, cuerpoDeRespuesta: [{ idEstablecimiento: 1, fldNombre: 'Mi lugar', imagenesPerfil: [], imagenesMenu: [] }] }) } }
    ] });
    const fixture = TestBed.createComponent(MisEstablecimientosComponent); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Mi panel');
    expect(fixture.nativeElement.querySelector('.pendientes .badge').textContent).toContain('Ficha por completar');
    expect(fixture.nativeElement.querySelector('a.btn-primary').getAttribute('href')).toBe('/mi-lugar/establecimiento/1');
    expect(fixture.componentInstance.incompletas()).toBe(1); fixture.destroy();
  });
});
