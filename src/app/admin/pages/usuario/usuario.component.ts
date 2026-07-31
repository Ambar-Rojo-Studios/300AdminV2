import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { UsuarioService } from '../../../services/usuario.service';
import { UsuarioCreateDTO, UsuarioEditDTO, UsuarioLisDTO } from '../../../models/usuario.model';
import { ToastService } from '../../../shared/services/toast.service';

import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/modal/confirm-dialog.component';
import { TextFieldComponent } from '../../../shared/components/form-fields/text-field.component';
import { SelectFieldComponent, SelectOption } from '../../../shared/components/form-fields/select-field.component';
import { SortDirection, SortEvent, TableColumn } from '../../../shared/models/table.model';

/**
 * Página admin de Usuarios (Etapa 3, CRUD bloque B). Mismo patrón que
 * marca/empresa: tabla + modal genéricos. Extiende cuentas-botanero: aquí
 * se administran TODOS los usuarios (ADMIN y BOTANERO), con edición.
 */
@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTableComponent,
    ModalComponent,
    ConfirmDialogComponent,
    TextFieldComponent,
    SelectFieldComponent,
  ],
  templateUrl: './usuario.component.html',
})
export class UsuarioComponent implements OnInit {
  usuarios = signal<UsuarioLisDTO[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  isDeleting = signal(false);

  showFormModal = signal(false);
  showDeleteModal = signal(false);
  modalMode = signal<'create' | 'edit'>('create');

  sortKey = signal<string | null>(null);
  sortDirection = signal<SortDirection>(null);

  usuario = signal<UsuarioCreateDTO | UsuarioEditDTO>(this.getEmptyUsuario());
  usuarioAEliminar = signal<UsuarioLisDTO | null>(null);

  rolOptions: SelectOption[] = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'BOTANERO', label: 'Botanero' },
  ];

  columns: TableColumn<UsuarioLisDTO>[] = [
    { key: 'idUsuario', label: 'ID', width: '80px' },
    { key: 'fldNombre', label: 'Nombre', sortable: true },
    { key: 'fldCorreoElectronico', label: 'Correo', sortable: true },
    { key: 'fldTelefono', label: 'Teléfono' },
    { key: 'fldRol', label: 'Rol', format: (row) => row.fldRol ?? 'ADMIN' },
  ];

  modalTitle = computed(() => (this.modalMode() === 'create' ? 'Crear usuario' : 'Editar usuario'));

  usuariosOrdenados = computed<UsuarioLisDTO[]>(() => {
    const key = this.sortKey();
    const direction = this.sortDirection();
    const lista = this.usuarios();
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

  constructor(
    private usuarioService: UsuarioService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.obtenerUsuarios();
  }

  private obtenerUsuarios(): void {
    this.isLoading.set(true);
    this.usuarioService.obtenerUsuarios(1, 10000).subscribe({
      next: (r) => {
        this.usuarios.set(r.cuerpoDeRespuesta ?? []);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.usuarios.set([]);
        this.toastService.showError(`Error al cargar usuarios: ${err.message || 'Error de conexión'}`);
      },
    });
  }

  onSortChange(evento: SortEvent): void {
    this.sortKey.set(evento.direction ? evento.key : null);
    this.sortDirection.set(evento.direction);
  }

  abrirModalCrear(): void {
    this.modalMode.set('create');
    this.usuario.set(this.getEmptyUsuario());
    this.showFormModal.set(true);
  }

  abrirModalEditar(usuario: UsuarioLisDTO): void {
    this.modalMode.set('edit');
    this.usuario.set({ ...usuario, fldContrasenia: '' });
    this.showFormModal.set(true);
  }

  abrirModalEliminar(usuario: UsuarioLisDTO): void {
    this.usuarioAEliminar.set(usuario);
    this.showDeleteModal.set(true);
  }

  cerrarModalFormulario(): void {
    this.showFormModal.set(false);
  }

  cerrarModalEliminar(): void {
    this.showDeleteModal.set(false);
    this.usuarioAEliminar.set(null);
  }

  onSubmit(form: NgForm): void {
    if (!form.valid) {
      this.toastService.showError('Completa todos los campos obligatorios.');
      return;
    }

    this.isSaving.set(true);

    if (this.modalMode() === 'create') {
      const payload = { ...this.usuario(), idUsuario: 0 } as UsuarioCreateDTO;
      this.usuarioService.crearUsuario(payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toastService.showSuccess('Usuario creado correctamente.');
          this.obtenerUsuarios();
          this.cerrarModalFormulario();
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.toastService.showError(`No se pudo crear el usuario: ${err.error?.mensaje || err.message}`);
        },
      });
    } else {
      this.usuarioService.editarUsuario(this.usuario() as UsuarioEditDTO).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toastService.showSuccess('Usuario actualizado correctamente.');
          this.obtenerUsuarios();
          this.cerrarModalFormulario();
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.toastService.showError(`Error al actualizar usuario: ${err.error?.mensaje || err.message}`);
        },
      });
    }
  }

  confirmarEliminar(): void {
    const usuario = this.usuarioAEliminar();
    if (!usuario) return;

    this.isDeleting.set(true);
    this.usuarioService.eliminarUsuario(usuario.idUsuario).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.toastService.showSuccess('Usuario eliminado correctamente.');
        this.obtenerUsuarios();
        this.cerrarModalEliminar();
      },
      error: (err: HttpErrorResponse) => {
        this.isDeleting.set(false);
        this.toastService.showError(`Error al eliminar usuario: ${err.error?.mensaje || err.message}`);
        this.cerrarModalEliminar();
      },
    });
  }

  private getEmptyUsuario(): UsuarioCreateDTO {
    return {
      idUsuario: 0,
      fldNombre: '',
      fldTelefono: '',
      fldCorreoElectronico: '',
      fldContrasenia: '',
      fldRol: 'ADMIN',
      fkIdEmpresa: null,
    };
  }
}
