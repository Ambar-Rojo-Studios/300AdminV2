import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { PromocionesService } from '../../../services/promocion.service';
import { EstablecimientosService } from '../../../services/establecimientos.service';
import { SuscripcionesService } from '../../../services/suscripcion.service';
import { ToastService } from '../../../shared/services/toast.service';
import { procesarYComprimirImagen } from '../../../utils/image-processor';

import {
  ApiResponsivePromocion,
  CrearPromocionDTO,
  EditarPromocionDTO,
  listarPromocionesDTO,
} from '../../../models/promocion.model';
import { EstablecimientoEditDTO, EstablecimientoListDTO } from '../../../models/establecimiento.model';
import { ListSuscripcionDTO } from '../../../models/suscripcion.model';

import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/modal/confirm-dialog.component';
import { TextFieldComponent } from '../../../shared/components/form-fields/text-field.component';
import { TextareaFieldComponent } from '../../../shared/components/form-fields/textarea-field.component';
import { SelectFieldComponent, SelectOption } from '../../../shared/components/form-fields/select-field.component';
import { FileFieldComponent } from '../../../shared/components/form-fields/file-field.component';
import { SortDirection, SortEvent, TableColumn } from '../../../shared/models/table.model';

/** Forma interna del formulario de promoción (agrega fkIdEstablecimiento/fkIdSuscripcion siempre editables). */
interface PromocionFormValue {
  idPromocion: number;
  fkIdEstablecimiento: number;
  fkIdSuscripcion: number;
  fldNombre: string;
  fldDescripcion: string;
  fldFechaInicio: string;
  fldFechaFin: string;
  fldCodigoValidacion: string;
  fldImagen: string;
  diasDisponibles: string[];
  tipoPromocion: string | null;
}

/** Los 7 campos de "promo del día" + el de "300 Lugares" que viven en el establecimiento. */
interface PromosEstablecimientoFormValue {
  idEstablecimiento: number;
  fldPromoLunes: string | null;
  fldPromoMartes: string | null;
  fldPromoMiercoles: string | null;
  fldPromoJueves: string | null;
  fldPromoViernes: string | null;
  fldPromoSabado: string | null;
  fldPromoDomingo: string | null;
  fldPromo300Lugares: string | null;
}

/**
 * Página admin de Promoción (Etapa 3). Combina dos cosas que en el repo
 * viejo vivían separadas:
 * 1) El CRUD normal de Promoción (fechas, código de validación, tipo,
 *    días disponibles, imagen) — antes admin/pages/promocion/.
 * 2) Los campos de "promo por día" + "Promo > 300 Lugares" que viven en el
 *    establecimiento mismo (BaseEstablecimientoDTO.fldPromoLunes..Domingo +
 *    fldPromo300Lugares) — antes se editaban dentro del componente de
 *    ~900 líneas de establecimiento, y quedaron fuera cuando ese
 *    componente se partió en la Etapa 2 (establecimiento-form no los
 *    incluye a propósito, no estaban en el alcance de ese ticket).
 */
@Component({
  selector: 'app-promocion',
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
  templateUrl: './promocion.component.html',
})
export class PromocionComponent implements OnInit {
  readonly diasSemana: { value: string; label: string }[] = [
    { value: 'Monday', label: 'Lunes' },
    { value: 'Tuesday', label: 'Martes' },
    { value: 'Wednesday', label: 'Miércoles' },
    { value: 'Thursday', label: 'Jueves' },
    { value: 'Friday', label: 'Viernes' },
    { value: 'Saturday', label: 'Sábado' },
    { value: 'Sunday', label: 'Domingo' },
  ];

  readonly tipoPromocionOptions: SelectOption[] = [
    { value: 'FECHA', label: 'Fecha' },
    { value: 'DESCUENTO', label: 'Descuento' },
  ];

  /** Los mismos 7 días, pero para el bloque de promos-por-establecimiento (nombres de campo distintos). */
  readonly promosDias: { key: keyof PromosEstablecimientoFormValue; label: string }[] = [
    { key: 'fldPromoLunes', label: 'Promo Lunes' },
    { key: 'fldPromoMartes', label: 'Promo Martes' },
    { key: 'fldPromoMiercoles', label: 'Promo Miércoles' },
    { key: 'fldPromoJueves', label: 'Promo Jueves' },
    { key: 'fldPromoViernes', label: 'Promo Viernes' },
    { key: 'fldPromoSabado', label: 'Promo Sábado' },
    { key: 'fldPromoDomingo', label: 'Promo Domingo' },
  ];

