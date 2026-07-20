import { CommonModule } from '@angular/common';
import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let uniqueId = 0;

/**
 * Textarea consistente para todos los CRUDs del admin.
 * Compatible con [(ngModel)] y reactive forms vía ControlValueAccessor.
 *
 * ```html
 * <app-textarea-field label="Descripción" rows="4" [(ngModel)]="empresa.fldDescripcion" name="fldDescripcion">
 * </app-textarea-field>
 * ```
 */
@Component({
  selector: 'app-textarea-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './textarea-field.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaFieldComponent),
      multi: true,
    },
  ],
})
export class TextareaFieldComponent implements ControlValueAccessor {
  label = input('');
  placeholder = input('');
  required = input(false);
  invalid = input(false);
  errorMessage = input('');
  rows = input(3);
  id = input(`textarea-field-${uniqueId++}`);

  disabled = signal(false);
  value = signal('');

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  handleInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.value.set(value);
    this.onChange(value);
  }

  handleBlur(): void {
    this.onTouched();
  }
}
