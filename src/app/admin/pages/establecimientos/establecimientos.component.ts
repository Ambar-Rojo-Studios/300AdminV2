import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, signal } from '@angular/core';
import { lastValueFrom } from 'rxjs';

import { EstablecimientosService } from '../../../services/establecimientos.service';
import { EmpresasService } from '../../../services/empresa.service';
import { SuscripcionesService } from '../../../services/suscripcion.service';
import { TiposEstablecimientoService } from '../../../services/tipo-establecimiento.service';
import { ToastService } from '../../../shared/services/toast.service';

import {
  EstablecimientoCreateDTO,
  EstablecimientoEditDTO,
  EstablecimientoListDTO,
} from '../../../models/establecimiento.model';
import { ListEmpresaDTO } from '../../../models/empresa.model';
import { ListSuscripcionDTO } from '../../../models/suscripcion.model';
import { ListTipoEstablecimientoDTO } from '../../../models/tipo_establecimiento.model';

import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/modal/confirm-dialog.component';
import { EstablecimientoFormComponent } from '../../../shared/components/establecimiento-form/establecimiento-form.component';
import { SortDirection, SortEvent, TableColumn } from '../../../shared/models/table.model';
import {
  EstablecimientoFormSubmitEvent,
  EstablecimientoFormValue,
} from '../../../shared/models/establecimiento-form.model';

/**
 * Página de establecimientos del admin (E3).
 *
 * Reemplaza a admin/pages/establecimiento/ (el componente de ~900 líneas
 * que hacía listado + paginación + crear + editar + eliminar + 5 inputs de
 * archivo + 2 mapas + validaciones, todo junto). Ahora:
 * - El listado usa <app-data-table> + <app-modal>/<app-confirm-dialog> (kit UI, E1).
 * - El formulario es <app-establecimiento-form> (E2), el mismo que usa /mi-lugar.
 * - Esta página solo orquesta: pide datos, abre modales, y traduce el
 *   payload agnóstico del formulario a EstablecimientoCreateDTO/EditDTO
 *   para hablar con EstablecimientosService (multipart con hasta 4 fotos + menú).
 */
@Component({
  selector: 'app-establecimientos',
  standalone: true,
  imports: [CommonModule, DataTableComponent, ModalComponent, ConfirmDialogComponent, EstablecimientoFormComponent],
  templateUrl: './establecimientos.component.html',
})
export class EstablecimientosComponent implements OnInit {
  establecimientos = signal<EstablecimientoListDTO[]>([]);
  empresas = signal<ListEmpresaDTO[]>([]);
  suscripciones = signal<ListSuscripcionDTO[]>([]);
  tiposEstablecimiento = signal<ListTipoEstablecimientoDTO[]>([]);

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

  /** Registro seleccionado, adaptado al shape que espera <app-establecimiento-form>. null = crear. */
  formValue = signal<EstablecimientoFormValue | null>(null);
  establecimientoAEliminar = signal<EstablecimientoListDTO | null>(null);

  columns: TableColumn<EstablecimientoListDTO>[] = [
    { key: 'idEstablecimiento', label: 'ID', width: '70px' },
    { key: 'fldNombre', label: 'Nombre', sortable: true },
    { key: 'fldCiudad', label: 'Ciudad', sortable: true },
    { key: 'fldEstado', label: 'Estado', sortable: true },
    { key: 'fkIdEmpresa', label: 'Empresa', format: (row) => this.getEmpresaNombre(row.fkIdEmpresa) },
    {
      key: 'fkIdTipoEstablecimiento',
      label: 'Tipo',
      format: (row) => this.getTipoNombre(row.fkIdTipoEstablecimiento),
    },
    {
      key: 'fldHorarioApertura',
      label: 'Horario',
      format: (row) => `${(row.fldHorarioApertura || '').slice(0, 5)} - ${(row.fldHorarioCierre || '').slice(0, 5)}`,
    },
  ];

  modalTitle = computed(() => (this.modalMode() === 'create' ? 'Crear establecimiento' : 'Editar establecimiento'));

