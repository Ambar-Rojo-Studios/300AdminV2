import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpBackend } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { createValideCode } from '../model/validate-code.model';

@Injectable({
  providedIn: 'root'
})
/**
 * Servicio para validar el código de recuperación enviado al usuario.
 */
export class validateCodeServices {
  private httpSinInterceptor: HttpClient;
  private readonly validateCodeUrl= 'api/password-reset/forgot-password';

  constructor(handler: HttpBackend) {
    this.httpSinInterceptor = new HttpClient(handler);
  }

  crearForgotPassword(payload: createValideCode): Observable<string> {
    return this.httpSinInterceptor.post(this.validateCodeUrl, payload, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      responseType: 'text'
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const message =
      (error.error && (error.error.mensaje || error.error.message)) ||
      error.statusText ||
      'Error desconocido del servidor';
    return throwError(() => new Error(message));
  }
}