  // ── Promociones (CRUD normal) ────────────────────────────────
  promociones = signal<listarPromocionesDTO[]>([]);
  establecimientos = signal<EstablecimientoListDTO[]>([]);
  suscripciones = signal<ListSuscripcionDTO[]>([]);

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

  promocion = signal<PromocionFormValue>(this.getEmptyPromocion());
  promocionAEliminar = signal<listarPromocionesDTO | null>(null);
  /** Preview en Base64 del archivo elegido para la imagen (aparte de fldImagen, para no perder la referencia visual). */
  imagenPreview = signal<string | null>(null);

  columns: TableColumn<listarPromocionesDTO>[] = [
    { key: 'idPromocion', label: 'ID', width: '70px' },
    { key: 'fldNombre', label: 'Nombre', sortable: true },
    { key: 'fldEstablecimiento', label: 'Establecimiento', sortable: true },
    { key: 'fldSuscripcion', label: 'Suscripción' },
    { key: 'tipoPromocion', label: 'Tipo', format: (row) => row.tipoPromocion || 'Sin tipo' },
    {
      key: 'fldFechaInicio',
      label: 'Vigencia',
      format: (row) => `${(row.fldFechaInicio || '').substring(0, 10)} — ${(row.fldFechaFin || '').substring(0, 10)}`,
    },
  ];

  modalTitle = computed(() => (this.modalMode() === 'create' ? 'Crear promoción' : 'Editar promoción'));

  establecimientoOptions = computed<SelectOption[]>(() =>
    this.establecimientos().map((e) => ({ value: e.idEstablecimiento, label: e.fldNombre }))
  );

  suscripcionOptions = computed<SelectOption[]>(() =>
    this.suscripciones().map((s) => ({ value: s.idSuscripcion, label: s.fldNombre }))
  );

