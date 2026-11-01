import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ResetPasswordServices } from '../../services/reset-password.services';
import { RecoveryStateService } from '../../services/recovery-state.service';

@Component({
  selector: 'app-reset-password', standalone: true, imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.component.html', styleUrl: '../recovery.css',
})
export class ResetPasswordComponent {
  readonly state = inject(RecoveryStateService);
  private readonly service = inject(ResetPasswordServices);
  private readonly destroyRef = inject(DestroyRef);
  readonly isLoading = signal(false);
  readonly error = signal('');
  readonly completado = signal(false);
  password = '';
  confirmacion = '';
  mostrarPassword = false;

  guardar(form: NgForm) {
    if (this.isLoading() || form.invalid || this.password !== this.confirmacion || !this.state.token()) {
      form.control.markAllAsTouched(); return;
    }
    this.isLoading.set(true);
    this.error.set('');
    this.service.crearResetPassword({ token: this.state.token()!, newPassword: this.password }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.password = ''; this.confirmacion = '';
        this.state.limpiar(); this.completado.set(true);
      },
      error: () => { this.isLoading.set(false); this.error.set('No pudimos cambiar la contraseña. El enlace puede haber vencido; solicita otro código.'); }
    });
  }
}
