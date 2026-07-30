import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { UsuarioService } from '../../../services/usuario.service';
import { EmpresasService } from '../../../services/empresa.service';
import { UsuarioCreateDTO, UsuarioLisDTO } from '../../../models/usuario.model';
import { ListEmpresaDTO } from '../../../models/empresa.model';
import { ToastService } from '../../../shared/services/toast.service';

import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/modal/confirm-dialog.component';
import { TextFieldComponent } from '../../../shared/components/form-fields/text-field.component';
import { SelectFieldComponent, SelectOption } from '../../../shared/components/form-fields/select-field.component';
import { SortDirection, SortEvent, TableColumn } from '../../../shared/models/table.model';

/**
 * Página admin de Cuentas de botanero (Etapa 3, migrada al kit UI compartido).
 * Mismo patrón que marca/empresa: tabla + modal genéricos, cero CSS propio.
 *
 * Mantiene EXACTAMENTE el mismo alcance funcional que la versión anterior:
 * solo crear y eliminar cuentas con rol BOTANERO (no hay edición, el backend
 * expone /usuario/edit pero esta pantalla nunca lo usó). El único cambio de
 * comportamiento es cambiar el window.confirm() nativo por <app-confirm-dialog>.
 */
@Component({
  selector: 'app-cuentas-botanero',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DataTableComponent,
    ModalComponent,
    ConfirmDialogComponent,
    TextFieldComponent,
    SelectFieldComponent,
  ],
  templateUrl: './cuentas-botanero.component.html',
})
export class CuentasBotaneroComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly empresasService = inject(EmpresasService);
  private readonly toastService = inject(ToastService);

  cuentas = signal<UsuarioLisDTO[]>([]);
  empresas = signal<ListEmpresaDTO[]>([]);

  isLoading = signal(false);
  isSaving = signal(false);
  isDeleting = signal(false);

  showFormModal = signal(false);
  showDeleteModal = signal(false);
  cuentaAEliminar = signal<UsuarioLisDTO | null>(null);

  sortKey = signal<string | null>(null);
  sortDirection = signal<SortDirection>(null);

  form = this.fb.nonNullable.group({
    fldNombre: ['', Validators.required],
    fldTelefono: ['', Validators.required],
    fldCorreoElectronico: ['', [Validators.required, Validators.email]],
    fldContrasenia: ['', [Validators.required, Validators.minLength(8)]],
    fkIdEmpresa: [null as number | null, Validators.required],
  });

  columns: TableColumn<UsuarioLisDTO>[] = [
    { key: 'fldNombre', label: 'Nombre', sortable: true },
    { key: 'fldCorreoElectronico', label: 'Correo', sortable: true },
    { key: 'fldTelefono', label: 'Teléfono' },
    { key: 'fkIdEmpresa', label: 'Empresa', format: (row) => this.nombreEmpresa(row.fkIdEmpresa) },
  ];

  empresaOptions = computed<SelectOption[]>(() =>
    this.empresas().map((e) => ({ value: e.idEmpresa, label: e.fldNombre }))
  );

  cuentasOrdenadas = computed<UsuarioLisDTO[]>(() => {
    const key = this.sortKey();
    const direction = this.sortDirection();
    const lista = this.cuentas();
    if (!key || !direction) return lista;

    const copia = [...lista];
    copia.sort((a, b) => {
      const comparacion = String((a as any)[key] ?? '').localeCompare(String((b as any)[key] ?? ''), 'es', {
        sensitivity: 'base',
      });
      return direction === 'asc' ? comparacion : -comparacion;
    });
    return copia;
  });

  ngOnInit(): void {
    this.cargarCuentas();
    this.empresasService.obtenerEmpresas(1, 10000).subscribe({
      next: (r) => this.empresas.set(r.cuerpoDeRespuesta ?? []),
      error: () => this.toastService.showError('No se pudieron cargar las empresas.'),
    });
  }

  private cargarCuentas(): void {
    this.isLoading.set(true);
    this.usuarioService.obtenerUsuarios(1, 10000).subscribe({
      next: (r) => {
        const usuarios = r.cuerpoDeRespuesta ?? [];
        this.cuentas.set(usuarios.filter((u) => u.fldRol === 'BOTANERO'));
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.toastService.showError(`Error al cargar cuentas: ${err.message || 'Error de conexión'}`);
      },
    });
  }

  onSortChange(evento: SortEvent): void {
    this.sortKey.set(evento.direction ? evento.key : null);
    this.sortDirection.set(evento.direction);
  }

  nombreEmpresa(id?: number | null): string {
    return this.empresas().find((e) => e.idEmpresa === Number(id))?.fldNombre ?? '—';
  }

  abrirModalCrear(): void {
    this.form.reset({
      fldNombre: '',
      fldTelefono: '',
      fldCorreoElectronico: '',
      fldContrasenia: '',
      fkIdEmpresa: null,
    });
    this.showFormModal.set(true);
  }

  cerrarModalFormulario(): void {
    this.showFormModal.set(false);
  }

  abrirModalEliminar(cuenta: UsuarioLisDTO): void {
    this.cuentaAEliminar.set(cuenta);
    this.showDeleteModal.set(true);
  }

  cerrarModalEliminar(): void {
    this.showDeleteModal.set(false);
    this.cuentaAEliminar.set(null);
  }

  crear(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.showError('Completa todos los campos obligatorios.');
      return;
    }

    this.isSaving.set(true);
    const payload: UsuarioCreateDTO = {
      idUsuario: 0,
      ...this.form.getRawValue(),
      fkIdEmpresa: Number(this.form.getRawValue().fkIdEmpresa),
      fldRol: 'BOTANERO',
    };

    this.usuarioService.crearUsuario(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toastService.showSuccess('Cuenta de botanero creada correctamente.');
        this.cargarCuentas();
        this.cerrarModalFormulario();
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.toastService.showError(`No se pudo crear la cuenta: ${err.error?.mensaje || err.message}`);
      },
    });
  }

  confirmarEliminar(): void {
    const cuenta = this.cuentaAEliminar();
    if (!cuenta) return;

    this.isDeleting.set(true);
    this.usuarioService.eliminarUsuario(cuenta.idUsuario).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.toastService.showSuccess('Cuenta eliminada correctamente.');
        this.cargarCuentas();
        this.cerrarModalEliminar();
      },
      error: (err: HttpErrorResponse) => {
        this.isDeleting.set(false);
        this.toastService.showError(`Error al eliminar la cuenta: ${err.error?.mensaje || err.message}`);
        this.cerrarModalEliminar();
      },
    });
  }

  isInvalido(control: string): boolean {
    const c = this.form.get(control);
    return !!c && c.invalid && c.touched;
  }
}
