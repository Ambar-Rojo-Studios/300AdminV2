import { CommonModule } from '@angular/common';
import { Component, ElementRef, Injector, afterNextRender, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { TextFieldComponent } from '../form-fields/text-field.component';
import { TextareaFieldComponent } from '../form-fields/textarea-field.component';
import { SelectFieldComponent, SelectOption } from '../form-fields/select-field.component';
import { FileFieldComponent } from '../form-fields/file-field.component';
import { MapaEstablecimientoComponent, MapaEstablecimientoCoords } from '../mapa-establecimiento/mapa-establecimiento.component';
import { EtiquetasSelectorComponent } from '../etiquetas-selector/etiquetas-selector.component';
import { EstablecimientoEtiquetasAdapter } from '../etiquetas-selector/adapters/establecimiento-etiquetas.adapter';
import { procesarYComprimirImagen } from '../../../utils/image-processor';

import { ListEmpresaDTO } from '../../../models/empresa.model';
import { ListSuscripcionDTO } from '../../../models/suscripcion.model';
import { ListTipoEstablecimientoDTO } from '../../../models/tipo_establecimiento.model';
import {
  EstablecimientoFormFiles,
  EstablecimientoFormMode,
  EstablecimientoFormSubmitEvent,
  EstablecimientoFormValue,
  getEmptyEstablecimientoFormValue,
} from '../../models/establecimiento-form.model';

type DiaKey = keyof Pick<
  EstablecimientoFormValue,
  'fldLunes' | 'fldMartes' | 'fldMiercoles' | 'fldJueves' | 'fldViernes' | 'fldSabado' | 'fldDomingo'
>;

/**
 * Formulario ÚNICO de establecimiento, compartido entre /admin y /mi-lugar.
 *
 * Reemplaza al bloque de formulario que vivía dentro del componente de
 * ~900 líneas admin/pages/establecimiento/. No trae la tabla ni el CRUD:
 * solo colecta nombre, descripción, dirección, horarios, teléfonos, fotos
 * (con el procesador de imágenes de utils para las previews), menú,
 * sugerencia de la casa, etiquetas (componente unificado) y ubicación
 * (mapa único de Jhonatan en modo selección).
 *
 * El componente es "tonto" a propósito: no sabe hablar con
 * EstablecimientosService ni con BotaneroService. Al enviar, emite
 * `formSubmit` con los valores + archivos; cada consumidor arma su propio
 * payload:
 * - /admin (establecimientos-list) -> EstablecimientoCreateDTO/EditDTO + EstablecimientosService.
 * - /mi-lugar (establecimiento-detalle) -> BotaneroEstablecimientoDTO + BotaneroService.
 *
 * Uso:
 * ```html
 * <app-establecimiento-form
 *   [mode]="'admin'"
 *   [value]="establecimientoSeleccionado()"
 *   [empresas]="empresas()"
 *   [suscripciones]="suscripciones()"
 *   [tiposEstablecimiento]="tipos()"
 *   [saving]="isSaving()"
 *   formId="establecimientoForm"
 *   (formSubmit)="onEstablecimientoSubmit($event)"
 * ></app-establecimiento-form>
 * ```
 *
 * El botón de enviar normalmente vive fuera (en el footer del modal
 * genérico) usando `form="establecimientoForm"` (mismo patrón que
 * empresa.component.html).
 */
@Component({
  selector: 'app-establecimiento-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TextFieldComponent,
    TextareaFieldComponent,
    SelectFieldComponent,
    FileFieldComponent,
    MapaEstablecimientoComponent,
    EtiquetasSelectorComponent,
  ],
  styleUrl: './establecimiento-form.component.css',
  templateUrl: './establecimiento-form.component.html',
})
export class EstablecimientoFormComponent {
  private readonly injector = inject(Injector);
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');
  readonly establecimientoEtiquetasAdapter = inject(EstablecimientoEtiquetasAdapter);

  /** admin: muestra empresa/suscripción. botanero: esos campos los fija el backend con el token. */
  mode = input<EstablecimientoFormMode>('admin');

  /** Valor inicial. null/undefined = modo creación (formulario vacío). */
  value = input<EstablecimientoFormValue | null | undefined>(null);

  /** Catálogos para los selects, solo se usan en modo admin. */
  empresas = input<ListEmpresaDTO[]>([]);
  suscripciones = input<ListSuscripcionDTO[]>([]);
  tiposEstablecimiento = input<ListTipoEstablecimientoDTO[]>([]);

  /** Estado de guardado controlado por el padre (deshabilita inputs mientras persiste). */
  saving = input(false);

  /** Id del <form> nativo, para que el padre pueda enlazar un botón externo con `form="..."`. */
  formId = input('establecimiento-form');

