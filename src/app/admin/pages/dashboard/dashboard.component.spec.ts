import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { EstablecimientosService } from '../../../services/establecimientos.service';
import { EmpresasService } from '../../../services/empresa.service';
import { MarcasService } from '../../../services/marca.service';
import { PromocionesService } from '../../../services/promocion.service';
import { EtiquetasService } from '../../../services/etiquetas.service';
import { ClientesService } from '../../../services/cliente.service';
import { UsuarioService } from '../../../services/usuario.service';
import { CulturalService } from '../../../services/capsula-cultural.service';
import { TiposEstablecimientoService } from '../../../services/tipo-establecimiento.service';
import { ToastService } from '../../../shared/services/toast.service';

const respuesta = (cuerpoDeRespuesta: unknown[]) => ({ codigoEstatus: 1, mensaje: '', cuerpoDeRespuesta });

describe('Dashboard administrativo', () => {
  it('completa la paginación y mantiene independientes las fuentes que fallan', async () => {
    const obtener = jasmine.createSpy().and.callFake((pagina: number) => of(respuesta(pagina === 1
      ? Array.from({ length: 100 }, (_, i) => ({ idEstablecimiento: i + 1, fldNombre: 'Lugar', fldCiudad: 'Tuxtla' }))
      : [{ idEstablecimiento: 101, fldNombre: 'Último lugar', fldCiudad: 'Tuxtla' }])));
    TestBed.configureTestingModule({ imports: [DashboardComponent], providers: [
      { provide: EstablecimientosService, useValue: { obtenerEstablecimientos: obtener } },
      { provide: EmpresasService, useValue: { obtenerEmpresas: () => of(respuesta([])) } },
      { provide: MarcasService, useValue: { obtenerMarcas: () => of(respuesta([])) } },
      { provide: PromocionesService, useValue: { obtenerPromociones: () => of(respuesta([])) } },
      { provide: EtiquetasService, useValue: { listarEtiquetas: () => throwError(() => new Error('sin conexión')) } },
      { provide: ClientesService, useValue: { listarClientes: () => of(respuesta([])) } },
      { provide: UsuarioService, useValue: { obtenerUsuarios: () => of(respuesta([])) } },
      { provide: CulturalService, useValue: { obtenerCulturales: () => of(null) } },
      { provide: TiposEstablecimientoService, useValue: { obtenerTipos: () => of(respuesta([])) } },
      { provide: ToastService, useValue: { showError: jasmine.createSpy() } }
    ] }).overrideComponent(DashboardComponent, { set: { template: '' } });
    const fixture = TestBed.createComponent(DashboardComponent); fixture.detectChanges(); await fixture.whenStable();
    const c = fixture.componentInstance;
    expect(obtener).toHaveBeenCalledWith(2, 100);
    expect(c.kpis().find(kpi => kpi.label === 'Establecimientos')?.value).toBe(101);
    expect(c.kpis().find(kpi => kpi.label === 'Etiquetas')?.fuente.error).toBeTrue();
    expect(c.kpis().find(kpi => kpi.label === 'Cápsulas culturales')?.fuente.error).toBeFalse();
    expect(c.fichasPendientes().length).toBe(101); fixture.destroy();
  });
});
