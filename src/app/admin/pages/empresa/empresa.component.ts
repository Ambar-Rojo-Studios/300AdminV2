import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { EmpresasService } from '../../../services/empresa.service';
import { ApiResponse, CreateEmpresaDTO, EditEmpresaDTO, ListEmpresaDTO } from '../../../models/empresa.model';
import { ToastService } from '../../../shared/services/toast.service';

import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/modal/confirm-dialog.component';
import { TextFieldComponent } from '../../../shared/components/form-fields/text-field.component';
import { TextareaFieldComponent } from '../../../shared/components/form-fields/textarea-field.component';
import { SortDirection, SortEvent, TableColumn } from '../../../shared/models/table.model';

/**
 * Página de empresas — es la "página de prueba" del kit UI (E1) que el
 * ticket sugería ("p. ej. empresas") y que la Etapa 3 da por hecha si ya
 * existe aquí. Usa <app-data-table> + <app-modal>/<app-confirm-dialog> +
 * form-fields. No tiene CSS propio.
 */
@Component({
  selector: 'app-empresa',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTableComponent,
    ModalComponent,
    ConfirmDialogComponent,
    TextFieldComponent,
    TextareaFieldComponent,
  ],
  templateUrl: './empresa.component.html',
})
export class EmpresaComponent implements OnInit {
  empresas = signal<ListEmpresaDTO[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  isDeleting = signal(false);

  showFormModal = signal(false);
  showDeleteModal = signal(false);
  modalMode = signal<'create' | 'edit'>('create');

  currentPage = signal(1); // 1-indexado, como espera <app-data-table>
  pageSize = 10;
  totalPages = signal(1);

  sortKey = signal<string | null>(null);
  sortDirection = signal<SortDirection>(null);

  empresa = signal<CreateEmpresaDTO | EditEmpresaDTO>(this.getEmptyEmpresa());
  empresaAEliminar = signal<ListEmpresaDTO | null>(null);

  columns: TableColumn<ListEmpresaDTO>[] = [
    { key: 'idEmpresa', label: 'ID', width: '80px' },
    { key: 'fldNombre', label: 'Nombre', sortable: true },
    { key: 'fldCiudad', label: 'Ciudad', sortable: true },
    { key: 'fldEstado', label: 'Estado', sortable: true },
    { key: 'fldTelefono', label: 'Teléfono' },
    { key: 'fldCorreoElectronico', label: 'Correo' },
  ];

  modalTitle = computed(() => (this.modalMode() === 'create' ? 'Crear empresa' : 'Editar empresa'));

  empresasOrdenadas = computed<ListEmpresaDTO[]>(() => {
    const key = this.sortKey();
    const direction = this.sortDirection();
    const lista = this.empresas();
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
    private empresasService: EmpresasService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.obtenerEmpresas();
  }

  private obtenerEmpresas(): void {
    this.isLoading.set(true);
    this.empresasService.obtenerEmpresas(this.currentPage(), this.pageSize).subscribe({
      next: (response: ApiResponse<ListEmpresaDTO[]>) => {
        if (response?.codigoEstatus === 1 && Array.isArray(response.cuerpoDeRespuesta)) {
          const empresas = response.cuerpoDeRespuesta;
          this.empresas.set(empresas);
          this.totalPages.set(empresas.length < this.pageSize ? this.currentPage() : this.currentPage() + 1);
        } else {
          this.empresas.set([]);
          this.totalPages.set(1);
          this.toastService.showError(response?.mensaje || 'Error al cargar empresas.');
        }
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.empresas.set([]);
        this.totalPages.set(1);
        this.toastService.showError(`Error al cargar empresas: ${err.message || 'Error de conexión'}`);
      },
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.obtenerEmpresas();
  }

  onSortChange(evento: SortEvent): void {
    this.sortKey.set(evento.direction ? evento.key : null);
    this.sortDirection.set(evento.direction);
  }

  abrirModalCrear(): void {
    this.modalMode.set('create');
    this.empresa.set(this.getEmptyEmpresa());
    this.showFormModal.set(true);
  }

  abrirModalEditar(empresa: ListEmpresaDTO): void {
    this.modalMode.set('edit');
    this.empresa.set({ ...empresa });
    this.showFormModal.set(true);
  }

  abrirModalEliminar(empresa: ListEmpresaDTO): void {
    this.empresaAEliminar.set(empresa);
    this.showDeleteModal.set(true);
  }

  cerrarModalFormulario(): void {
    this.showFormModal.set(false);
  }

  cerrarModalEliminar(): void {
    this.showDeleteModal.set(false);
    this.empresaAEliminar.set(null);
  }

  onSubmit(form: NgForm): void {
    if (!form.valid) {
      this.toastService.showError('Completa todos los campos obligatorios.');
      return;
    }

    const now = new Date().toISOString().split('T')[0];
    const empresa = { ...this.empresa(), fldFechaUltimaModificacion: now };
    this.isSaving.set(true);

    if (this.modalMode() === 'create') {
      const payload = { ...empresa, fldFechaCreacion: now } as CreateEmpresaDTO;
      this.empresasService.crearEmpresa(payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toastService.showSuccess('Empresa creada correctamente.');
          this.obtenerEmpresas();
          this.cerrarModalFormulario();
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.toastService.showError(`No se pudo crear la empresa: ${err.error?.mensaje || err.message}`);
        },
      });
    } else {
      this.empresasService.editarEmpresa(empresa as EditEmpresaDTO).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toastService.showSuccess('Empresa actualizada correctamente.');
          this.obtenerEmpresas();
          this.cerrarModalFormulario();
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.toastService.showError(`Error al actualizar empresa: ${err.error?.mensaje || err.message}`);
        },
      });
    }
  }

  confirmarEliminar(): void {
    const empresa = this.empresaAEliminar();
    if (!empresa) return;

    this.isDeleting.set(true);
    this.empresasService.eliminarEmpresa(empresa.idEmpresa).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.toastService.showSuccess('Empresa eliminada correctamente.');
        if (this.empresas().length === 1 && this.currentPage() > 1) {
          this.currentPage.update((p) => p - 1);
        }
        this.obtenerEmpresas();
        this.cerrarModalEliminar();
      },
      error: (err: HttpErrorResponse) => {
        this.isDeleting.set(false);
        this.toastService.showError(`Error al eliminar empresa: ${err.error?.mensaje || err.message}`);
        this.cerrarModalEliminar();
      },
    });
  }

  private getEmptyEmpresa(): CreateEmpresaDTO {
    return {
      idEmpresa: 0,
      fldNombre: '',
      fldDescripcion: '',
      fldTelefono: '',
      fldCorreoElectronico: '',
      fldEstado: '',
      fldCiudad: '',
      fldDireccion: '',
      fldFechaCreacion: '',
      fldFechaUltimaModificacion: '',
    };
  }
}
