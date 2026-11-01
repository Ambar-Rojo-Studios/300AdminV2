import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ForgotPasswordService } from '../../services/forgot-password.services';
import { RecoveryStateService } from '../../services/recovery-state.service';

@Component({
  selector: 'app-forgot-password', standalone: true, imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html', styleUrl: '../recovery.css',
})
export class ForgotPasswordComponent {
  readonly state = inject(RecoveryStateService);
  private readonly service = inject(ForgotPasswordService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly isLoading = signal(false);
  readonly error = signal('');
  email = this.state.email;
  readonly userType = this.route.snapshot.queryParamMap.get('tipo') === 'usuario' ? 'usuario' : 'cliente';

  onForgotPassword(form: NgForm) {
    if (this.isLoading() || form.invalid) { form.control.markAllAsTouched(); return; }
    this.isLoading.set(true);
    this.error.set('');
    const email = this.email.trim();
    this.state.iniciar(email, this.userType);
    this.service.crearForgotPassword({ email, userType: this.userType }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.isLoading.set(false); void this.router.navigate(['/validate-code']); },
      error: () => { this.isLoading.set(false); this.error.set('No pudimos enviar el código. Revisa el correo e intenta de nuevo.'); }
    });
  }
}
