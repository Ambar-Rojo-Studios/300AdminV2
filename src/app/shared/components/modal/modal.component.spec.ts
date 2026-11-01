import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ModalComponent } from './modal.component';

@Component({
  imports: [ModalComponent],
  template: `<button (click)="open = true">Editar</button><app-modal [open]="open" title="Ficha" (closed)="open = false">
    <input aria-label="Nombre" /><button modal-footer>Guardar</button>
  </app-modal>`,
})
class ModalKeyboardHost { open = false; }

describe('Protección del editor', () => {
  it('lleva el foco al modal, contiene Tab y devuelve el foco al cerrar', async () => {
    const fixture = TestBed.createComponent(ModalKeyboardHost);
    fixture.detectChanges();
    const opener = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    opener.focus(); opener.click(); fixture.detectChanges(); await fixture.whenStable();
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    const close = dialog.querySelector('button') as HTMLButtonElement;
    const save = dialog.querySelector('.modal-footer button') as HTMLButtonElement;
    expect(document.activeElement).toBe(close);
    close.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(save);
    save.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(close);
    fixture.debugElement.query(By.directive(ModalComponent)).componentInstance.requestClose();
    fixture.detectChanges(); await fixture.whenStable();
    expect(document.activeElement).toBe(opener);
    fixture.destroy();
  });
  it('pide descartar cambios y bloquea el cierre mientras guarda', () => {
    const fixture = TestBed.createComponent(ModalComponent); const c = fixture.componentInstance;
    fixture.componentRef.setInput('open', true); fixture.componentRef.setInput('confirmDiscard', true); fixture.detectChanges();
    const closed = jasmine.createSpy(); c.closed.subscribe(closed);
    c.requestClose(); fixture.detectChanges(); expect(closed).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Seguir editando');
    fixture.componentRef.setInput('busy', true); fixture.detectChanges(); c.discard(); expect(closed).not.toHaveBeenCalled();
    fixture.componentRef.setInput('busy', false); fixture.detectChanges(); c.discard(); expect(closed).toHaveBeenCalledTimes(1);
    fixture.destroy();
  });
});
