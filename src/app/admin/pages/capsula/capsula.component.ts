import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { CulturalService } from '../../../services/capsula-cultural.service';
import {
  ListCulturalDTO,
  CreateCulturalDTO,
  EditCulturalDTO,
  ApiResponseCultural,
} from '../../../models/cultural.model';
import { ToastService } from '../../../shared/services/toast.service';

import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/modal/confirm-dialog.component';
import { TextFieldComponent } from '../../../shared/components/form-fields/text-field.component';
import { TextareaFieldComponent } from '../../../shared/components/form-fields/textarea-field.component';
import { SelectFieldComponent, SelectOption } from '../../../shared/components/form-fields/select-field.component';
import { FileFieldComponent } from '../../../shared/components/form-fields/file-field.component';
import { SortDirection, SortEvent, TableColumn } from '../../../shared/models/table.model';

@Component({
  selector: 'app-capsula',
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
    FileFieldComponent,
  ],
  templateUrl: './capsula.component.html',
})
export class CapsulaComponent implements OnInit {
  capsules = signal<ListCulturalDTO[]>([]);
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

  capsula = signal<CreateCulturalDTO | EditCulturalDTO>(
    this.getEmptyCapsula()
  );
  capsulaAEliminar = signal<ListCulturalDTO | null>(null);
  photoFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  esVisible = signal('true');

  columns: TableColumn<ListCulturalDTO>[] = [
    { key: 'idCapsula', label: 'ID', width: '80px' },
    { key: 'fldTitulo', label: 'Título', sortable: true },
    { key: 'fldFechaPublicacion', label: 'Fecha', sortable: true },
    {
      key: 'fldEsVisible',
      label: 'Visible',
      format: (row) => (row.fldEsVisible ? 'Sí' : 'No'),
    },
  ];

  visibilityOptions: SelectOption[] = [
    { value: 'true', label: 'Sí' },
    { value: 'false', label: 'No' },
  ];

  modalTitle = computed(() =>
    this.modalMode() === 'create'
      ? 'Crear cápsula cultural'
      : 'Editar cápsula cultural'
  );

  capsulesOrdenadas = computed<ListCulturalDTO[]>(() => {
    const key = this.sortKey();
    const direction = this.sortDirection();
    const lista = this.capsules();
    if (!key || !direction) return lista;
    const copia = [...lista];
    copia.sort((a, b) => {
      const aVal = String((a as any)[key] ?? '');
      const bVal = String((b as any)[key] ?? '');
      const cmp = aVal.localeCompare(bVal, 'es', { sensitivity: 'base' });
      return direction === 'asc' ? cmp : -cmp;
    });
    return copia;
  });

  constructor(
    private culturalService: CulturalService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.obtenerCapsulas();
  }

  private obtenerCapsulas(): void {
    this.isLoading.set(true);
    this.culturalService.obtenerCulturales().subscribe({
      next: (res: ApiResponseCultural<ListCulturalDTO[]>) => {
        const list = res?.cuerpoDeRespuesta ?? [];
        this.capsules.set(list);
        this.totalPages.set(
          list.length < this.pageSize
            ? this.currentPage()
            : this.currentPage() + 1
        );
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.toastService.showError(
          `Error al cargar cápsulas: ${err.message || 'Error de conexión'}`
        );
      },
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  onSortChange(event: SortEvent): void {
    this.sortKey.set(event.direction ? event.key : null);
    this.sortDirection.set(event.direction);
  }

  abrirModalCrear(): void {
    this.modalMode.set('create');
    this.capsula.set(this.getEmptyCapsula());
    this.photoFile.set(null);
    this.previewUrl.set(null);
    this.esVisible.set('true');
    this.showFormModal.set(true);
  }

  abrirModalEditar(capsule: ListCulturalDTO): void {
    this.modalMode.set('edit');
    this.capsula.set({ ...capsule });
    this.photoFile.set(null);
    this.previewUrl.set(capsule.fldImagen ?? null);
    this.esVisible.set(capsule.fldEsVisible ? 'true' : 'false');
    this.showFormModal.set(true);
  }

  abrirModalEliminar(capsule: ListCulturalDTO): void {
    this.capsulaAEliminar.set(capsule);
    this.showDeleteModal.set(true);
  }

  cerrarModalFormulario(): void {
    this.showFormModal.set(false);
  }

  cerrarModalEliminar(): void {
    this.showDeleteModal.set(false);
    this.capsulaAEliminar.set(null);
  }

  onPhotoSelected(file: File | File[] | null): void {
    if (file instanceof File) {
      this.photoFile.set(file);
    } else {
      this.photoFile.set(null);
    }
  }

  onSubmit(form: NgForm): void {
    if (!form.valid) {
      this.toastService.showError('Completa todos los campos obligatorios.');
      return;
    }

    const data = { ...this.capsula(), fldEsVisible: this.esVisible() === 'true' };
    const foto = this.photoFile() ?? undefined;
    this.isSaving.set(true);

    if (this.modalMode() === 'create') {
      const payload: CreateCulturalDTO = {
        ...data,
        idCapsula: 0,
        fldImagen: data.fldImagen ?? '',
      } as CreateCulturalDTO;
      this.culturalService.crearCultural(payload, foto).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toastService.showSuccess('Cápsula creada correctamente.');
          this.obtenerCapsulas();
          this.cerrarModalFormulario();
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.toastService.showError(
            `No se pudo crear la cápsula: ${err.error?.mensaje || err.message}`
          );
        },
      });
    } else {
      const payload: EditCulturalDTO = {
        ...data,
        idCapsula: (data as any).idCapsula,
      } as EditCulturalDTO;
      this.culturalService.editarCultural(payload, foto).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toastService.showSuccess('Cápsula actualizada correctamente.');
          this.obtenerCapsulas();
          this.cerrarModalFormulario();
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.toastService.showError(
            `Error al actualizar cápsula: ${err.error?.mensaje || err.message}`
          );
        },
      });
    }
  }

  confirmarEliminar(): void {
    const capsula = this.capsulaAEliminar();
    if (!capsula) return;
    this.isDeleting.set(true);
    this.culturalService.eliminarCultural(capsula.idCapsula).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.toastService.showSuccess('Cápsula eliminada correctamente.');
        this.obtenerCapsulas();
        this.cerrarModalEliminar();
      },
      error: (err: HttpErrorResponse) => {
        this.isDeleting.set(false);
        this.toastService.showError(
          `Error al eliminar cápsula: ${err.error?.mensaje || err.message}`
        );
        this.cerrarModalEliminar();
      },
    });
  }

  private getEmptyCapsula(): CreateCulturalDTO {
    return {
      idCapsula: 0,
      fldTitulo: '',
      fldDescripcion: '',
      fldImagen: '',
      fldFechaPublicacion: new Date().toISOString().slice(0, 10),
      fldEsVisible: true,
    };
  }
}