  establecimientosOrdenados = computed<EstablecimientoListDTO[]>(() => {
    const key = this.sortKey();
    const direction = this.sortDirection();
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
    private establecimientosService: EstablecimientosService,
    private empresasService: EmpresasService,
    private suscripcionesService: SuscripcionesService,
    private tiposEstablecimientoService: TiposEstablecimientoService,
    private toastService: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    try {
      await Promise.all([this.cargarEmpresas(), this.cargarSuscripciones(), this.cargarTiposEstablecimiento()]);
      await this.cargarEstablecimientos();
    } catch (err) {
      this.toastService.showError('Error al inicializar la página de establecimientos.');
      console.error('Error en ngOnInit:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async cargarEstablecimientos(): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await lastValueFrom(
        this.establecimientosService.obtenerEstablecimientos(this.currentPage(), this.pageSize)
      );
      if (response?.codigoEstatus === 1 && Array.isArray(response.cuerpoDeRespuesta)) {
        const lista = response.cuerpoDeRespuesta;
        this.establecimientos.set(lista);
        this.totalPages.set(lista.length < this.pageSize ? this.currentPage() : this.currentPage() + 1);
      } else {
        this.establecimientos.set([]);
        this.totalPages.set(1);
        this.toastService.showError(response?.mensaje || 'Error al cargar establecimientos.');
      }
    } catch (err: any) {
      this.establecimientos.set([]);
      this.totalPages.set(1);
      this.toastService.showError(`Error al cargar establecimientos: ${err.message || 'Error de conexión'}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async cargarEmpresas(): Promise<void> {
    try {
      const response = await lastValueFrom(this.empresasService.obtenerEmpresas(1, 100));
      this.empresas.set(response?.codigoEstatus === 1 && Array.isArray(response.cuerpoDeRespuesta) ? response.cuerpoDeRespuesta : []);
    } catch (err) {
      this.empresas.set([]);
      console.error('Error al cargar empresas:', err);
    }
  }

  private async cargarSuscripciones(): Promise<void> {
    try {
      const [clientes, noClientes] = await Promise.all([
        lastValueFrom(this.suscripcionesService.obtenerSuscripcionesCliente()),
        lastValueFrom(this.suscripcionesService.obtenerSuscripcionesNoCliente()),
      ]);
      this.suscripciones.set([...(clientes?.cuerpoDeRespuesta || []), ...(noClientes?.cuerpoDeRespuesta || [])]);
    } catch (err) {
      this.suscripciones.set([]);
      console.error('Error al cargar suscripciones:', err);
    }
  }

  private async cargarTiposEstablecimiento(): Promise<void> {
    try {
      const response = await lastValueFrom(this.tiposEstablecimientoService.obtenerTipos(1, 100));
      this.tiposEstablecimiento.set(
        response?.codigoEstatus === 1 && Array.isArray(response.cuerpoDeRespuesta) ? response.cuerpoDeRespuesta : []
      );
    } catch (err) {
      this.tiposEstablecimiento.set([]);
      console.error('Error al cargar tipos de establecimiento:', err);
    }
  }

  getEmpresaNombre(idEmpresa: number | null): string {
    if (idEmpresa == null) return 'N/A';
    return this.empresas().find((e) => e.idEmpresa === idEmpresa)?.fldNombre || 'N/A';
  }

  getTipoNombre(idTipo: number | null): string {
    if (idTipo == null) return 'N/A';
    return this.tiposEstablecimiento().find((t) => t.idTipoEstablecimiento === idTipo)?.fldNombre || 'N/A';
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.cargarEstablecimientos();
  }

  onSortChange(evento: SortEvent): void {
    this.sortKey.set(evento.direction ? evento.key : null);
    this.sortDirection.set(evento.direction);
  }

  abrirModalCrear(): void {
    this.modalMode.set('create');
    this.formValue.set(null); // <app-establecimiento-form> arranca vacío cuando value es null
    this.showFormModal.set(true);
  }

  abrirModalEditar(est: EstablecimientoListDTO): void {
    this.modalMode.set('edit');
    this.formValue.set({
      idEstablecimiento: est.idEstablecimiento,
      fkIdEmpresa: est.fkIdEmpresa,
      fkIdSuscripcion: est.fkIdSuscripcion,
      fkIdTipoEstablecimiento: est.fkIdTipoEstablecimiento,

      fldNombre: est.fldNombre,
      fldDescripcion: est.fldDescripcion,

      fldEstado: est.fldEstado,
      fldCiudad: est.fldCiudad,
      fldDireccion: est.fldDireccion,
      fldReferenciaGeografica: est.fldReferenciaGeografica,
      fldCoordLatitud: est.fldCoordLatitud ?? '',
      fldCoordLongitud: est.fldCoordLongitud ?? '',

      fldCorreoElectronico: est.fldCorreoElectronico,
      fldSugerenciaDeLaCasa: est.fldSugerenciaDeLaCasa,

      fldHorarioApertura: est.fldHorarioApertura?.substring(0, 5) ?? '00:00',
      fldHorarioCierre: est.fldHorarioCierre?.substring(0, 5) ?? '00:00',

      fldLunes: !!est.fldLunes,
      fldMartes: !!est.fldMartes,
      fldMiercoles: !!est.fldMiercoles,
      fldJueves: !!est.fldJueves,
      fldViernes: !!est.fldViernes,
      fldSabado: !!est.fldSabado,
      fldDomingo: !!est.fldDomingo,

      fldCelular1: est.fldCelular1,
      fldCelular2: est.fldCelular2,
      fldCelularComentarios: est.fldCelularComentarios,

      fldAlimentosBebidas: est.fldAlimentosBebidas,
      fldTicketPromedio: est.fldTicketPromedio,
      fldAntiguedadAnios: est.fldAntiguedadAnios,

      fldImgRefs: est.imagenesPerfil?.[0] ?? est.fldImgRefs,
      fldImgRefs2: est.imagenesPerfil?.[1] ?? est.fldImgRefs2,
      fldImgRefs3: est.imagenesPerfil?.[2] ?? est.fldImgRefs3,
      fldImgRefs4: est.imagenesPerfil?.[3] ?? est.fldImgRefs4,
      fldMenu: est.imagenesMenu?.[0] ?? est.fldMenu,
    });
    this.showFormModal.set(true);
  }

  abrirModalEliminar(est: EstablecimientoListDTO): void {
    this.establecimientoAEliminar.set(est);
    this.showDeleteModal.set(true);
  }

  cerrarModalFormulario(): void {
    this.showFormModal.set(false);
    this.formValue.set(null);
  }

  cerrarModalEliminar(): void {
    this.showDeleteModal.set(false);
    this.establecimientoAEliminar.set(null);
  }

  private formatTimeForAPI(timeString: string | null | undefined): string {
    if (!timeString) return '00:00:00';
    if (/^\d{2}:\d{2}$/.test(timeString)) return `${timeString}:00`;
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeString)) return timeString;
    return '00:00:00';
  }

  async onEstablecimientoSubmit(event: EstablecimientoFormSubmitEvent): Promise<void> {
    const { values, files } = event;
    this.isSaving.set(true);

    try {
      if (this.modalMode() === 'create') {
        if (!files.foto) {
          this.toastService.showError('La foto es obligatoria al crear.');
          this.isSaving.set(false);
          return;
        }

        const payload: EstablecimientoCreateDTO = {
          idEstablecimiento: 0,
          fkIdEmpresa: values.fkIdEmpresa ?? 0,
          fkIdSuscripcion: values.fkIdSuscripcion ?? 0,
          fkIdTipoEstablecimiento: values.fkIdTipoEstablecimiento,

          fldNombre: values.fldNombre,
          fldDescripcion: values.fldDescripcion,

          fldEstado: values.fldEstado,
          fldCiudad: values.fldCiudad,
          fldZona: null,
          fldDireccion: values.fldDireccion,
          fldReferenciaGeografica: values.fldReferenciaGeografica,
          fldCoordLatitud: values.fldCoordLatitud,
          fldCoordLongitud: values.fldCoordLongitud,

          fldCorreoElectronico: values.fldCorreoElectronico,
          fldSugerenciaDeLaCasa: values.fldSugerenciaDeLaCasa,
          fldImgRefs: '',
          fldImgRefs2: '',
          fldImgRefs3: '',
          fldImgRefs4: '',
          fldMenu: '',
          // Nada que conservar en creación: las imágenes nuevas van en las partes multipart "perfil"/"menu".
          imagenesPerfil: [],
          imagenesMenu: [],

          fldHorarioApertura: this.formatTimeForAPI(values.fldHorarioApertura),
          fldHorarioCierre: this.formatTimeForAPI(values.fldHorarioCierre),

          fldLunes: values.fldLunes,
          fldMartes: values.fldMartes,
          fldMiercoles: values.fldMiercoles,
          fldJueves: values.fldJueves,
          fldViernes: values.fldViernes,
          fldSabado: values.fldSabado,
          fldDomingo: values.fldDomingo,

          fldCelular1: values.fldCelular1,
          fldCelular2: values.fldCelular2,
          fldCelularComentarios: values.fldCelularComentarios,

          fldAlimentosBebidas: values.fldAlimentosBebidas,
          fldTicketPromedio: values.fldTicketPromedio,
          fldAntiguedadAnios: values.fldAntiguedadAnios,

          fldPromoLunes: null,
          fldPromoMartes: null,
          fldPromoMiercoles: null,
          fldPromoJueves: null,
          fldPromoViernes: null,
          fldPromoSabado: null,
          fldPromoDomingo: null,
          fldPromo300Lugares: null,
        };

        const res = await lastValueFrom(
          this.establecimientosService.createEstablecimiento(
            payload,
            files.foto,
            files.menu || undefined,
            files.foto2 || undefined,
            files.foto3 || undefined,
            files.foto4 || undefined
          )
        );

        if (res?.codigoEstatus === 1) {
          this.toastService.showSuccess('Establecimiento creado correctamente.');
          this.currentPage.set(1);
          await this.cargarEstablecimientos();
          this.cerrarModalFormulario();
        } else {
          this.toastService.showError(res?.mensaje || 'Error al crear establecimiento.');
        }
      } else {
        const original = this.establecimientos().find((e) => e.idEstablecimiento === values.idEstablecimiento);
        if (!original) {
          this.toastService.showError('No se encontró el establecimiento a editar.');
          return;
        }

        const payload: EstablecimientoEditDTO = {
          idEstablecimiento: values.idEstablecimiento,
          fkIdEmpresa: values.fkIdEmpresa ?? original.fkIdEmpresa,
          fkIdSuscripcion: values.fkIdSuscripcion ?? original.fkIdSuscripcion,
          fkIdTipoEstablecimiento: values.fkIdTipoEstablecimiento,

          fldNombre: values.fldNombre,
          fldDescripcion: values.fldDescripcion,

          fldEstado: values.fldEstado,
          fldCiudad: values.fldCiudad,
          fldZona: original.fldZona, // no editable desde este form, se conserva tal cual
          fldDireccion: values.fldDireccion,
          fldReferenciaGeografica: values.fldReferenciaGeografica,
          fldCoordLatitud: values.fldCoordLatitud,
          fldCoordLongitud: values.fldCoordLongitud,

          fldCorreoElectronico: values.fldCorreoElectronico,
          fldSugerenciaDeLaCasa: values.fldSugerenciaDeLaCasa,

          // Legacy: el backend ya no los usa para editar (ver imagenesPerfil/imagenesMenu abajo),
          // se dejan vacíos para no confundir.
          fldImgRefs: '',
          fldImgRefs2: '',
          fldImgRefs3: '',
          fldImgRefs4: '',
          fldMenu: '',

          // SINCRONIZACIÓN: hay que mandar las URLs existentes que se quieren CONSERVAR.
          // Slot N (foto/foto2/foto3/foto4) <-> índice N-1 de imagenesPerfil (mismo orden
          // en que se listaron al abrir el modal de editar). Si el usuario subió un archivo
          // nuevo en ese slot, se quita esa URL de "conservadas" (el backend la reemplaza con
          // el archivo nuevo que va en la parte multipart "perfil"); si no, se mantiene.
          imagenesPerfil: (original.imagenesPerfil ?? []).filter((_, i) => {
            const nuevoEnEseSlot = [files.foto, files.foto2, files.foto3, files.foto4][i];
            return !nuevoEnEseSlot;
          }),
          // El form solo tiene 1 slot de menú: si se sube uno nuevo, se reemplazan todos los existentes.
          imagenesMenu: files.menu ? [] : (original.imagenesMenu ?? []),

          fldHorarioApertura: this.formatTimeForAPI(values.fldHorarioApertura),
          fldHorarioCierre: this.formatTimeForAPI(values.fldHorarioCierre),

          fldLunes: values.fldLunes,
          fldMartes: values.fldMartes,
          fldMiercoles: values.fldMiercoles,
          fldJueves: values.fldJueves,
          fldViernes: values.fldViernes,
          fldSabado: values.fldSabado,
          fldDomingo: values.fldDomingo,

          fldCelular1: values.fldCelular1,
          fldCelular2: values.fldCelular2,
          fldCelularComentarios: values.fldCelularComentarios,

          fldAlimentosBebidas: values.fldAlimentosBebidas,
          fldTicketPromedio: values.fldTicketPromedio,
          fldAntiguedadAnios: values.fldAntiguedadAnios,

          fldPromoLunes: original.fldPromoLunes,
          fldPromoMartes: original.fldPromoMartes,
          fldPromoMiercoles: original.fldPromoMiercoles,
          fldPromoJueves: original.fldPromoJueves,
          fldPromoViernes: original.fldPromoViernes,
          fldPromoSabado: original.fldPromoSabado,
          fldPromoDomingo: original.fldPromoDomingo,
          fldPromo300Lugares: original.fldPromo300Lugares,
        };

        const res = await lastValueFrom(
          this.establecimientosService.editEstablecimiento(
            payload,
            files.foto || undefined,
            files.menu || undefined,
            files.foto2 || undefined,
            files.foto3 || undefined,
            files.foto4 || undefined
          )
        );

        if (res?.codigoEstatus === 1) {
          this.toastService.showSuccess('Establecimiento actualizado correctamente.');
          await this.cargarEstablecimientos();
          this.cerrarModalFormulario();
        } else {
          this.toastService.showError(res?.mensaje || 'Error al actualizar establecimiento.');
        }
      }
    } catch (err: any) {
      const errorMessage = err instanceof HttpErrorResponse ? err.error?.mensaje || err.message : 'Error desconocido';
      this.toastService.showError(`Error: ${errorMessage}`);
    } finally {
      this.isSaving.set(false);
    }
  }

  async confirmarEliminar(): Promise<void> {
    const est = this.establecimientoAEliminar();
    if (!est) return;

    this.isDeleting.set(true);
    try {
      await lastValueFrom(this.establecimientosService.deleteEstablecimiento(est.idEstablecimiento));
      this.toastService.showSuccess('Establecimiento eliminado correctamente.');
      if (this.establecimientos().length === 1 && this.currentPage() > 1) {
        this.currentPage.update((p) => p - 1);
      }
      await this.cargarEstablecimientos();
      this.cerrarModalEliminar();
    } catch (err: any) {
      const errorMessage = err instanceof HttpErrorResponse ? err.error?.mensaje || err.message : 'Error desconocido';
      this.toastService.showError(`Error al eliminar establecimiento: ${errorMessage}`);
    } finally {
      this.isDeleting.set(false);
    }
  }
}
