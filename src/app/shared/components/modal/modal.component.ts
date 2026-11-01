import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, afterRenderEffect, inject, input, output, signal, effect, viewChild } from '@angular/core';

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
  styleUrl: './modal.component.css',
})
export class ModalComponent implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');
  private readonly discardPrompt = viewChild<ElementRef<HTMLElement>>('discardPrompt');
  private activeDialog: HTMLElement | null = null;
  private previousFocus: HTMLElement | null = null;
  busy = input(false);
  confirmDiscard = input(false);
  readonly discarding = signal(false);

  constructor() {
    effect(() => { this.open(); this.discarding.set(false); });
    afterRenderEffect(() => {
      const dialog = this.dialog()?.nativeElement;
      if (dialog && !this.activeDialog) {
        this.previousFocus = this.document.activeElement as HTMLElement | null;
        this.activeDialog = dialog;
        (this.focusableElements()[0] ?? dialog).focus();
      } else if (!dialog && this.activeDialog) {
        this.restoreFocus();
      }
      this.discardPrompt()?.nativeElement.focus();
    });
  }

  private focusableElements(): HTMLElement[] {
    return Array.from(this.activeDialog?.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, [tabindex]'
    ) ?? []).filter(element => !element.matches(':disabled') && element.tabIndex >= 0 && element.getClientRects().length > 0);
  }

  @HostListener('document:keydown', ['$event'])
  onTabPressed(event: KeyboardEvent): void {
    if (!this.open() || event.key !== 'Tab' || !this.activeDialog) return;
    const elements = this.focusableElements();
    const first = elements[0], last = elements.at(-1);
    const active = this.document.activeElement;
    if (!first || !this.activeDialog.contains(active) || active === this.activeDialog
      || (event.shiftKey ? active === first : active === last)) {
      event.preventDefault();
      (event.shiftKey ? last ?? this.activeDialog : first ?? this.activeDialog).focus();
    }
  }

  private restoreFocus(): void {
    this.activeDialog = null;
    if (this.previousFocus?.isConnected) this.previousFocus.focus({ preventScroll: true });
    this.previousFocus = null;
  }

  ngOnDestroy(): void { this.restoreFocus(); }

  discard() { if (!this.busy()) { this.discarding.set(false); this.closed.emit(); } }

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
    if (this.busy()) return;
    if (this.confirmDiscard()) this.discarding.set(true);
    else this.closed.emit();
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
