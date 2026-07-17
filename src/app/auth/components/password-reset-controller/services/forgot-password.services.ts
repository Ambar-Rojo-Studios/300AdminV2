import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpBackend } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { createForgotPassword } from '../model/forgot-password.model';

@Injectable({
  providedIn: 'root'
})

/**
 * Servicio para solicitar el proceso de recuperación de contraseña.
 */
export class ForgotPasswordService {
  private httpSinInterceptor: HttpClient;
  private readonly forgotPasswordUrl = 'api/password-reset/forgot-password';

  constructor(handler: HttpBackend) {
    this.httpSinInterceptor = new HttpClient(handler);
  }

  crearForgotPassword(payload: createForgotPassword): Observable<string> {
    return this.httpSinInterceptor.post(this.forgotPasswordUrl, payload, {
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