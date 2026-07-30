import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { EtiquetasService } from '../../../services/etiquetas.service';
import { CategoriaEtiquetaService } from '../../../services/categoria-etiqueta.service';
import {
  ApiResponseEtiqueta,
  CreateEtiquetaDTO,
  EditEtiquetaDTO,
  ListEtiquetaDTO,
} from '../../../models/etiquetas.model';
import { ListCategoriaEtiquetaDTO } from '../../../models/categoria-etiqueta.model';
import { ToastService } from '../../../shared/services/toast.service';

import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/modal/confirm-dialog.component';
import { TextFieldComponent } from '../../../shared/components/form-fields/text-field.component';
import { TextareaFieldComponent } from '../../../shared/components/form-fields/textarea-field.component';
import { SelectFieldComponent, SelectOption } from '../../../shared/components/form-fields/select-field.component';
import { SortDirection, SortEvent, TableColumn } from '../../../shared/models/table.model';

/** Forma interna del formulario: agrega fkIdCategoriaEtiqueta editable independientemente del modo. */
interface EtiquetaFormValue {
  idEtiqueta: number;
  fkIdCategoriaEtiqueta: number | null;
  fldNombre: string;
  fldDescripcion: string;
  fldEsVisible: boolean;
}

/**
 * Página admin de Etiquetas (Etapa 3). Administra el catálogo de etiquetas
 * (las que después usa <app-etiquetas-selector> en establecimientos/clientes).
 * Depende de Categoría de etiqueta ya cargada, para el select de categoría.
 */
@Component({
  selector: 'app-etiquetas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTableComponent,
    ModalComponent,
    ConfirmDialogComponent,
    TextFieldComponent,
    TextareaFieldComponent,
    SelectFieldComponent,
  ],
  templateUrl: './etiquetas.component.html',
})
export class EtiquetasComponent implements OnInit {
  etiquetas = signal<ListEtiquetaDTO[]>([]);
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

  etiqueta = signal<EtiquetaFormValue>(this.getEmptyEtiqueta());
  etiquetaAEliminar = signal<ListEtiquetaDTO | null>(null);

  columns: TableColumn<ListEtiquetaDTO>[] = [
    { key: 'idEtiqueta', label: 'ID', width: '80px' },
    { key: 'fldNombre', label: 'Nombre', sortable: true },
    { key: 'fldCategoria', label: 'Categoría', sortable: true },
    { key: 'fldEsVisible', label: 'Visible', format: (row) => (row.fldEsVisible ? 'Sí' : 'No') },
  ];

  modalTitle = computed(() => (this.modalMode() === 'create' ? 'Crear etiqueta' : 'Editar etiqueta'));

  categoriaOptions = computed<SelectOption[]>(() =>
    this.categorias().map((c) => ({ value: c.idCategoria, label: c.fldNombre }))
  );

