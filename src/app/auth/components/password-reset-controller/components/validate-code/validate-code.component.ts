import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { validateCodeServices } from '../../services/validate-code.services';
import { RecoveryStateService } from '../../services/recovery-state.service';

@Component({
  selector: 'app-validate-code', standalone: true, imports: [FormsModule, RouterLink],
  templateUrl: './validate-code.component.html', styleUrl: '../recovery.css',
})
export class ValidateCode {
  readonly state = inject(RecoveryStateService);
  private readonly service = inject(validateCodeServices);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly isLoading = signal(false);
  readonly error = signal('');
  email = this.state.email;
  code = '';

  onValidatePassword(form: NgForm) {
    if (this.isLoading() || form.invalid) { form.control.markAllAsTouched(); return; }
    this.isLoading.set(true);
    this.error.set('');
    this.service.crearForgotPassword({ email: this.email.trim(), code: this.code.trim() }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (token) => {
        this.isLoading.set(false);
        if (!token.trim()) { this.error.set('No se pudo validar el código. Solicita uno nuevo.'); return; }
        this.state.email = this.email.trim();
        this.state.token.set(token.trim());
        void this.router.navigate(['/reset-password']);
      },
      error: () => { this.isLoading.set(false); this.error.set('El código es incorrecto o ha vencido. Revísalo o solicita uno nuevo.'); }
    });
  }
}
