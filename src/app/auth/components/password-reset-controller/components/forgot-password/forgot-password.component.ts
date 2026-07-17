import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForgotPasswordService } from '../../services/forgot-password.services';
import { createForgotPassword } from '../../model/forgot-password.model';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})

/**
 * Componente para solicitar el restablecimiento de contraseña.
 */
export class ForgotPasswordComponent {
  email: string = '';
  userType: string = 'cliente'; 
  mensaje: string | null = null;
  tipoMensaje: 'success' | 'error' = 'success';
  isLoading: boolean = false;

  constructor(
    private forgotPasswordService: ForgotPasswordService,
    private cdr: ChangeDetectorRef
  ) {}

  onForgotPassword() {
    if (!this.email) {
      this.mostrarAlerta('Por favor, completa el correo electrónico.', 'error');
      return;
    }

    this.isLoading = true;
    this.mensaje = null;
    this.cdr.detectChanges(); 

    const payload: createForgotPassword = {
      email: this.email,
      userType: this.userType
    };

    this.forgotPasswordService.crearForgotPassword(payload).subscribe({
      next: (respuesta: string) => {
        this.mostrarAlerta(respuesta, 'success');
        this.isLoading = false; 
      },
      error: (err) => {
        this.mostrarAlerta(err.message, 'error');
        this.isLoading = false; 
      }
    });
  }

  private mostrarAlerta(mensaje: string, tipo: 'success' | 'error'): void {
    this.mensaje = mensaje;
    this.tipoMensaje = tipo;
    setTimeout(() => {
      this.mensaje = null;
      this.cdr.detectChanges(); 
    }, 3000);
    this.cdr.detectChanges();
  }
}