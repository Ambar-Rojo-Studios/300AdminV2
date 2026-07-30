import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { CategoriaEtiquetaService } from '../../../services/categoria-etiqueta.service';
import {
  ApiResponseCategoriaEtiqueta,
  CreateCategoriaEtiquetaDTO,
  EditCategoriaEtiquetaDTO,
  ListCategoriaEtiquetaDTO,
} from '../../../models/categoria-etiqueta.model';
import { ToastService } from '../../../shared/services/toast.service';

import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/modal/confirm-dialog.component';
import { TextFieldComponent } from '../../../shared/components/form-fields/text-field.component';
import { TextareaFieldComponent } from '../../../shared/components/form-fields/textarea-field.component';
import { SortDirection, SortEvent, TableColumn } from '../../../shared/models/table.model';

/**
 * Página admin de Categoría de etiqueta (Etapa 3).
 * Nota de ruta: la ruta vieja era /admin/CategoriaEtiqueta (PascalCase);
 * la nueva es /admin/categoria-etiqueta (minúsculas), ver app.routes.ts.
 */
@Component({
  selector: 'app-categoria-etiqueta',
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
  templateUrl: './categoria-etiqueta.component.html',
})
export class CategoriaEtiquetaComponent implements OnInit {
  categorias = signal<ListCategoriaEtiquetaDTO[]>([]);
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

  categoria = signal<CreateCategoriaEtiquetaDTO | EditCategoriaEtiquetaDTO>(this.getEmptyCategoria());
  categoriaAEliminar = signal<ListCategoriaEtiquetaDTO | null>(null);

  columns: TableColumn<ListCategoriaEtiquetaDTO>[] = [
    { key: 'idCategoria', label: 'ID', width: '80px' },
    { key: 'fldNombre', label: 'Nombre', sortable: true },
    { key: 'fldDescripcion', label: 'Descripción' },
  ];

  modalTitle = computed(() => (this.modalMode() === 'create' ? 'Crear categoría de etiqueta' : 'Editar categoría de etiqueta'));

  categoriasOrdenadas = computed<ListCategoriaEtiquetaDTO[]>(() => {
    const key = this.sortKey();
    const direction = this.sortDirection();
    const lista = this.categorias();
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
    private categoriaService: CategoriaEtiquetaService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.obtenerCategorias();
  }

  private obtenerCategorias(): void {
    this.isLoading.set(true);
    this.categoriaService.obtenerCategoriasEtiquetas(this.currentPage(), this.pageSize).subscribe({
      next: (response: ApiResponseCategoriaEtiqueta<ListCategoriaEtiquetaDTO[]>) => {
        if (response?.codigoEstatus === 1 && Array.isArray(response.cuerpoDeRespuesta)) {
          const categorias = response.cuerpoDeRespuesta;
          this.categorias.set(categorias);
          this.totalPages.set(categorias.length < this.pageSize ? this.currentPage() : this.currentPage() + 1);
        } else {
          this.categorias.set([]);
          this.totalPages.set(1);
          this.toastService.showError(response?.mensaje || 'Error al cargar categorías de etiqueta.');
        }
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.categorias.set([]);
        this.totalPages.set(1);
        this.toastService.showError(`Error al cargar categorías de etiqueta: ${err.message || 'Error de conexión'}`);
      },
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.obtenerCategorias();
  }

  onSortChange(evento: SortEvent): void {
    this.sortKey.set(evento.direction ? evento.key : null);
    this.sortDirection.set(evento.direction);
  }

  abrirModalCrear(): void {
    this.modalMode.set('create');
    this.categoria.set(this.getEmptyCategoria());
    this.showFormModal.set(true);
  }

  abrirModalEditar(categoria: ListCategoriaEtiquetaDTO): void {
    this.modalMode.set('edit');
    this.categoria.set({ ...categoria });
    this.showFormModal.set(true);
  }

  abrirModalEliminar(categoria: ListCategoriaEtiquetaDTO): void {
    this.categoriaAEliminar.set(categoria);
    this.showDeleteModal.set(true);
  }

  cerrarModalFormulario(): void {
    this.showFormModal.set(false);
  }

  cerrarModalEliminar(): void {
    this.showDeleteModal.set(false);
    this.categoriaAEliminar.set(null);
  }

  onSubmit(form: NgForm): void {
    if (!form.valid) {
      this.toastService.showError('Completa todos los campos obligatorios.');
      return;
    }

    const now = new Date().toISOString();
    this.isSaving.set(true);

    if (this.modalMode() === 'create') {
      const payload: CreateCategoriaEtiquetaDTO = {
        ...this.categoria(),
        idCategoria: 0,
        fldFechaCreacion: now,
        fldFechaUltimaModificacion: now,
      };
      this.categoriaService.crearCategoriaEtiqueta(payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toastService.showSuccess('Categoría de etiqueta creada correctamente.');
          this.obtenerCategorias();
          this.cerrarModalFormulario();
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.toastService.showError(`No se pudo crear la categoría: ${err.error?.mensaje || err.message}`);
        },
      });
    } else {
      const payload: EditCategoriaEtiquetaDTO = {
        ...(this.categoria() as EditCategoriaEtiquetaDTO),
        fldFechaUltimaModificacion: now,
      };
      this.categoriaService.editarCategoriaEtiqueta(payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toastService.showSuccess('Categoría de etiqueta actualizada correctamente.');
          this.obtenerCategorias();
          this.cerrarModalFormulario();
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.toastService.showError(`Error al actualizar la categoría: ${err.error?.mensaje || err.message}`);
        },
      });
    }
  }

  confirmarEliminar(): void {
    const categoria = this.categoriaAEliminar();
    if (!categoria) return;

    this.isDeleting.set(true);
    this.categoriaService.eliminarCategoriaEtiqueta(categoria.idCategoria).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.toastService.showSuccess('Categoría de etiqueta eliminada correctamente.');
        if (this.categorias().length === 1 && this.currentPage() > 1) {
          this.currentPage.update((p) => p - 1);
        }
        this.obtenerCategorias();
        this.cerrarModalEliminar();
      },
      error: (err: HttpErrorResponse) => {
        this.isDeleting.set(false);
        this.toastService.showError(`Error al eliminar la categoría: ${err.error?.mensaje || err.message}`);
        this.cerrarModalEliminar();
      },
    });
  }

  private getEmptyCategoria(): CreateCategoriaEtiquetaDTO {
    return {
      idCategoria: 0,
      fldNombre: '',
      fldDescripcion: '',
      fldFechaCreacion: '',
      fldFechaUltimaModificacion: '',
    };
  }
}
