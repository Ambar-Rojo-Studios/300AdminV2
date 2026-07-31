import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { SuscripcionesService } from '../../../services/suscripcion.service';
import { CreateSuscripcionDTO, EditSuscripcionDTO, ListSuscripcionDTO } from '../../../models/suscripcion.model';
import { ToastService } from '../../../shared/services/toast.service';

import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/modal/confirm-dialog.component';
import { TextFieldComponent } from '../../../shared/components/form-fields/text-field.component';
import { TextareaFieldComponent } from '../../../shared/components/form-fields/textarea-field.component';
import { SelectFieldComponent, SelectOption } from '../../../shared/components/form-fields/select-field.component';
import { SortDirection, SortEvent, TableColumn } from '../../../shared/models/table.model';

/**
 * Página admin de Suscripciones (Etapa 3, CRUD bloque B). Mismo patrón que
 * marca: tabla + modal genéricos. El backend expone la lista partida en
 * cliente/no-cliente; aquí se muestran juntas en una sola tabla.
 */
@Component({
  selector: 'app-suscripcion',
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
  templateUrl: './suscripcion.component.html',
})
export class SuscripcionComponent implements OnInit {
  suscripciones = signal<ListSuscripcionDTO[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  isDeleting = signal(false);

  showFormModal = signal(false);
  showDeleteModal = signal(false);
  modalMode = signal<'create' | 'edit'>('create');

  sortKey = signal<string | null>(null);
  sortDirection = signal<SortDirection>(null);

  suscripcion = signal<CreateSuscripcionDTO | EditSuscripcionDTO>(this.getEmptySuscripcion());
  suscripcionAEliminar = signal<ListSuscripcionDTO | null>(null);

  tipoOptions: SelectOption[] = [
    { value: 'true', label: 'Cliente (app móvil)' },
    { value: 'false', label: 'Empresa/establecimiento' },
  ];

  columns: TableColumn<ListSuscripcionDTO>[] = [
    { key: 'idSuscripcion', label: 'ID', width: '80px' },
    { key: 'fldNombre', label: 'Nombre', sortable: true },
    { key: 'fldPrecio', label: 'Precio', format: (row) => `$${row.fldPrecio}` },
    { key: 'fldEsSuscripcionDeCliente', label: 'Tipo', format: (row) => (row.fldEsSuscripcionDeCliente ? 'Cliente' : 'Empresa') },
  ];

  modalTitle = computed(() => (this.modalMode() === 'create' ? 'Crear suscripción' : 'Editar suscripción'));

  suscripcionesOrdenadas = computed<ListSuscripcionDTO[]>(() => {
    const key = this.sortKey();
    const direction = this.sortDirection();
    const lista = this.suscripciones();
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
    private suscripcionesService: SuscripcionesService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.obtenerSuscripciones();
  }

  private obtenerSuscripciones(): void {
    this.isLoading.set(true);
    forkJoin({
      cliente: this.suscripcionesService.obtenerSuscripcionesCliente(),
      empresa: this.suscripcionesService.obtenerSuscripcionesNoCliente(),
    }).subscribe({
      next: ({ cliente, empresa }) => {
        this.suscripciones.set([...(cliente.cuerpoDeRespuesta ?? []), ...(empresa.cuerpoDeRespuesta ?? [])]);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.suscripciones.set([]);
        this.toastService.showError(`Error al cargar suscripciones: ${err.message || 'Error de conexión'}`);
      },
    });
  }

  onSortChange(evento: SortEvent): void {
    this.sortKey.set(evento.direction ? evento.key : null);
    this.sortDirection.set(evento.direction);
  }

  abrirModalCrear(): void {
    this.modalMode.set('create');
    this.suscripcion.set(this.getEmptySuscripcion());
    this.showFormModal.set(true);
  }

  abrirModalEditar(suscripcion: ListSuscripcionDTO): void {
    this.modalMode.set('edit');
    this.suscripcion.set({
      ...suscripcion,
      fldEsSuscripcionDeCliente: String(suscripcion.fldEsSuscripcionDeCliente) as any,
    });
    this.showFormModal.set(true);
  }

  abrirModalEliminar(suscripcion: ListSuscripcionDTO): void {
    this.suscripcionAEliminar.set(suscripcion);
    this.showDeleteModal.set(true);
  }

  cerrarModalFormulario(): void {
    this.showFormModal.set(false);
  }

  cerrarModalEliminar(): void {
    this.showDeleteModal.set(false);
    this.suscripcionAEliminar.set(null);
  }

  onSubmit(form: NgForm): void {
    if (!form.valid) {
      this.toastService.showError('Completa todos los campos obligatorios.');
      return;
    }

    this.isSaving.set(true);
    const payload = {
      ...this.suscripcion(),
      fldPrecio: Number(this.suscripcion().fldPrecio),
      fldEsSuscripcionDeCliente: String(this.suscripcion().fldEsSuscripcionDeCliente) === 'true',
    };

    if (this.modalMode() === 'create') {
      this.suscripcionesService.crearSuscripcion({ ...payload, idSuscripcion: null } as CreateSuscripcionDTO).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toastService.showSuccess('Suscripción creada correctamente.');
          this.obtenerSuscripciones();
          this.cerrarModalFormulario();
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.toastService.showError(`No se pudo crear la suscripción: ${err.error?.mensaje || err.message}`);
        },
      });
    } else {
      this.suscripcionesService.editarSuscripcion(payload as EditSuscripcionDTO).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toastService.showSuccess('Suscripción actualizada correctamente.');
          this.obtenerSuscripciones();
          this.cerrarModalFormulario();
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.toastService.showError(`Error al actualizar suscripción: ${err.error?.mensaje || err.message}`);
        },
      });
    }
  }

  confirmarEliminar(): void {
    const suscripcion = this.suscripcionAEliminar();
    if (!suscripcion) return;

    this.isDeleting.set(true);
    this.suscripcionesService.eliminarSuscripcion(suscripcion.idSuscripcion).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.toastService.showSuccess('Suscripción eliminada correctamente.');
        this.obtenerSuscripciones();
        this.cerrarModalEliminar();
      },
      error: (err: HttpErrorResponse) => {
        this.isDeleting.set(false);
        this.toastService.showError(`Error al eliminar suscripción: ${err.error?.mensaje || err.message}`);
        this.cerrarModalEliminar();
      },
    });
  }

  private getEmptySuscripcion(): CreateSuscripcionDTO {
    return {
      idSuscripcion: null,
      fldNombre: '',
      fldDescripcion: '',
      fldPrecio: 0,
      fldEsSuscripcionDeCliente: 'true' as any,
    };
  }
}
