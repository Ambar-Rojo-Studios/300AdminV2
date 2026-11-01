import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { createForgotPassword } from '../model/forgot-password.model';

@Injectable({ providedIn: 'root' })
export class ForgotPasswordService {
  private readonly http = inject(HttpClient);

  crearForgotPassword(payload: createForgotPassword) {
    return this.http.post('/api/password-reset/forgot-password', payload, { responseType: 'text' });
  }
}
