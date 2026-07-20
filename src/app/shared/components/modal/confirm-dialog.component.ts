import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ModalComponent } from './modal.component';

/**
 * Variante lista para usar del modal genérico, pensada para confirmaciones
 * de borrado (o cualquier confirmación simple sí/no).
 *
 * Uso:
 * ```html
 * <app-confirm-dialog
 *   [open]="showModal && modalMode === 'delete'"
 *   title="Confirmar eliminación"
 *   [itemName]="empresa?.fldNombre"
 *   [loading]="isDeleting"
 *   (confirm)="confirmarEliminar()"
 *   (cancel)="cerrarModal()"
 * ></app-confirm-dialog>
 * ```
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialogComponent {
  open = input(false);
  title = input('Confirmar eliminación');

  /** Texto previo al nombre del elemento. */
  message = input('¿Seguro que deseas eliminar');

  /** Nombre/identificador del elemento a eliminar, se resalta en negrita. */
  itemName = input<string | null>(null);

  confirmText = input('Eliminar');
  cancelText = input('Cancelar');

  /** Deshabilita el botón de confirmar y muestra estado de carga. */
  loading = input(false);

  confirm = output<void>();
  cancel = output<void>();

  onModalClosed(): void {
    this.cancel.emit();
  }
}
