import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { createResetPassword } from '../model/reset-password.model';

@Injectable({ providedIn: 'root' })
export class ResetPasswordServices {
  private readonly http = inject(HttpClient);

  crearResetPassword(payload: createResetPassword) {
    return this.http.post('/api/password-reset/reset-password', payload, { responseType: 'text' });
  }
}
