import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ValidateCode } from './components/validate-code/validate-code.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { RecoveryStateService } from './services/recovery-state.service';
import { apiBaseInterceptorFn } from '../../../core/interceptors/api-base.interceptor';

describe('Recuperación de contraseña', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [
      provideZonelessChangeDetection(), provideHttpClient(withInterceptors([apiBaseInterceptorFn])), provideHttpClientTesting(),
      provideRouter([
        { path: 'forgot-password', component: ForgotPasswordComponent },
        { path: 'validate-code', component: ValidateCode },
        { path: 'reset-password', component: ResetPasswordComponent }
      ])
    ] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  async function llenar(selector: string, value: string) {
    const input = harness.routeNativeElement!.querySelector(selector) as HTMLInputElement;
    input.value = value; input.dispatchEvent(new Event('input', { bubbles: true }));
    await harness.fixture.whenStable(); harness.detectChanges();
  }
  function enviar() { harness.routeNativeElement!.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }

  it('completa correo → código → contraseña, preserva el tipo de cuenta y limpia el token', async () => {
    harness = await RouterTestingHarness.create('/forgot-password?tipo=usuario');
    await llenar('#recovery-email', 'prueba@example.test'); enviar();
    const correo = http.expectOne(req => req.url.endsWith('/api/password-reset/forgot-password'));
    expect(correo.request.body).toEqual({ email: 'prueba@example.test', userType: 'usuario' });
    correo.flush('enviado');
    await harness.fixture.whenStable(); harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/validate-code');
    expect((harness.routeNativeElement!.querySelector('#validate-email') as HTMLInputElement).value).toBe('prueba@example.test');
    await llenar('#validate-code', '012345'); enviar();
    http.expectOne(req => req.url.endsWith('/api/password-reset/validate-code')).flush('token-de-prueba');
    await harness.fixture.whenStable(); harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/reset-password');
    await llenar('#new-password', 'clave-con-espacio ');
    await llenar('#confirm-password', 'otra-clave'); enviar();
    http.expectNone(req => req.url.endsWith('/reset-password'));
    await llenar('#confirm-password', 'clave-con-espacio '); enviar();
    const reset = http.expectOne(req => req.url.endsWith('/api/password-reset/reset-password'));
    expect(reset.request.body).toEqual({ token: 'token-de-prueba', newPassword: 'clave-con-espacio ' });
    reset.flush('actualizada');
    await harness.fixture.whenStable(); harness.detectChanges();
    expect(TestBed.inject(RecoveryStateService).token()).toBeNull();
    expect(harness.routeNativeElement!.textContent).toContain('Tu contraseña se actualizó');
    expect(harness.routeNativeElement!.querySelector('a')!.getAttribute('href')).toBe('/login/usuario');
  });

  it('muestra un error por código inválido y permite pedir otro', async () => {
    harness = await RouterTestingHarness.create('/validate-code');
    await llenar('#validate-email', 'prueba@example.test'); await llenar('#validate-code', '123456'); enviar();
    http.expectOne(req => req.url.endsWith('/api/password-reset/validate-code')).flush('Invalid code.', { status: 400, statusText: 'Bad Request' });
    await harness.fixture.whenStable(); harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('incorrecto o ha vencido');
    expect(TestBed.inject(Router).url).toBe('/validate-code');
  });

  it('ofrece reiniciar el flujo si se abre la nueva contraseña sin token', async () => {
    harness = await RouterTestingHarness.create('/reset-password');
    expect(harness.routeNativeElement!.querySelector('input')).toBeNull();
    expect(harness.routeNativeElement!.textContent).toContain('Solicitar código');
  });
});
