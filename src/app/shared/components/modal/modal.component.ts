import { CommonModule } from '@angular/common';
import { Component, HostListener, input, output } from '@angular/core';

export type ModalSize = 'sm' | 'md' | 'lg';

/**
 * Modal genérico y reutilizable para todo el admin.
 *
 * - Título vía `[title]`.
 * - Contenido proyectado por defecto (ng-content), botones/footer proyectados
 *   con `[modal-footer]`.
 * - Cierre por click en el overlay y/o tecla Esc (configurable).
 * - No trae botones "confirmar/cancelar" fijos: el consumidor los proyecta
 *   en el footer, lo que lo hace válido tanto para formularios como para
 *   confirmaciones. Para el caso puntual de "confirmar borrado" existe
 *   <app-confirm-dialog>, que envuelve a este modal ya armado.
 *
 * Uso:
 * ```html
 * <app-modal [open]="showModal" title="Crear empresa" (closed)="cerrarModal()">
 *   <form (ngSubmit)="onSubmit()">...</form>
 *   <ng-container modal-footer>
 *     <button type="button" class="btn-secondary" (click)="cerrarModal()">Cancelar</button>
 *     <button type="submit" class="btn-primary">Guardar</button>
 *   </ng-container>
 * </app-modal>
 * ```
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
})
export class ModalComponent {
  /** Controla si el modal está visible. */
  open = input(false);

  /** Título mostrado en el encabezado. Si está vacío, no se pinta el header-title. */
  title = input('');

  /** Tamaño del modal: sm (~420px), md (~460px, default), lg (~760px). */
  size = input<ModalSize>('md');

  /** Si es false, hacer click en el overlay no cierra el modal. */
  closeOnOverlay = input(true);

  /** Si es false, la tecla Esc no cierra el modal. */
  closeOnEsc = input(true);

  /** Si es false, oculta el botón "x" del encabezado. */
  showCloseButton = input(true);

  /** Se emite cada vez que el modal pide cerrarse (overlay, esc o botón x). */
  closed = output<void>();

  @HostListener('document:keydown.escape')
  onEscPressed(): void {
    if (this.open() && this.closeOnEsc()) {
      this.requestClose();
    }
  }

  onOverlayClick(): void {
    if (this.closeOnOverlay()) {
      this.requestClose();
    }
  }

  requestClose(): void {
    this.closed.emit();
  }

  get maxWidth(): string | null {
    switch (this.size()) {
      case 'sm':
        return '420px';
      case 'lg':
        return '760px';
      default:
        return null; // usa el max-width por defecto de .modal-content (460px)
    }
  }
}
