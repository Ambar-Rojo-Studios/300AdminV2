import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { ClientesService } from '../../../services/cliente.service';
import { SuscripcionesService } from '../../../services/suscripcion.service';
import { ClienteCreateDTO, ClienteEditDTO, ClienteListDTO } from '../../../models/cliente.model';
import { ListSuscripcionDTO } from '../../../models/suscripcion.model';
import { ToastService } from '../../../shared/services/toast.service';

import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/modal/confirm-dialog.component';
import { TextFieldComponent } from '../../../shared/components/form-fields/text-field.component';
import { SelectFieldComponent, SelectOption } from '../../../shared/components/form-fields/select-field.component';
import { FileFieldComponent } from '../../../shared/components/form-fields/file-field.component';
import { SortDirection, SortEvent, TableColumn } from '../../../shared/models/table.model';

/**
 * Página admin de Clientes (Etapa 3, CRUD bloque B). Mismo patrón que
 * marca: tabla + modal genéricos. Los clientes son usuarios de la app móvil.
 */
@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTableComponent,
    ModalComponent,
    ConfirmDialogComponent,
    TextFieldComponent,
    SelectFieldComponent,
    FileFieldComponent,
  ],
  templateUrl: './cliente.component.html',
})
export class ClienteComponent implements OnInit {
  clientes = signal<ClienteListDTO[]>([]);
  suscripciones = signal<ListSuscripcionDTO[]>([]);

  isLoading = signal(false);
  isSaving = signal(false);
  isDeleting = signal(false);

  showFormModal = signal(false);
  showDeleteModal = signal(false);
  modalMode = signal<'create' | 'edit'>('create');

  sortKey = signal<string | null>(null);
  sortDirection = signal<SortDirection>(null);

  cliente = signal<ClienteCreateDTO | ClienteEditDTO>(this.getEmptyCliente());
  fotoSeleccionada: File | undefined;
  clienteAEliminar = signal<ClienteListDTO | null>(null);

  suscripcionOptions = computed<SelectOption[]>(() =>
    this.suscripciones().map((s) => ({ value: s.idSuscripcion, label: s.fldNombre }))
  );

  columns: TableColumn<ClienteListDTO>[] = [
    { key: 'fldNombre', label: 'Nombre', sortable: true },
    { key: 'fldCorreoElectronico', label: 'Correo', sortable: true },
    { key: 'fldTelefono', label: 'Teléfono' },
    { key: 'fldSuscripcion', label: 'Suscripción' },
  ];

  modalTitle = computed(() => (this.modalMode() === 'create' ? 'Crear cliente' : 'Editar cliente'));

  clientesOrdenados = computed<ClienteListDTO[]>(() => {
    const key = this.sortKey();
    const direction = this.sortDirection();
    const lista = this.clientes();
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
    private clientesService: ClientesService,
    private suscripcionesService: SuscripcionesService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.obtenerClientes();
    this.suscripcionesService.obtenerSuscripcionesCliente().subscribe({
      next: (r) => this.suscripciones.set(r.cuerpoDeRespuesta ?? []),
      error: () => this.toastService.showError('No se pudieron cargar las suscripciones.'),
    });
  }

  private obtenerClientes(): void {
    this.isLoading.set(true);
    this.clientesService.listarClientes(1, 10000).subscribe({
      next: (r) => {
        this.clientes.set(r.cuerpoDeRespuesta ?? []);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.clientes.set([]);
        this.toastService.showError(`Error al cargar clientes: ${err.message || 'Error de conexión'}`);
      },
    });
  }

  onSortChange(evento: SortEvent): void {
    this.sortKey.set(evento.direction ? evento.key : null);
    this.sortDirection.set(evento.direction);
  }

  onFotoSeleccionada(archivo: File | File[] | null): void {
    this.fotoSeleccionada = Array.isArray(archivo) ? archivo[0] : (archivo ?? undefined);
  }

  abrirModalCrear(): void {
    this.modalMode.set('create');
    this.cliente.set(this.getEmptyCliente());
    this.fotoSeleccionada = undefined;
    this.showFormModal.set(true);
  }

  abrirModalEditar(cliente: ClienteListDTO): void {
    this.modalMode.set('edit');
    this.cliente.set({ ...cliente, idCliente: cliente.idCLiente, fldContrasenia: '' });
    this.fotoSeleccionada = undefined;
    this.showFormModal.set(true);
  }

  abrirModalEliminar(cliente: ClienteListDTO): void {
    this.clienteAEliminar.set(cliente);
    this.showDeleteModal.set(true);
  }

  cerrarModalFormulario(): void {
    this.showFormModal.set(false);
  }

  cerrarModalEliminar(): void {
    this.showDeleteModal.set(false);
    this.clienteAEliminar.set(null);
  }

  onSubmit(form: NgForm): void {
    if (!form.valid) {
      this.toastService.showError('Completa todos los campos obligatorios.');
      return;
    }

    this.isSaving.set(true);

    if (this.modalMode() === 'create') {
      const payload = { ...this.cliente(), idCliente: 0, idSuscripcion: Number(this.cliente().idSuscripcion) } as ClienteCreateDTO;
      this.clientesService.crearCliente(payload, this.fotoSeleccionada).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toastService.showSuccess('Cliente creado correctamente.');
          this.obtenerClientes();
          this.cerrarModalFormulario();
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.toastService.showError(`No se pudo crear el cliente: ${err.error?.mensaje || err.message}`);
        },
      });
    } else {
      const payload = { ...this.cliente(), idSuscripcion: Number(this.cliente().idSuscripcion) } as ClienteEditDTO;
      this.clientesService.editarCliente(payload, this.fotoSeleccionada).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toastService.showSuccess('Cliente actualizado correctamente.');
          this.obtenerClientes();
          this.cerrarModalFormulario();
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.toastService.showError(`Error al actualizar cliente: ${err.error?.mensaje || err.message}`);
        },
      });
    }
  }

  confirmarEliminar(): void {
    const cliente = this.clienteAEliminar();
    if (!cliente) return;

    this.isDeleting.set(true);
    this.clientesService.eliminarClientes(cliente.idCLiente).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.toastService.showSuccess('Cliente eliminado correctamente.');
        this.obtenerClientes();
        this.cerrarModalEliminar();
      },
      error: (err: HttpErrorResponse) => {
        this.isDeleting.set(false);
        this.toastService.showError(`Error al eliminar cliente: ${err.error?.mensaje || err.message}`);
        this.cerrarModalEliminar();
      },
    });
  }

  private getEmptyCliente(): ClienteCreateDTO {
    return {
      idCliente: 0,
      fldNombre: '',
      fldNombreCorto: '',
      fldTelefono: '',
      fldCorreoElectronico: '',
      fldContrasenia: '',
      fldFechaNacimiento: '',
      idSuscripcion: 0,
    };
  }
}
