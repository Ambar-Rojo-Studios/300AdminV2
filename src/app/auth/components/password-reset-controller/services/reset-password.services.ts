import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpBackend } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { createResetPassword  } from '../model/reset-password.model';

@Injectable({
  providedIn: 'root'
})

export class ResetPasswordServices{
  private httpSinInterceptor: HttpClient;
  private readonly resetPasswordUrl = '';

  constructor(handler: HttpBackend) {
    this.httpSinInterceptor = new HttpClient(handler);
  }

  crearResetPassword(payload:createResetPassword): Observable<string>{
    return this.httpSinInterceptor.post(this.resetPasswordUrl,payload,{
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      responseType: 'text'
    }).pipe(
       catchError(this.handleError) 
    )
  }
  
   private handleError(error: HttpErrorResponse): Observable<never> {
    const message =
      (error.error && (error.error.mensaje || error.error.message)) ||
      error.statusText ||
      'Error desconocido del servidor';
    return throwError(() => new Error(message));
  }
}