  /** Se emite cuando el formulario es válido y el usuario confirma el envío. */
  formSubmit = output<EstablecimientoFormSubmitEvent>();
  dirtyChange = output<boolean>();
  readonly processing = signal<Partial<Record<keyof EstablecimientoFormFiles, boolean>>>({});
  readonly processingFiles = computed(() => Object.values(this.processing()).some(Boolean));
  readonly dirty = computed(() => JSON.stringify(this.form()) !== JSON.stringify(this.initialForm()) || Object.values(this.files()).some(Boolean));
  private readonly initialForm = signal<EstablecimientoFormValue>(getEmptyEstablecimientoFormValue());
  private fileSequence = 0;
  private fileVersions: Partial<Record<keyof EstablecimientoFormFiles, number>> = {};


  form = signal<EstablecimientoFormValue>(getEmptyEstablecimientoFormValue());

  files = signal<EstablecimientoFormFiles>({ foto: null, foto2: null, foto3: null, foto4: null, menu: null });

  fileErrors = signal<Partial<Record<keyof EstablecimientoFormFiles, string>>>({});

  /** Previews en Base64 (sin prefijo data:) generadas por el procesador de imágenes al elegir un archivo nuevo. */
  filePreviews = signal<Partial<Record<keyof EstablecimientoFormFiles, string>>>({});

  /** Se pone en true la primera vez que el usuario intenta enviar; activa el marcado en rojo de campos vacíos. */
  attemptedSubmit = signal(false);

  /** Mensaje del banner de error mostrado arriba del formulario cuando faltan datos obligatorios. */
  formError = signal<string | null>(null);

  /** Lista legible de campos obligatorios que faltan por llenar (para el banner y, si se quiere, debug). */
  missingFields = computed<string[]>(() => {
    const f = this.form();
    const missing: string[] = [];
    if (!f.fldNombre.trim()) missing.push('Nombre');
    if (!f.fldEstado.trim()) missing.push('Estado');
    if (!f.fldCiudad.trim()) missing.push('Ciudad');
    if (!f.fldDireccion.trim()) missing.push('Dirección');
    if (!f.fldReferenciaGeografica.trim()) missing.push('Referencia geográfica');
    if (!f.fldHorarioApertura) missing.push('Horario de apertura');
    if (!f.fldHorarioCierre) missing.push('Horario de cierre');
    if (this.mode() === 'admin') {
      if (!f.fkIdEmpresa) missing.push('Empresa');
      if (!f.fkIdSuscripcion) missing.push('Suscripción');
    }
    if (this.esCreacion() && !this.files().foto) missing.push('Foto');
    return missing;
  });

  esCreacion = computed(() => this.form().idEstablecimiento === 0);

  diasSemana: { key: DiaKey; label: string }[] = [
    { key: 'fldLunes', label: 'Lunes' },
    { key: 'fldMartes', label: 'Martes' },
    { key: 'fldMiercoles', label: 'Miércoles' },
    { key: 'fldJueves', label: 'Jueves' },
    { key: 'fldViernes', label: 'Viernes' },
    { key: 'fldSabado', label: 'Sábado' },
    { key: 'fldDomingo', label: 'Domingo' },
  ];

  empresaOptions = computed<SelectOption[]>(() =>
    this.empresas().map((e) => ({ value: e.idEmpresa, label: e.fldNombre }))
  );

  suscripcionOptions = computed<SelectOption[]>(() =>
    this.suscripciones().map((s) => ({ value: s.idSuscripcion, label: s.fldNombre }))
  );

  tipoOptions = computed<SelectOption[]>(() =>
    this.tiposEstablecimiento().map((t) => ({ value: t.idTipoEstablecimiento, label: t.fldNombre }))
  );

  coordsActuales = computed<MapaEstablecimientoCoords | null>(() => {
    const f = this.form();
    if (!f.fldCoordLatitud || !f.fldCoordLongitud) return null;
    return { lat: f.fldCoordLatitud, lng: f.fldCoordLongitud };
  });

  constructor() {
    // Sincroniza el formulario interno cada vez que el padre cambia `value`
    // (abrir modal en modo crear -> null, o en modo editar -> el registro).
    effect(() => {
      const incoming = this.value();
      const initial = { ...getEmptyEstablecimientoFormValue(), ...incoming };
      initial.fldNombre ??= ''; initial.fldEstado ??= ''; initial.fldCiudad ??= '';
      initial.fldDireccion ??= ''; initial.fldReferenciaGeografica ??= '';
      initial.fldCoordLatitud ??= ''; initial.fldCoordLongitud ??= '';
      this.form.set(initial);
      this.initialForm.set(initial);
      this.files.set({ foto: null, foto2: null, foto3: null, foto4: null, menu: null });
      this.fileVersions = {};
      this.processing.set({});
      this.fileErrors.set({});
      this.filePreviews.set({});
      this.attemptedSubmit.set(false);
      this.formError.set(null);
    });
    effect(() => this.dirtyChange.emit(this.dirty()));
  }

