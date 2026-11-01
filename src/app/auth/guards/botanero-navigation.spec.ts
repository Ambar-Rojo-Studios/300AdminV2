import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';

describe('Acceso al panel botanero', () => {
  it('envía a un botanero sin sesión al acceso de usuarios', () => {
    const navigate = jasmine.createSpy();
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: { estaAutenticado: () => false } },
      { provide: Router, useValue: { navigate } }
    ] });
    const result = TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, { url: '/mi-lugar/establecimiento/7' } as RouterStateSnapshot));
    expect(result).toBeFalse(); expect(navigate).toHaveBeenCalledWith(['/login/usuario'], { queryParams: { returnUrl: '/mi-lugar/establecimiento/7' } });
  });
  it('devuelve a un botanero autenticado a su panel al visitar el login', () => {
    const navigate = jasmine.createSpy();
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: { estaAutenticado: () => true, estaUsuarioLogueado: () => false, obtenerRol: () => 'botanero' } },
      { provide: Router, useValue: { navigate } }
    ] });
    TestBed.runInInjectionContext(() => guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
    expect(navigate).toHaveBeenCalledWith(['/mi-lugar']);
  });
});