  promocionesOrdenadas = computed<listarPromocionesDTO[]>(() => {
    const key = this.sortKey();
    const direction = this.sortDirection();
    const lista = this.promociones();
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

  // ── Promos por establecimiento (días + 300 Lugares) ──────────
  establecimientosSortKey = signal<string | null>(null);
  establecimientosSortDirection = signal<SortDirection>(null);
  showPromosDiasModal = signal(false);
  isSavingPromosDias = signal(false);
  promosDiasForm = signal<PromosEstablecimientoFormValue>(this.getEmptyPromosDias());

  establecimientosColumns: TableColumn<EstablecimientoListDTO>[] = [
    { key: 'idEstablecimiento', label: 'ID', width: '70px' },
    { key: 'fldNombre', label: 'Nombre', sortable: true },
    { key: 'fldCiudad', label: 'Ciudad', sortable: true },
  ];

  establecimientosOrdenados = computed<EstablecimientoListDTO[]>(() => {
    const key = this.establecimientosSortKey();
    const direction = this.establecimientosSortDirection();
    const lista = this.establecimientos();
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
    private promocionesService: PromocionesService,
    private establecimientosService: EstablecimientosService,
    private suscripcionesService: SuscripcionesService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  private cargarDatosIniciales(): void {
    this.isLoading.set(true);
    forkJoin({
      promociones: this.promocionesService.obtenerPromociones(this.currentPage(), this.pageSize),
      establecimientos: this.establecimientosService.obtenerEstablecimientos(1, 100),
      suscripcionesClientes: this.suscripcionesService.obtenerSuscripcionesCliente(),
      suscripcionesNoClientes: this.suscripcionesService.obtenerSuscripcionesNoCliente(),
    }).subscribe({
      next: (r) => {
        this.procesarPromociones(r.promociones);
        this.establecimientos.set(
          r.establecimientos?.codigoEstatus === 1 && Array.isArray(r.establecimientos.cuerpoDeRespuesta)
            ? r.establecimientos.cuerpoDeRespuesta
            : []
        );
        this.suscripciones.set([
          ...(r.suscripcionesClientes?.cuerpoDeRespuesta || []),
          ...(r.suscripcionesNoClientes?.cuerpoDeRespuesta || []),
        ]);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.toastService.showError(`Error al cargar datos iniciales: ${err.message || 'Error de conexión'}`);
      },
    });
  }

  private procesarPromociones(response: ApiResponsivePromocion<listarPromocionesDTO[]>): void {
    if (response?.codigoEstatus === 1 && Array.isArray(response.cuerpoDeRespuesta)) {
      const promociones = response.cuerpoDeRespuesta;
      this.promociones.set(promociones);
      this.totalPages.set(promociones.length < this.pageSize ? this.currentPage() : this.currentPage() + 1);
    } else {
      this.promociones.set([]);
      this.totalPages.set(1);
      this.toastService.showError(response?.mensaje || 'Error al cargar promociones.');
    }
  }

  private obtenerPromociones(): void {
    this.isLoading.set(true);
    this.promocionesService.obtenerPromociones(this.currentPage(), this.pageSize).subscribe({
      next: (response) => {
        this.procesarPromociones(response);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.toastService.showError(`Error al cargar promociones: ${err.message || 'Error de conexión'}`);
      },
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.obtenerPromociones();
  }

  onSortChange(evento: SortEvent): void {
    this.sortKey.set(evento.direction ? evento.key : null);
    this.sortDirection.set(evento.direction);
  }

  onEstablecimientosSortChange(evento: SortEvent): void {
    this.establecimientosSortKey.set(evento.direction ? evento.key : null);
    this.establecimientosSortDirection.set(evento.direction);
  }

  // ── Modal de crear/editar promoción ──────────────────────────
  abrirModalCrear(): void {
    this.modalMode.set('create');
    this.promocion.set(this.getEmptyPromocion());
    this.imagenPreview.set(null);
    this.showFormModal.set(true);
  }

  abrirModalEditar(promocion: listarPromocionesDTO): void {
    this.modalMode.set('edit');
    // El listado solo trae el NOMBRE de establecimiento/suscripción, no su id;
    // se resuelve contra los catálogos ya cargados (mismo patrón que usaba el componente viejo).
    const establecimiento = this.establecimientos().find((e) => e.fldNombre === promocion.fldEstablecimiento);
    const suscripcion = this.suscripciones().find((s) => s.fldNombre === promocion.fldSuscripcion);

    this.promocion.set({
      idPromocion: promocion.idPromocion,
      fkIdEstablecimiento: establecimiento?.idEstablecimiento ?? -1,
      fkIdSuscripcion: suscripcion?.idSuscripcion ?? -1,
      fldNombre: promocion.fldNombre,
      fldDescripcion: promocion.fldDescripcion,
      fldFechaInicio: (promocion.fldFechaInicio || '').substring(0, 10),
      fldFechaFin: (promocion.fldFechaFin || '').substring(0, 10),
      fldCodigoValidacion: promocion.fldCodigoValidacion,
      fldImagen: '', // vacío = conservar la imagen actual, igual que en el componente viejo
      diasDisponibles: promocion.diasDisponibles ?? [],
      tipoPromocion: promocion.tipoPromocion,
    });
    this.imagenPreview.set(null);
    this.showFormModal.set(true);
  }

  abrirModalEliminar(promocion: listarPromocionesDTO): void {
    this.promocionAEliminar.set(promocion);
    this.showDeleteModal.set(true);
  }

  cerrarModalFormulario(): void {
    this.showFormModal.set(false);
  }

  cerrarModalEliminar(): void {
    this.showDeleteModal.set(false);
    this.promocionAEliminar.set(null);
  }

  toggleDia(value: string, checked: boolean): void {
    this.promocion.update((p) => {
      const dias = p.diasDisponibles ?? [];
      return {
        ...p,
        diasDisponibles: checked ? [...dias, value] : dias.filter((d) => d !== value),
      };
    });
  }

  async onImagenSeleccionada(fileOrFiles: File | File[] | null): Promise<void> {
    const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] ?? null : fileOrFiles;
    if (!file) return;

    const base64 = await procesarYComprimirImagen(file, (mensaje, tipo) => {
      if (tipo === 'error') this.toastService.showError(mensaje);
    });
    if (base64) {
      this.promocion.update((p) => ({ ...p, fldImagen: base64 }));
      this.imagenPreview.set(`data:image/jpeg;base64,${base64}`);
    }
  }

  onSubmit(form: NgForm): void {
    const valores = this.promocion();
    if (!form.valid || valores.fkIdEstablecimiento === -1 || valores.fkIdSuscripcion === -1) {
      this.toastService.showError('Completa todos los campos obligatorios, incluidos establecimiento y suscripción.');
      return;
    }

    this.isSaving.set(true);

    if (this.modalMode() === 'create') {
      const payload: CrearPromocionDTO = { ...valores, idPromocion: 0 };
      this.promocionesService.crearPromocion(payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toastService.showSuccess('Promoción creada correctamente.');
          this.obtenerPromociones();
          this.cerrarModalFormulario();
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.toastService.showError(`No se pudo crear la promoción: ${err.error?.mensaje || err.message}`);
        },
      });
    } else {
      const payload: EditarPromocionDTO = { ...valores };
      this.promocionesService.editarPromocion(payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toastService.showSuccess('Promoción actualizada correctamente.');
          this.obtenerPromociones();
          this.cerrarModalFormulario();
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.toastService.showError(`Error al actualizar la promoción: ${err.error?.mensaje || err.message}`);
        },
      });
    }
  }

  confirmarEliminar(): void {
    const promocion = this.promocionAEliminar();
    if (!promocion) return;

    this.isDeleting.set(true);
    this.promocionesService.eliminarPromocion(promocion.idPromocion).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.toastService.showSuccess('Promoción eliminada correctamente.');
        if (this.promociones().length === 1 && this.currentPage() > 1) {
          this.currentPage.update((p) => p - 1);
        }
        this.obtenerPromociones();
        this.cerrarModalEliminar();
      },
      error: (err: HttpErrorResponse) => {
        this.isDeleting.set(false);
        this.toastService.showError(`Error al eliminar la promoción: ${err.error?.mensaje || err.message}`);
        this.cerrarModalEliminar();
      },
    });
  }

  private getEmptyPromocion(): PromocionFormValue {
    return {
      idPromocion: 0,
      fkIdEstablecimiento: -1,
      fkIdSuscripcion: -1,
      fldNombre: '',
      fldDescripcion: '',
      fldFechaInicio: '',
      fldFechaFin: '',
      fldCodigoValidacion: '',
      fldImagen: '',
      diasDisponibles: [],
      tipoPromocion: null,
    };
  }

  // ── Modal de promos-por-establecimiento (días + 300 Lugares) ─
  abrirModalPromosDias(est: EstablecimientoListDTO): void {
    this.promosDiasForm.set({
      idEstablecimiento: est.idEstablecimiento,
      fldPromoLunes: est.fldPromoLunes,
      fldPromoMartes: est.fldPromoMartes,
      fldPromoMiercoles: est.fldPromoMiercoles,
      fldPromoJueves: est.fldPromoJueves,
      fldPromoViernes: est.fldPromoViernes,
      fldPromoSabado: est.fldPromoSabado,
      fldPromoDomingo: est.fldPromoDomingo,
      fldPromo300Lugares: est.fldPromo300Lugares,
    });
    this.showPromosDiasModal.set(true);
  }

  cerrarModalPromosDias(): void {
    this.showPromosDiasModal.set(false);
  }

  onSubmitPromosDias(form: NgForm): void {
    if (!form.valid) return;

    const valores = this.promosDiasForm();
    const original = this.establecimientos().find((e) => e.idEstablecimiento === valores.idEstablecimiento);
    if (!original) {
      this.toastService.showError('No se encontró el establecimiento.');
      return;
    }

    // Se parte del registro COMPLETO tal cual vino del backend y solo se
    // pisan los 8 campos de promo; así no se toca nada más (fotos, horarios,
    // etiquetas, etc. quedan exactamente igual).
    const payload: EstablecimientoEditDTO = {
      ...original,
      fldPromoLunes: valores.fldPromoLunes,
      fldPromoMartes: valores.fldPromoMartes,
      fldPromoMiercoles: valores.fldPromoMiercoles,
      fldPromoJueves: valores.fldPromoJueves,
      fldPromoViernes: valores.fldPromoViernes,
      fldPromoSabado: valores.fldPromoSabado,
      fldPromoDomingo: valores.fldPromoDomingo,
      fldPromo300Lugares: valores.fldPromo300Lugares,
    };

    this.isSavingPromosDias.set(true);
    this.establecimientosService.editEstablecimiento(payload).subscribe({
      next: () => {
        this.isSavingPromosDias.set(false);
        this.toastService.showSuccess('Promociones del establecimiento actualizadas correctamente.');
        // Refresca la lista de establecimientos para que quede consistente si se vuelve a abrir el modal.
        this.establecimientosService.obtenerEstablecimientos(1, 100).subscribe((res) => {
          if (res?.codigoEstatus === 1 && Array.isArray(res.cuerpoDeRespuesta)) {
            this.establecimientos.set(res.cuerpoDeRespuesta);
          }
        });
        this.cerrarModalPromosDias();
      },
      error: (err: HttpErrorResponse) => {
        this.isSavingPromosDias.set(false);
        this.toastService.showError(`Error al actualizar promociones: ${err.error?.mensaje || err.message}`);
      },
    });
  }

  private getEmptyPromosDias(): PromosEstablecimientoFormValue {
    return {
      idEstablecimiento: 0,
      fldPromoLunes: null,
      fldPromoMartes: null,
      fldPromoMiercoles: null,
      fldPromoJueves: null,
      fldPromoViernes: null,
      fldPromoSabado: null,
      fldPromoDomingo: null,
      fldPromo300Lugares: null,
    };
  }
}
