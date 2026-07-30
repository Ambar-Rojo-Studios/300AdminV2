import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { TiposEstablecimientoService } from '../../../services/tipo-establecimiento.service';
import {
  ApiResponseTipoEstablecimiento,
  CreateTipoEstablecimientoDTO,
  EditTipoEstablecimientoDTO,
  ListTipoEstablecimientoDTO,
} from '../../../models/tipo_establecimiento.model';
import { ToastService } from '../../../shared/services/toast.service';

import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/modal/confirm-dialog.component';
import { TextFieldComponent } from '../../../shared/components/form-fields/text-field.component';
import { TextareaFieldComponent } from '../../../shared/components/form-fields/textarea-field.component';
import { SortDirection, SortEvent, TableColumn } from '../../../shared/models/table.model';

/**
 * Página admin de Tipos de establecimiento (categorías: restaurante, bar,
 * botanero, etc.). Mismo patrón que empresa/marca: tabla + modal genéricos.
 */
@Component({
  selector: 'app-tipos-establecimientos',
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
  templateUrl: './tipos-establecimientos.component.html',
})
export class TiposEstablecimientosComponent implements OnInit {
  tipos = signal<ListTipoEstablecimientoDTO[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  isDeleting = signal(false);

  showFormModal = signal(false);
  showDeleteModal = signal(false);
  modalMode = signal<'create' | 'edit'>('create');

  currentPage = signal(1);
  pageSize = 10;
  totalPages = signal(1);

  sortKey = signal<string | null>(null);
  sortDirection = signal<SortDirection>(null);

  tipo = signal<CreateTipoEstablecimientoDTO | EditTipoEstablecimientoDTO>(this.getEmptyTipo());
  tipoAEliminar = signal<ListTipoEstablecimientoDTO | null>(null);

  columns: TableColumn<ListTipoEstablecimientoDTO>[] = [
    { key: 'idTipoEstablecimiento', label: 'ID', width: '80px' },
    { key: 'fldNombre', label: 'Nombre', sortable: true },
    { key: 'fldDescripcion', label: 'Descripción' },
  ];

  modalTitle = computed(() => (this.modalMode() === 'create' ? 'Crear tipo de establecimiento' : 'Editar tipo de establecimiento'));

  tiposOrdenados = computed<ListTipoEstablecimientoDTO[]>(() => {
    const key = this.sortKey();
    const direction = this.sortDirection();
    const lista = this.tipos();
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
    private tiposService: TiposEstablecimientoService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.obtenerTipos();
  }

  private obtenerTipos(): void {
    this.isLoading.set(true);
    this.tiposService.obtenerTipos(this.currentPage(), this.pageSize).subscribe({
      next: (response: ApiResponseTipoEstablecimiento<ListTipoEstablecimientoDTO[]>) => {
        if (response?.codigoEstatus === 1 && Array.isArray(response.cuerpoDeRespuesta)) {
          const tipos = response.cuerpoDeRespuesta;
          this.tipos.set(tipos);
          this.totalPages.set(tipos.length < this.pageSize ? this.currentPage() : this.currentPage() + 1);
        } else {
          this.tipos.set([]);
          this.totalPages.set(1);
          this.toastService.showError(response?.mensaje || 'Error al cargar tipos de establecimiento.');
        }
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.tipos.set([]);
        this.totalPages.set(1);
        this.toastService.showError(`Error al cargar tipos de establecimiento: ${err.message || 'Error de conexión'}`);
      },
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.obtenerTipos();
  }

  onSortChange(evento: SortEvent): void {
    this.sortKey.set(evento.direction ? evento.key : null);
    this.sortDirection.set(evento.direction);
  }

  abrirModalCrear(): void {
    this.modalMode.set('create');
    this.tipo.set(this.getEmptyTipo());
    this.showFormModal.set(true);
  }

  abrirModalEditar(tipo: ListTipoEstablecimientoDTO): void {
    this.modalMode.set('edit');
    this.tipo.set({ ...tipo });
    this.showFormModal.set(true);
  }

  abrirModalEliminar(tipo: ListTipoEstablecimientoDTO): void {
    this.tipoAEliminar.set(tipo);
    this.showDeleteModal.set(true);
  }

  cerrarModalFormulario(): void {
    this.showFormModal.set(false);
  }

  cerrarModalEliminar(): void {
    this.showDeleteModal.set(false);
    this.tipoAEliminar.set(null);
  }

  onSubmit(form: NgForm): void {
    if (!form.valid) {
      this.toastService.showError('Completa todos los campos obligatorios.');
      return;
    }

    this.isSaving.set(true);

    if (this.modalMode() === 'create') {
      const payload = { ...this.tipo(), idTipoEstablecimiento: 0 } as CreateTipoEstablecimientoDTO;
      this.tiposService.crearTipo(payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toastService.showSuccess('Tipo de establecimiento creado correctamente.');
          this.obtenerTipos();
          this.cerrarModalFormulario();
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.toastService.showError(`No se pudo crear el tipo: ${err.error?.mensaje || err.message}`);
        },
      });
    } else {
      this.tiposService.editarTipo(this.tipo() as EditTipoEstablecimientoDTO).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toastService.showSuccess('Tipo de establecimiento actualizado correctamente.');
          this.obtenerTipos();
          this.cerrarModalFormulario();
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.toastService.showError(`Error al actualizar el tipo: ${err.error?.mensaje || err.message}`);
        },
      });
    }
  }

  confirmarEliminar(): void {
    const tipo = this.tipoAEliminar();
    if (!tipo) return;

    this.isDeleting.set(true);
    this.tiposService.eliminarTipo(tipo.idTipoEstablecimiento).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.toastService.showSuccess('Tipo de establecimiento eliminado correctamente.');
        if (this.tipos().length === 1 && this.currentPage() > 1) {
          this.currentPage.update((p) => p - 1);
        }
        this.obtenerTipos();
        this.cerrarModalEliminar();
      },
      error: (err: HttpErrorResponse) => {
        this.isDeleting.set(false);
        this.toastService.showError(`Error al eliminar el tipo: ${err.error?.mensaje || err.message}`);
        this.cerrarModalEliminar();
      },
    });
  }

  private getEmptyTipo(): CreateTipoEstablecimientoDTO {
    return {
      idTipoEstablecimiento: 0,
      fldNombre: '',
      fldDescripcion: '',
    };
  }
}
