import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { MarcasService } from '../../../services/marca.service';
import { ApiResponseMarca, MarcaCreateDTO, MarcaEditDTO, MarcaListDTO } from '../../../models/marcas.model';
import { ToastService } from '../../../shared/services/toast.service';

import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/modal/confirm-dialog.component';
import { TextFieldComponent } from '../../../shared/components/form-fields/text-field.component';
import { TextareaFieldComponent } from '../../../shared/components/form-fields/textarea-field.component';
import { SortDirection, SortEvent, TableColumn } from '../../../shared/models/table.model';

/**
 * Página admin de Marca (Etapa 3). Mismo patrón que empresa: tabla + modal
 * genéricos, cero CSS propio. CRUD simple, sin archivos.
 */
@Component({
  selector: 'app-marca',
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
  templateUrl: './marca.component.html',
})
export class MarcaComponent implements OnInit {
  marcas = signal<MarcaListDTO[]>([]);
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

  marca = signal<MarcaCreateDTO | MarcaEditDTO>(this.getEmptyMarca());
  marcaAEliminar = signal<MarcaListDTO | null>(null);

  columns: TableColumn<MarcaListDTO>[] = [
    { key: 'idMarca', label: 'ID', width: '80px' },
    { key: 'fldNombre', label: 'Nombre', sortable: true },
    { key: 'fldDescripcion', label: 'Descripción' },
  ];

  modalTitle = computed(() => (this.modalMode() === 'create' ? 'Crear marca' : 'Editar marca'));

  marcasOrdenadas = computed<MarcaListDTO[]>(() => {
    const key = this.sortKey();
    const direction = this.sortDirection();
    const lista = this.marcas();
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
    private marcasService: MarcasService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.obtenerMarcas();
  }

  private obtenerMarcas(): void {
    this.isLoading.set(true);
    this.marcasService.obtenerMarcas(this.currentPage(), this.pageSize).subscribe({
      next: (response: ApiResponseMarca<MarcaListDTO[]>) => {
        if (response?.codigoEstatus === 1 && Array.isArray(response.cuerpoDeRespuesta)) {
          const marcas = response.cuerpoDeRespuesta;
          this.marcas.set(marcas);
          this.totalPages.set(marcas.length < this.pageSize ? this.currentPage() : this.currentPage() + 1);
        } else {
          this.marcas.set([]);
          this.totalPages.set(1);
          this.toastService.showError(response?.mensaje || 'Error al cargar marcas.');
        }
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.marcas.set([]);
        this.totalPages.set(1);
        this.toastService.showError(`Error al cargar marcas: ${err.message || 'Error de conexión'}`);
      },
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.obtenerMarcas();
  }

  onSortChange(evento: SortEvent): void {
    this.sortKey.set(evento.direction ? evento.key : null);
    this.sortDirection.set(evento.direction);
  }

  abrirModalCrear(): void {
    this.modalMode.set('create');
    this.marca.set(this.getEmptyMarca());
    this.showFormModal.set(true);
  }

  abrirModalEditar(marca: MarcaListDTO): void {
    this.modalMode.set('edit');
    this.marca.set({ ...marca });
    this.showFormModal.set(true);
  }

  abrirModalEliminar(marca: MarcaListDTO): void {
    this.marcaAEliminar.set(marca);
    this.showDeleteModal.set(true);
  }

  cerrarModalFormulario(): void {
    this.showFormModal.set(false);
  }

  cerrarModalEliminar(): void {
    this.showDeleteModal.set(false);
    this.marcaAEliminar.set(null);
  }

  onSubmit(form: NgForm): void {
    if (!form.valid) {
      this.toastService.showError('Completa todos los campos obligatorios.');
      return;
    }

    this.isSaving.set(true);

    if (this.modalMode() === 'create') {
      const payload = { ...this.marca(), idMarca: null } as MarcaCreateDTO;
      this.marcasService.crearMarca(payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toastService.showSuccess('Marca creada correctamente.');
          this.obtenerMarcas();
          this.cerrarModalFormulario();
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.toastService.showError(`No se pudo crear la marca: ${err.error?.mensaje || err.message}`);
        },
      });
    } else {
      this.marcasService.editarMarca(this.marca() as MarcaEditDTO).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toastService.showSuccess('Marca actualizada correctamente.');
          this.obtenerMarcas();
          this.cerrarModalFormulario();
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.toastService.showError(`Error al actualizar marca: ${err.error?.mensaje || err.message}`);
        },
      });
    }
  }

  confirmarEliminar(): void {
    const marca = this.marcaAEliminar();
    if (!marca) return;

    this.isDeleting.set(true);
    this.marcasService.eliminarMarca(marca.idMarca).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.toastService.showSuccess('Marca eliminada correctamente.');
        if (this.marcas().length === 1 && this.currentPage() > 1) {
          this.currentPage.update((p) => p - 1);
        }
        this.obtenerMarcas();
        this.cerrarModalEliminar();
      },
      error: (err: HttpErrorResponse) => {
        this.isDeleting.set(false);
        this.toastService.showError(`Error al eliminar marca: ${err.error?.mensaje || err.message}`);
        this.cerrarModalEliminar();
      },
    });
  }

  private getEmptyMarca(): MarcaCreateDTO {
    return {
      idMarca: null,
      fldNombre: '',
      fldDescripcion: '',
    };
  }
}