  etiquetasOrdenadas = computed<ListEtiquetaDTO[]>(() => {
    const key = this.sortKey();
    const direction = this.sortDirection();
    const lista = this.etiquetas();
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
    private etiquetasService: EtiquetasService,
    private categoriaService: CategoriaEtiquetaService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.cargarCategorias();
    this.obtenerEtiquetas();
  }

  private cargarCategorias(): void {
    this.categoriaService.obtenerCategoriasEtiquetas(1, 100).subscribe({
      next: (res) => this.categorias.set(res?.codigoEstatus === 1 ? res.cuerpoDeRespuesta ?? [] : []),
      error: () => this.categorias.set([]),
    });
  }

  private obtenerEtiquetas(): void {
    this.isLoading.set(true);
    this.etiquetasService.listarEtiquetas(this.currentPage(), this.pageSize).subscribe({
      next: (response: ApiResponseEtiqueta<ListEtiquetaDTO[]>) => {
        if (response?.codigoEstatus === 1 && Array.isArray(response.cuerpoDeRespuesta)) {
          const etiquetas = response.cuerpoDeRespuesta;
          this.etiquetas.set(etiquetas);
          this.totalPages.set(etiquetas.length < this.pageSize ? this.currentPage() : this.currentPage() + 1);
        } else {
          this.etiquetas.set([]);
          this.totalPages.set(1);
          this.toastService.showError(response?.mensaje || 'Error al cargar etiquetas.');
        }
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.etiquetas.set([]);
        this.totalPages.set(1);
        this.toastService.showError(`Error al cargar etiquetas: ${err.message || 'Error de conexión'}`);
      },
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.obtenerEtiquetas();
  }

  onSortChange(evento: SortEvent): void {
    this.sortKey.set(evento.direction ? evento.key : null);
    this.sortDirection.set(evento.direction);
  }

  abrirModalCrear(): void {
    this.modalMode.set('create');
    this.etiqueta.set(this.getEmptyEtiqueta());
    this.showFormModal.set(true);
  }

  abrirModalEditar(etiqueta: ListEtiquetaDTO): void {
    this.modalMode.set('edit');
    // El listado solo trae el NOMBRE de la categoría (fldCategoria), no su id;
    // lo resolvemos contra el catálogo ya cargado para poder preseleccionarlo en el select.
    const categoriaMatch = this.categorias().find((c) => c.fldNombre === etiqueta.fldCategoria);
    this.etiqueta.set({
      idEtiqueta: etiqueta.idEtiqueta,
      fkIdCategoriaEtiqueta: categoriaMatch?.idCategoria ?? null,
      fldNombre: etiqueta.fldNombre,
      fldDescripcion: etiqueta.fldDescripcion,
      fldEsVisible: etiqueta.fldEsVisible,
    });
    this.showFormModal.set(true);
  }

  abrirModalEliminar(etiqueta: ListEtiquetaDTO): void {
    this.etiquetaAEliminar.set(etiqueta);
    this.showDeleteModal.set(true);
  }

  cerrarModalFormulario(): void {
    this.showFormModal.set(false);
  }

  cerrarModalEliminar(): void {
    this.showDeleteModal.set(false);
    this.etiquetaAEliminar.set(null);
  }

  onSubmit(form: NgForm): void {
    if (!form.valid || !this.etiqueta().fkIdCategoriaEtiqueta) {
      this.toastService.showError('Completa todos los campos obligatorios, incluida la categoría.');
      return;
    }

    this.isSaving.set(true);
    const valores = this.etiqueta();

    if (this.modalMode() === 'create') {
      const payload: CreateEtiquetaDTO = {
        idEtiqueta: 0,
        fkIdCategoriaEtiqueta: valores.fkIdCategoriaEtiqueta!,
        fldNombre: valores.fldNombre,
        fldDescripcion: valores.fldDescripcion,
        fldEsVisible: valores.fldEsVisible as true,
      };
      this.etiquetasService.crearEtiqueta(payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toastService.showSuccess('Etiqueta creada correctamente.');
          this.obtenerEtiquetas();
          this.cerrarModalFormulario();
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.toastService.showError(`No se pudo crear la etiqueta: ${err.error?.mensaje || err.message}`);
        },
      });
    } else {
      const payload: EditEtiquetaDTO = {
        idEtiqueta: valores.idEtiqueta,
        fkIdCategoriaEtiqueta: valores.fkIdCategoriaEtiqueta!,
        fldNombre: valores.fldNombre,
        fldDescripcion: valores.fldDescripcion,
        fldEsVisible: valores.fldEsVisible as true,
      };
      this.etiquetasService.editarEtiqueta(payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toastService.showSuccess('Etiqueta actualizada correctamente.');
          this.obtenerEtiquetas();
          this.cerrarModalFormulario();
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.toastService.showError(`Error al actualizar la etiqueta: ${err.error?.mensaje || err.message}`);
        },
      });
    }
  }

  confirmarEliminar(): void {
    const etiqueta = this.etiquetaAEliminar();
    if (!etiqueta) return;

    this.isDeleting.set(true);
    this.etiquetasService.eliminarEtiqueta(etiqueta.idEtiqueta).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.toastService.showSuccess('Etiqueta eliminada correctamente.');
        if (this.etiquetas().length === 1 && this.currentPage() > 1) {
          this.currentPage.update((p) => p - 1);
        }
        this.obtenerEtiquetas();
        this.cerrarModalEliminar();
      },
      error: (err: HttpErrorResponse) => {
        this.isDeleting.set(false);
        this.toastService.showError(`Error al eliminar la etiqueta: ${err.error?.mensaje || err.message}`);
        this.cerrarModalEliminar();
      },
    });
  }

  private getEmptyEtiqueta(): EtiquetaFormValue {
    return {
      idEtiqueta: 0,
      fkIdCategoriaEtiqueta: null,
      fldNombre: '',
      fldDescripcion: '',
      fldEsVisible: true,
    };
  }
}
