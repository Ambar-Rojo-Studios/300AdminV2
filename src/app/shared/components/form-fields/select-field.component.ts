import { CommonModule } from '@angular/common';
import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let uniqueId = 0;

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

/**
 * Select consistente para todos los CRUDs del admin.
 * Compatible con [(ngModel)] y reactive forms vía ControlValueAccessor.
 *
 * ```html
 * <app-select-field
 *   label="Categoría"
 *   [options]="categorias"
 *   placeholder="Selecciona una categoría"
 *   [(ngModel)]="etiqueta.fkIdCategoriaEtiqueta"
 *   name="categoria"
 *   required
 * ></app-select-field>
 * ```
 */
@Component({
  selector: 'app-select-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-field.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectFieldComponent),
      multi: true,
    },
  ],
})
export class SelectFieldComponent implements ControlValueAccessor {
  label = input('');
  options = input<SelectOption[]>([]);
  placeholder = input('Selecciona una opción');
  required = input(false);
  invalid = input(false);
  errorMessage = input('');
  id = input(`select-field-${uniqueId++}`);

  disabled = signal(false);
  value = signal<string | number | null>(null);

  private onChange: (value: string | number | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | number | null): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  handleChange(event: Event): void {
    const raw = (event.target as HTMLSelectElement).value;
    const matched = this.options().find((o) => String(o.value) === raw);
    const value = matched ? matched.value : raw || null;
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
  }
}
