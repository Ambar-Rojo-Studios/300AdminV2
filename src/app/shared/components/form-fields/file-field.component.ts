import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';

let uniqueId = 0;

/**
 * Input de archivo consistente para el admin (logos, imágenes de
 * establecimiento, etc). No implementa ControlValueAccessor porque los
 * inputs type="file" no pueden setear su valor programáticamente por
 * seguridad del navegador; en su lugar emite el/los `File` seleccionados
 * vía `(fileChange)`.
 *
 * ```html
 * <app-file-field
 *   label="Logo"
 *   accept="image/*"
 *   [previewUrl]="empresa.fldLogoUrl"
 *   (fileChange)="onLogoSelected($event)"
 * ></app-file-field>
 * ```
 */
@Component({
  selector: 'app-file-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-field.component.html',
})
export class FileFieldComponent {
  label = input('');
  accept = input('image/*');
  multiple = input(false);
  required = input(false);
  invalid = input(false);
  errorMessage = input('');
  hint = input('');
  /** URL de una imagen ya existente, para mostrar como preview antes de reemplazarla. */
  previewUrl = input<string | null>(null);
  id = input(`file-field-${uniqueId++}`);

  /** Emite el/los archivo(s) elegidos por el usuario. */
  fileChange = output<File | File[] | null>();

  fileName = signal<string | null>(null);

  handleChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || files.length === 0) {
      this.fileName.set(null);
      this.fileChange.emit(null);
      return;
    }

    if (this.multiple()) {
      this.fileName.set(`${files.length} archivo(s) seleccionados`);
      this.fileChange.emit(Array.from(files));
    } else {
      this.fileName.set(files[0].name);
      this.fileChange.emit(files[0]);
    }
  }
}
