import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error';
}

/**
 * Servicio global para mostrar notificaciones toast en toda la aplicación.
 * Utiliza Angular Signals para gestión de estado reactivo.
 */

@Injectable({
  providedIn: 'root'
})

export class ToastService {

  /**
   * Lista reactiva de mensajes activos que se muestran en la interfaz.
   */
  public toasts = signal<ToastMessage[]>([]);

  private defaultDuration = 5000;

  /**
   * Muestra un toast de éxito.
   * @param message Mensaje a mostrar
   * @param duration Duración en ms (por defecto 5000)
   */

  public showSuccess(message: string, duration: number = this.defaultDuration): void {
    this.addToast(message, 'success', duration);
  }

  /**
   * Muestra un toast de error.
   * @param message Mensaje a mostrar
   * @param duration Duración en ms (por defecto 5000)
   */

  public showError(message: string, duration: number = this.defaultDuration): void {
    this.addToast(message, 'error', duration);
  }

  /**
   * Muestra un toast con el tipo especificado.
   * @param message Mensaje a mostrar
   * @param type Tipo de toast ('success' | 'error')
   * @param duration Duración en ms (por defecto 5000)
   */
  public show(message: string, type: 'success' | 'error' = 'success', duration: number = this.defaultDuration): void {
    this.addToast(message, type, duration);
  }

  /**
   * Elimina un toast específico por su ID.
   * @param id ID del toast a eliminar
   */
  public remove(id: string): void {
    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  /**
   * Elimina todos los toasts activos.
   */
  public clear(): void {
    this.toasts.set([]);
  }

  /**
   * Añade un toast a la lista de toasts activos.
   */
  private addToast(message: string, type: 'success' | 'error', duration: number): void {
    const id = this.generateId();
    
    this.toasts.update(toasts => [...toasts, { id, message, type }]);

    // Auto-remover después de la duración especificada
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  /**
   * Genera un ID único para cada toast.
   */
  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
}

