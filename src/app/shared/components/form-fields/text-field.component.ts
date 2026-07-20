import { CommonModule } from '@angular/common';
import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let uniqueId = 0;

export type TextFieldType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'date' | 'time' | 'search';

/**
 * Input de texto consistente para todos los CRUDs del admin.
 * Implementa ControlValueAccessor: funciona con [(ngModel)] y con
 * reactive forms ([formControl] / formControlName) sin cambios.
 *
 * No trae CSS propio: reutiliza .form-group / input global de styles.css.
 *
 * ```html
 * <app-text-field label="Nombre" name="fldNombre" [(ngModel)]="empresa.fldNombre" required>
 * </app-text-field>
 * ```
 */
@Component({
  selector: 'app-text-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './text-field.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextFieldComponent),
      multi: true,
    },
  ],
})
export class TextFieldComponent implements ControlValueAccessor {
  label = input('');
  type = input<TextFieldType>('text');
  placeholder = input('');
  required = input(false);
  invalid = input(false);
  errorMessage = input('');
  id = input(`text-field-${uniqueId++}`);

  disabled = signal(false);
  value = signal<string | number>('');

  private onChange: (value: string | number) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | number | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string | number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = this.type() === 'number' ? target.valueAsNumber : target.value;
    this.value.set(value);
    this.onChange(value);
  }

  handleBlur(): void {
    this.onTouched();
  }
}
