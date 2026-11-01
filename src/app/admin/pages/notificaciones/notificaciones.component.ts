import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/modal/confirm-dialog.component';
import { ToastService } from '../../../shared/services/toast.service';
import { NotificacionesAdminService } from '../../../services/notificaciones-admin.service';
import { EstablecimientosService } from '../../../services/establecimientos.service';
import { EstablecimientoListDTO } from '../../../models/establecimiento.model';
import {
  AudienciaNotificacion,
  EnviarNotificacionRequest,
  EnvioNotificacionResponse,
  HistorialNotificacionDTO,
  ResumenNotificacionesDTO,
  TipoNotificacion,
} from '../../../models/notificacion-admin.model';
import { TableColumn } from '../../../shared/models/table.model';
import { cargarListadoCompleto } from '../../../utils/cargar-listado-completo';

const FORMATO_FECHA = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' });

function formatearFecha(valor: string): string {
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? valor : FORMATO_FECHA.format(fecha);
}

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent, ConfirmDialogComponent],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.css',
})
export class NotificacionesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(NotificacionesAdminService);
  private readonly establecimientosService = inject(EstablecimientosService);
  private readonly toast = inject(ToastService);

  readonly resumen = signal<ResumenNotificacionesDTO | null>(null);
  readonly resumenError = signal('');
  readonly historial = signal<HistorialNotificacionDTO[]>([]);
  readonly historialLoading = signal(true);
  readonly historialError = signal('');
  readonly establecimientos = signal<EstablecimientoListDTO[]>([]);
  readonly cargandoEstablecimientos = signal(false);
  readonly guardando = signal(false);
  readonly mostrarConfirmacion = signal(false);
  readonly resultado = signal<EnvioNotificacionResponse | null>(null);
  readonly idsError = signal('');
  readonly urlError = signal('');

  readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(65)]],
    mensaje: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(240)]],
    audiencia: ['TODOS' as AudienciaNotificacion],
    idsClientes: [''],
    tipo: ['GENERAL' as TipoNotificacion],
    idDestino: [''],
    imagenUrl: [''],
  });

  readonly columns: TableColumn<HistorialNotificacionDTO>[] = [
    { key: 'fechaEnvio', label: 'Fecha', sortable: true, format: row => formatearFecha(row.fechaEnvio) },
    { key: 'titulo', label: 'Título', sortable: true },
    { key: 'tipo', label: 'Tipo', sortable: true },
    { key: 'audiencia', label: 'Audiencia', sortable: true },
    { key: 'enviados', label: 'Enviados / fallidos', format: row => `${row.enviados} / ${row.fallidos}` },
    { key: 'nombreUsuario', label: 'Usuario', sortable: true },
  ];

  readonly requiereDestino = computed(() => this.form.controls.tipo.value !== 'GENERAL');
  readonly requiereEstablecimiento = computed(() => ['ESTABLECIMIENTO', 'PROMO'].includes(this.form.controls.tipo.value));
  readonly opcionesEstablecimiento = computed(() => this.establecimientos());
  readonly filasHistorial = computed(() => this.historial());
  readonly totalConfirmacion = computed(() => this.resumen()?.tokensActivos ?? 0);
  readonly trackNotificacion = (_index: number, row: HistorialNotificacionDTO) => row.idNotificacion;

  ngOnInit(): void {
    this.cargarResumen();
    this.cargarHistorial();
    this.cargarEstablecimientos();
  }

  cargarResumen(): void {
    this.resumenError.set('');
    this.service.obtenerResumen().subscribe({
      next: response => {
        if (response?.codigoEstatus === 1 && response.cuerpoDeRespuesta) this.resumen.set(response.cuerpoDeRespuesta);
        else this.resumenError.set(response?.mensaje || 'No se pudo cargar el resumen.');
      },
      error: () => this.resumenError.set('No se pudo cargar el resumen de dispositivos.'),
    });
  }

  cargarHistorial(): void {
    this.historialLoading.set(true);
    this.historialError.set('');
    this.service.obtenerHistorial().subscribe({
      next: response => {
        this.historial.set(response?.codigoEstatus === 1 ? response.cuerpoDeRespuesta ?? [] : []);
        this.historialLoading.set(false);
      },
      error: () => {
        this.historialError.set('No se pudo cargar el historial de notificaciones.');
        this.historialLoading.set(false);
      },
    });
  }

  async cargarEstablecimientos(): Promise<void> {
    this.cargandoEstablecimientos.set(true);
    try {
      const lista = await cargarListadoCompleto((pagina, tamano) =>
        this.establecimientosService.obtenerEstablecimientos(pagina, tamano));
      this.establecimientos.set(lista);
    } catch {
      this.toast.showError('No se pudieron cargar los establecimientos para la notificación.');
    } finally {
      this.cargandoEstablecimientos.set(false);
    }
  }

  actualizarAudiencia(audiencia: AudienciaNotificacion): void {
    this.form.controls.audiencia.setValue(audiencia);
    this.idsError.set('');
  }

  actualizarTipo(tipo: TipoNotificacion): void {
    this.form.controls.tipo.setValue(tipo);
    if (tipo === 'GENERAL') this.form.controls.idDestino.setValue('');
  }

  contarCaracteres(campo: 'titulo' | 'mensaje'): number {
    return this.form.controls[campo].value.length;
  }

  idsParseados(): number[] {
    return [...new Set(this.form.controls.idsClientes.value.split(/[\s,;]+/).filter(Boolean).map(Number))];
  }

  validarIds(): boolean {
    if (this.form.controls.audiencia.value !== 'CLIENTES') {
      this.idsError.set('');
      return true;
    }
    const raw = this.form.controls.idsClientes.value.split(/[\s,;]+/).filter(Boolean);
    const ids = this.idsParseados();
    const validos = raw.length > 0 && raw.length <= 500 && ids.every(id => Number.isInteger(id) && id > 0);
    this.idsError.set(validos ? '' : 'Ingresa de 1 a 500 IDs de cliente positivos.');
    return validos;
  }

  validarUrl(): boolean {
    const value = this.form.controls.imagenUrl.value.trim();
    if (!value) {
      this.urlError.set('');
      return true;
    }
    try {
      const url = new URL(value);
      const valid = url.protocol === 'http:' || url.protocol === 'https:';
      this.urlError.set(valid ? '' : 'La imagen debe usar una URL HTTP o HTTPS.');
      return valid;
    } catch {
      this.urlError.set('Ingresa una URL válida con HTTP o HTTPS.');
      return false;
    }
  }

  solicitarConfirmacion(): void {
    this.form.markAllAsTouched();
    const destino = this.form.controls.tipo.value === 'GENERAL' || Number(this.form.controls.idDestino.value) > 0;
    if (this.form.invalid || !destino || !this.validarIds() || !this.validarUrl()) {
      if (!destino) this.form.controls.idDestino.markAsTouched();
      return;
    }
    this.mostrarConfirmacion.set(true);
  }

  enviar(): void {
    if (this.guardando()) return;
    const request = this.crearRequest();
    this.guardando.set(true);
    this.resultado.set(null);
    this.service.enviar(request).subscribe({
      next: response => {
        if (response?.codigoEstatus !== 1 || !response.cuerpoDeRespuesta) {
          this.toast.showError(response?.mensaje || 'No se pudo enviar la notificación.');
        } else {
          this.resultado.set(response.cuerpoDeRespuesta);
          this.toast.showSuccess(`Notificación procesada: ${response.cuerpoDeRespuesta.enviados} enviados, ${response.cuerpoDeRespuesta.fallidos} fallidos.`);
          this.cargarHistorial();
        }
        this.guardando.set(false);
        this.mostrarConfirmacion.set(false);
      },
      error: (error: HttpErrorResponse) => {
        const mensaje = error.error?.mensaje || error.message;
        if (error.status === 400 && String(mensaje).includes('No hay dispositivos registrados')) {
          this.toast.showError('No hay dispositivos registrados para esa audiencia. Registra clientes con notificaciones activas antes de enviar.');
        } else {
          this.toast.showError(mensaje || 'No se pudo enviar la notificación.');
        }
        this.guardando.set(false);
        this.mostrarConfirmacion.set(false);
      },
    });
  }

  cancelarConfirmacion(): void {
    if (!this.guardando()) this.mostrarConfirmacion.set(false);
  }

  nombreEstablecimiento(id: number): string {
    return this.establecimientos().find(item => item.idEstablecimiento === id)?.fldNombre ?? `Establecimiento #${id}`;
  }

  private crearRequest(): EnviarNotificacionRequest {
    const value = this.form.getRawValue();
    const request: EnviarNotificacionRequest = {
      titulo: value.titulo.trim(),
      mensaje: value.mensaje.trim(),
      audiencia: value.audiencia,
      tipo: value.tipo,
    };
    if (value.audiencia === 'CLIENTES') request.idsClientes = this.idsParseados();
    if (value.tipo !== 'GENERAL') request.idDestino = Number(value.idDestino);
    if (value.imagenUrl.trim()) request.imagenUrl = value.imagenUrl.trim();
    return request;
  }
}