  updateField<K extends keyof EstablecimientoFormValue>(key: K, value: EstablecimientoFormValue[K]): void {
    if (this.saving()) return;
    const normalized = key === 'fldAntiguedadAnios' && (value === '' || Number.isNaN(value)) ? null : value;
    this.form.update((f) => ({ ...f, [key]: normalized }));
  }

  onCoordsChange(coords: MapaEstablecimientoCoords): void {
    this.updateField('fldCoordLatitud', coords.lat);
    this.updateField('fldCoordLongitud', coords.lng);
  }

  /** Reformatea HH:MM -> HH:MM:00 al vuelo, igual que hacía el componente viejo. */
  onHorarioChange(field: 'fldHorarioApertura' | 'fldHorarioCierre', value: string): void {
    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
      this.updateField(field, `${value}:00`);
    } else if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(value)) {
      this.updateField(field, value);
    } else if (!value) {
      this.updateField(field, '');
    }
  }

  async onFileSelected(slot: keyof EstablecimientoFormFiles, fileOrFiles: File | File[] | null): Promise<void> {
    if (this.saving()) return;
    const version = ++this.fileSequence;
    this.fileVersions[slot] = version;
    const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] ?? null : fileOrFiles;

    if (!file) {
      this.processing.update(state => ({ ...state, [slot]: false }));
      this.files.update((f) => ({ ...f, [slot]: null }));
      this.filePreviews.update((p) => ({ ...p, [slot]: undefined }));
      this.fileErrors.update((errs) => ({ ...errs, [slot]: undefined }));
      return;
    }

    // El procesador de utils valida tipo/tamaño y devuelve un preview en Base64
    // ya redimensionado; el archivo original (sin comprimir) es el que se sube al backend.
    this.processing.update(state => ({ ...state, [slot]: true }));
    this.files.update(state => ({ ...state, [slot]: null }));
    const base64Preview = await procesarYComprimirImagen(file, (mensaje, tipo) => {
      if (tipo === 'error' && this.fileVersions[slot] === version) {
        this.fileErrors.update((errs) => ({ ...errs, [slot]: mensaje }));
      }
    });

    if (this.fileVersions[slot] !== version) return;
    this.processing.update(state => ({ ...state, [slot]: false }));
    if (!base64Preview) {
      this.files.update((f) => ({ ...f, [slot]: null }));
      this.filePreviews.update((p) => ({ ...p, [slot]: undefined }));
      return;
    }

    this.fileErrors.update((errs) => ({ ...errs, [slot]: undefined }));
    this.files.update((f) => ({ ...f, [slot]: file }));
    this.filePreviews.update((p) => ({ ...p, [slot]: base64Preview }));
  }

  /** Preview a mostrar en <app-file-field>: la del archivo recién elegido, o si no, la imagen ya guardada. */
  previewFor(slot: keyof EstablecimientoFormFiles, existingRef: string | null): string | null {
    const nuevo = this.filePreviews()[slot];
    if (nuevo) return `data:image/jpeg;base64,${nuevo}`;
    return existingRef;
  }

  handleSubmit(form: NgForm): void {
    if (this.saving()) return;
    if (this.processingFiles()) { this.reportError('Espera a que termine de procesarse la imagen.'); return; }

    this.attemptedSubmit.set(true);

    const missing = this.missingFields();
    if (missing.length > 0) {
      this.reportError(`Falta completar: ${missing.join(', ')}.`);
      return;
    }

    const errors: string[] = [];
    const f = this.form();
    if (f.fldCorreoElectronico && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.fldCorreoElectronico)) errors.push('Revisa el correo electrónico.');
    const lat = Number(f.fldCoordLatitud), lng = Number(f.fldCoordLongitud);
    if (!f.fldCoordLatitud.trim() || !f.fldCoordLongitud.trim() || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) errors.push('Selecciona una ubicación válida en el mapa o escribe sus coordenadas.');
    if (f.fldAntiguedadAnios != null && (!Number.isInteger(f.fldAntiguedadAnios) || f.fldAntiguedadAnios < 0)) errors.push('La antigüedad debe ser un número entero de años, igual o mayor que cero.');
    if (Object.values(this.fileErrors()).some(Boolean)) errors.push('Corrige los archivos marcados antes de guardar.');
    if (form.invalid) errors.push('Revisa los campos marcados.');
    if (errors.length) { this.reportError(errors.join(' ')); return; }
    this.formError.set(null);
    const values = { ...this.form() };
    this.formSubmit.emit({ values, files: { ...this.files() } });
  }

  private reportError(message: string): void {
    this.formError.set(message);
    afterNextRender(() => this.errorSummary()?.nativeElement.focus(), { injector: this.injector });
  }
}
