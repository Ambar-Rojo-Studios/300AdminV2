import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../../../auth/services/auth.service';
import { ComentariosClienteComponent } from './comentarios-cliente.component';
import { ClienteEstrellaComponent } from '../cliente-estrella/cliente-estrella.component';

describe('Acciones de cliente en la ficha pública', () => {
  let cliente: boolean;
  let autenticado: boolean;
  beforeEach(() => {
    cliente = false; autenticado = true;
    TestBed.configureTestingModule({ imports: [ComentariosClienteComponent], providers: [
      provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
      { provide: AuthService, useValue: {
        getId: () => 1, estaClienteLogueado: () => cliente, estaAutenticado: () => autenticado,
      } },
    ] });
  });
  it('oculta comentarios propios y calificaciones a un rol de panel aunque coincida su ID', () => {
    const fixture = TestBed.createComponent(ComentariosClienteComponent); fixture.detectChanges();
    const c = fixture.componentInstance;
    expect(c.esAutor({ idCliente: 1 } as any)).toBeFalse();
    expect(fixture.nativeElement.querySelector('.comentario-form')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-cliente-estrella')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('necesitas una cuenta de cliente');
    fixture.destroy();
  });
  it('permite los controles de comentario y calificación a un cliente autenticado', () => {
    cliente = true;
    const fixture = TestBed.createComponent(ComentariosClienteComponent); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.comentario-form')).not.toBeNull();
    expect(fixture.componentInstance.esAutor({ idCliente: 1 } as any)).toBeTrue();
    fixture.destroy();
  });
  it('rechaza el envío de calificaciones de una cuenta de panel sin llamar al servicio', async () => {
    const fixture = TestBed.createComponent(ClienteEstrellaComponent); const c = fixture.componentInstance;
    c.establecimientoId = 1; c.calificacion.set(5);
    await c.enviar();
    expect(c.error()).toContain('iniciar sesión como cliente');
    expect(c.cargando()).toBeFalse(); fixture.destroy();
  });
});
