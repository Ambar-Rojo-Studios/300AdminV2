import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { NavigationEventsService } from '../../../services/navigation-events.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './login-acceso-usuario.component.html',
  styleUrls: ['./login-acceso-usuario.component.css']
})
/**
 * Componente de login para usuarios administradores.
 * Gestiona acceso al panel y mensajes de estado durante la autenticación.
 */
export class LoginComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly navigationEvents = inject(NavigationEventsService);
  private readonly router = inject(Router);

  // Signals para reactividad
  loginForm = signal<FormGroup>(this.createForm());
  mensajeError = signal<string>('');
  mensajeExito = signal<string>('');
  cargando = signal<boolean>(false);

  private destroy$ = new Subject<void>();

  private createForm(): FormGroup {
    return this.fb.group({
      fldCorreoElectronico: ['', [Validators.required, Validators.email]],
      fldContrasenia: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  ngOnInit(): void {}

  login(): void {
    this.mensajeError.set('');
    this.mensajeExito.set('');

    const form = this.loginForm();
    if (form.invalid) {
      this.mensajeError.set('Por favor, completa todos los campos correctamente.');
      this.markFormGroupTouched(form);
      return;
    }

    this.cargando.set(true);

    this.authService.iniciarSesion(form.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.cargando.set(false);
          this.mensajeExito.set('Inicio de sesión exitoso.');
          const userRole = this.authService.obtenerRol();
          if (userRole === 'usuario') {
            this.navigationEvents.openAdminMenu();
          } else {
            this.router.navigate(['/unauthorized']);
          }
        },
        error: (error) => {
          this.cargando.set(false);
          this.mensajeError.set(error.error?.message || 'Error en el inicio de sesión. Credenciales incorrectas o problemas del servidor.');
        }
      });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  get email() { return this.loginForm().get('fldCorreoElectronico'); }
  get password() { return this.loginForm().get('fldContrasenia'); }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
