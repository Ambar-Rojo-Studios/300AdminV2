import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { ClienteEstrellaService } from '../../../services/cliente-estrella.service';
import { AuthService } from '../../../auth/services/auth.service';
import { CreateClienteEstrella } from '../../../models/cliente-estrella.model';

@Component({
  selector: 'app-cliente-estrella',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cliente-estrella.component.html',
  styleUrls: ['./cliente-estrella.component.css'],
})
export class ClienteEstrellaComponent {
  private readonly estrellaService = inject(ClienteEstrellaService);
  private readonly authService = inject(AuthService);

  @Input() establecimientoId: number | null = null;

  readonly mensaje = signal<string>('');
  readonly error = signal<string>('');
  readonly cargando = signal(false);
  readonly calificacion = signal<number | null>(null);

  seleccionar(star: number): void {
    this.calificacion.set(star);
    void this.enviar();
  }

  async enviar(): Promise<void> {
    if (!this.establecimientoId) {
      this.error.set('Falta el ID del establecimiento.');
      return;
    }
    const idCliente = this.authService.getId();
    if (!idCliente) {
      this.error.set('Debes iniciar sesión como cliente para calificar.');
      return;
    }
    if (!this.calificacion()) {
      this.error.set('Selecciona una calificación.');
      return;
    }

    this.cargando.set(true);
    this.error.set('');
    this.mensaje.set('');

    const payload: CreateClienteEstrella = {
      idCliente,
      idEstablecimiento: this.establecimientoId,
      fldCalificacion: String(this.calificacion()),
    };

    try {
      await firstValueFrom(this.estrellaService.crearEstrella(payload));
      this.mensaje.set('Calificación enviada correctamente.');
      this.calificacion.set(null);
      setTimeout(() => this.mensaje.set(''), 3000);
    } catch (err: any) {
      const msg = err?.error?.mensaje || err?.message || 'Error desconocido';
      this.error.set(`Error al enviar la calificación: ${msg}`);
      setTimeout(() => this.error.set(''), 3000);
    } finally {
      this.cargando.set(false);
    }
  }
}