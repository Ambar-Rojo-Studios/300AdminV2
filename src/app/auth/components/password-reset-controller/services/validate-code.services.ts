import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { createValideCode } from '../model/validate-code.model';

@Injectable({ providedIn: 'root' })
export class validateCodeServices {
  private readonly http = inject(HttpClient);

  crearForgotPassword(payload: createValideCode) {
    return this.http.post('/api/password-reset/validate-code', payload, { responseType: 'text' });
  }
}
