import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RecoveryStateService {
  email = '';
  userType: 'cliente' | 'usuario' = 'cliente';
  readonly token = signal<string | null>(null);

  iniciar(email: string, userType: 'cliente' | 'usuario') {
    this.email = email;
    this.userType = userType;
    this.token.set(null);
  }

  limpiar() { this.email = ''; this.token.set(null); }
}
