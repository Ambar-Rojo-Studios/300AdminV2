import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioService } from '../../../services/usuario.service';
import { EmpresasService } from '../../../services/empresa.service';
import { UsuarioLisDTO, UsuarioCreateDTO } from '../../../models/usuario.model';
import { ListEmpresaDTO } from '../../../models/empresa.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../shared/services/toast.service';

// ponytail: tabla y modal planos; migrar a la tabla/modal genericos del kit UI cuando Ma. Fernanda los entregue
@Component({
  selector: 'app-cuentas-botanero',
  standalone: true,
  imports: [ReactiveFormsModule, LoadingSpinnerComponent],
  template: `
    <header class="pagina-header">
      <h1>Cuentas de botaneros</h1>
      <button type="button" (click)="mostrarForm.set(!mostrarForm())">
        {{ mostrarForm() ? 'Cancelar' : 'Nueva cuenta' }}
      </button>
    </header>

    @if (mostrarForm()) {
      <form [formGroup]="form" (ngSubmit)="crear()" class="form-cuenta">
        <label>Nombre <input formControlName="fldNombre" /></label>
        <label>Teléfono <input formControlName="fldTelefono" /></label>
        <label>Correo <input type="email" formControlName="fldCorreoElectronico" /></label>
        <label>Contraseña <input type="password" formControlName="fldContrasenia" /></label>
        <label>
          Empresa
          <select formControlName="fkIdEmpresa">
            <option [value]="null" disabled>Selecciona la empresa…</option>
            @for (e of empresas(); track e.idEmpresa) {
              <option [value]="e.idEmpresa">{{ e.fldNombre }}</option>
            }
          </select>
        </label>
        <button type="submit" [disabled]="form.invalid || guardando()">
          {{ guardando() ? 'Guardando…' : 'Crear cuenta' }}
        </button>
      </form>
    }

    @if (cargando()) {
      <app-loading-spinner />
    } @else if (cuentas().length === 0) {
      <p class="pendiente">No hay cuentas de botanero todavía.</p>
    } @else {
      <table class="tabla-cuentas">
        <thead>
          <tr><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Empresa</th><th></th></tr>
        </thead>
        <tbody>
          @for (u of cuentas(); track u.idUsuario) {
            <tr>
              <td>{{ u.fldNombre }}</td>
              <td>{{ u.fldCorreoElectronico }}</td>
              <td>{{ u.fldTelefono }}</td>
              <td>{{ nombreEmpresa(u.fkIdEmpresa) }}</td>
              <td><button type="button" (click)="eliminar(u)">Eliminar</button></td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: `
    .pagina-header { display: flex; justify-content: space-between; align-items: center; }
    .form-cuenta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin: 1rem 0 2rem;
      padding: 1rem;
      border: 1px solid var(--border, #e5e5e5);
      border-radius: 8px;
    }
    .form-cuenta label { display: flex; flex-direction: column; gap: 0.25rem; }
    .tabla-cuentas { width: 100%; border-collapse: collapse; }
    .tabla-cuentas th, .tabla-cuentas td {
      text-align: left;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--border, #e5e5e5);
    }
    .pendiente { color: var(--text-muted, #666); }
  `
})
export class CuentasBotaneroComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly empresasService = inject(EmpresasService);
  private readonly toast = inject(ToastService);

  cuentas = signal<UsuarioLisDTO[]>([]);
  empresas = signal<ListEmpresaDTO[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  mostrarForm = signal(false);

  form = this.fb.nonNullable.group({
    fldNombre: ['', Validators.required],
    fldTelefono: ['', Validators.required],
    fldCorreoElectronico: ['', [Validators.required, Validators.email]],
    fldContrasenia: ['', [Validators.required, Validators.minLength(8)]],
    fkIdEmpresa: [null as number | null, Validators.required]
  });

  ngOnInit(): void {
    this.cargarCuentas();
    this.empresasService.obtenerEmpresas(1, 10000).subscribe({
      next: (r) => this.empresas.set(r.cuerpoDeRespuesta ?? []),
      error: () => this.toast.showError('No se pudieron cargar las empresas')
    });
  }

  private cargarCuentas(): void {
    this.cargando.set(true);
    this.usuarioService.obtenerUsuarios(1, 10000).subscribe({
      next: (r) => {
        const usuarios = r.cuerpoDeRespuesta ?? [];
        this.cuentas.set(usuarios.filter(u => u.fldRol === 'BOTANERO'));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  nombreEmpresa(id?: number | null): string {
    return this.empresas().find(e => e.idEmpresa === Number(id))?.fldNombre ?? '—';
  }

  crear(): void {
    if (this.form.invalid) return;
    this.guardando.set(true);
    const payload: UsuarioCreateDTO = {
      idUsuario: 0,
      ...this.form.getRawValue(),
      fkIdEmpresa: Number(this.form.getRawValue().fkIdEmpresa),
      fldRol: 'BOTANERO'
    };
    this.usuarioService.crearUsuario(payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarForm.set(false);
        this.form.reset();
        this.toast.showSuccess('Cuenta de botanero creada');
        this.cargarCuentas();
      },
      error: () => {
        this.guardando.set(false);
        this.toast.showError('No se pudo crear la cuenta');
      }
    });
  }

  eliminar(cuenta: UsuarioLisDTO): void {
    if (!confirm(`¿Eliminar la cuenta de ${cuenta.fldNombre}?`)) return;
    this.usuarioService.eliminarUsuario(cuenta.idUsuario).subscribe({
      next: () => this.cargarCuentas()
    });
  }
}
