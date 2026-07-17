import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

/**
 * Componente para mostrar notificaciones toast en la interfaz.
 * Debe incluirse una sola vez en el layout principal de la aplicación.
 */

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})

/**
 * Componente encargado de renderizar las notificaciones emergentes de la aplicación.
 */
export class ToastComponent {
  
  private readonly toastService = inject(ToastService);

  /** Lista reactiva de mensajes visibles en la interfaz. */
  public toasts = this.toastService.toasts;

  /**
   * Elimina un toast cuando el usuario hace clic en cerrar.
   */
  public removeToast(id: string): void {
    this.toastService.remove(id);
  }
}

