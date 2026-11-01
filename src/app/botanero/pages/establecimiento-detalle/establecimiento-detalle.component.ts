import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit, DestroyRef, computed, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { EtiquetasListadoPublicComponent } from '../../../cliente/components/etiquetas-listado-public/etiquetas-listado-public.component';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BotaneroService } from '../../../services/botanero.service';
import { BotaneroStatsDTO, BotaneroEstablecimientoDTO, BotaneroPromosDTO, CanjesResumenBotaneroDTO } from '../../../models/botanero.model';
import { listarComentario } from '../../../models/comentario.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { EstablecimientoFormComponent } from '../../../shared/components/establecimiento-form/establecimiento-form.component';
import { CardEstablecimientoComponent } from '../../../cliente/components/card-establecimiento/card-establecimiento.component';
import { ToastService } from '../../../shared/services/toast.service';
import { TextareaFieldComponent } from '../../../shared/components/form-fields/textarea-field.component';
import { EstablecimientoFormSubmitEvent, EstablecimientoFormValue } from '../../../shared/models/establecimiento-form.model';
import { imagenesAConservar } from '../../../utils/imagenes-conservadas';
import { pendientesFicha } from '../../../utils/estado-ficha';
import { EstablecimientoListDTO } from '../../../models/establecimiento.model';

/** Los 7 días + la promo 300 Lugares, en el orden en que se pintan en el modal. */
export const DIAS_PROMO = [
  { key: 'fldPromoLunes', label: 'Lunes' },
  { key: 'fldPromoMartes', label: 'Martes' },
  { key: 'fldPromoMiercoles', label: 'Miércoles' },
  { key: 'fldPromoJueves', label: 'Jueves' },
  { key: 'fldPromoViernes', label: 'Viernes' },
  { key: 'fldPromoSabado', label: 'Sábado' },
  { key: 'fldPromoDomingo', label: 'Domingo' },
] as const satisfies readonly { key: keyof BotaneroPromosDTO; label: string }[];

const DIAS_LABORALES = DIAS_PROMO.slice(0, 5).map(dia => dia.key);
const CLAVE_PROMO_HOY: Record<string, keyof BotaneroPromosDTO> = {
  Mon: 'fldPromoLunes', Tue: 'fldPromoMartes', Wed: 'fldPromoMiercoles',
  Thu: 'fldPromoJueves', Fri: 'fldPromoViernes', Sat: 'fldPromoSabado', Sun: 'fldPromoDomingo',
};

/** El backend hace nullToEmpty en todo, así que el form nunca manda null. */
function dtoToPromos(dto: BotaneroEstablecimientoDTO): BotaneroPromosDTO {
  return {
    fldPromoLunes: dto.fldPromoLunes ?? '',
    fldPromoMartes: dto.fldPromoMartes ?? '',
    fldPromoMiercoles: dto.fldPromoMiercoles ?? '',
    fldPromoJueves: dto.fldPromoJueves ?? '',
    fldPromoViernes: dto.fldPromoViernes ?? '',
    fldPromoSabado: dto.fldPromoSabado ?? '',
    fldPromoDomingo: dto.fldPromoDomingo ?? '',
    fldPromo300Lugares: dto.fldPromo300Lugares ?? '',
  };
}

/**
 * Convierte lo que devuelve /api/botanero/establecimientos/{id} al shape
 * agnóstico que espera <app-establecimiento-form>.
 */
function dtoToFormValue(dto: BotaneroEstablecimientoDTO): EstablecimientoFormValue {
  return {
    idEstablecimiento: dto.idEstablecimiento,
    fkIdEmpresa: dto.fkIdEmpresa,
    fkIdSuscripcion: dto.fkIdSuscripcion,
    fkIdTipoEstablecimiento: dto.fkIdTipoEstablecimiento,

    fldNombre: dto.fldNombre,
    fldDescripcion: dto.fldDescripcion,

    fldEstado: dto.fldEstado,
    fldCiudad: dto.fldCiudad,
    fldDireccion: dto.fldDireccion,
    fldReferenciaGeografica: dto.fldReferenciaGeografica,
    fldCoordLatitud: dto.fldCoordLatitud,
    fldCoordLongitud: dto.fldCoordLongitud,

    fldCorreoElectronico: dto.fldCorreoElectronico,
    fldSugerenciaDeLaCasa: dto.fldSugerenciaDeLaCasa,

    fldHorarioApertura: dto.fldHorarioApertura?.substring(0, 5) ?? '00:00',
    fldHorarioCierre: dto.fldHorarioCierre?.substring(0, 5) ?? '00:00',

    fldLunes: !!dto.fldLunes,
    fldMartes: !!dto.fldMartes,
    fldMiercoles: !!dto.fldMiercoles,
    fldJueves: !!dto.fldJueves,
    fldViernes: !!dto.fldViernes,
    fldSabado: !!dto.fldSabado,
    fldDomingo: !!dto.fldDomingo,

    fldCelular1: dto.fldCelular1,
    fldCelular2: dto.fldCelular2,
    fldCelularComentarios: dto.fldCelularComentarios,

    fldAlimentosBebidas: dto.fldAlimentosBebidas,
    fldTicketPromedio: dto.fldTicketPromedio,
    fldAntiguedadAnios: dto.fldAntiguedadAnios,

    fldImgRefs: dto.imagenesPerfil?.[0] ?? null,
    fldImgRefs2: dto.imagenesPerfil?.[1] ?? null,
    fldImgRefs3: dto.imagenesPerfil?.[2] ?? null,
    fldImgRefs4: dto.imagenesPerfil?.[3] ?? null,
    fldMenu: dto.imagenesMenu?.[0] ?? null,
    imagenesPerfil: dto.imagenesPerfil, imagenesMenu: dto.imagenesMenu,
    fldImgRefs5: dto.imagenesPerfil?.[4] ?? null, fldMenu2: dto.imagenesMenu?.[1] ?? null,
  };
}

@Component({
  selector: 'app-establecimiento-detalle',
  standalone: true,
  imports: [CommonModule, EtiquetasListadoPublicComponent, FormsModule, RouterLink, LoadingSpinnerComponent, ModalComponent, EstablecimientoFormComponent, TextareaFieldComponent, CardEstablecimientoComponent],
  templateUrl: './establecimiento-detalle.component.html',
  styleUrls: ['./establecimiento-detalle.component.css']
})
export class EstablecimientoDetalleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly botaneroService = inject(BotaneroService);
  private readonly toastService = inject(ToastService);
  private readonly formularioEditor = viewChild(EstablecimientoFormComponent);

  private readonly destroyRef = inject(DestroyRef);
  private consultas = new Subscription();
  readonly formDirty = signal(false);
  readonly statsLoading = signal(false);
  readonly statsError = signal('');
  readonly canjesLoading = signal(false);
  readonly canjesError = signal('');
  readonly canjesResumen = signal<CanjesResumenBotaneroDTO | null>(null);
  readonly comentariosLoading = signal(false);
  readonly comentariosError = signal('');
  lugar = signal<BotaneroEstablecimientoDTO | null>(null);
  stats = signal<BotaneroStatsDTO | null>(null);
  comentarios = signal<listarComentario[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  showFormModal = signal(false);
  guardando = signal(false);
  formValue = signal<EstablecimientoFormValue | null>(null);

  readonly diasPromo = DIAS_PROMO;
  showPromosModal = signal(false);
  guardandoPromos = signal(false);
  promos: BotaneroPromosDTO | null = null;
  readonly diaOrigenCopia = signal<keyof BotaneroPromosDTO>('fldPromoLunes');
  readonly mostrarVistaPrevia = signal(false);

  readonly fichaCompletitud = computed(() => {
    const lugar = this.lugar();
    if (!lugar) return { porcentaje: 0, faltantes: [] as { key: string; nombre: string }[] };
    const faltanFicha = pendientesFicha(lugar);
    const diasSinPromo = DIAS_PROMO.every(dia => !lugar[dia.key]?.trim());
    const secciones = [
      { key: 'foto', nombre: 'Foto de perfil', falta: faltanFicha.includes('Fotos') },
      { key: 'horarios', nombre: 'Horarios', falta: faltanFicha.includes('Horario') },
      { key: 'promos', nombre: 'Promociones', falta: diasSinPromo },
      { key: 'menu', nombre: 'Menú', falta: faltanFicha.includes('Menú') },
    ];
    const faltantes = secciones.filter(seccion => seccion.falta).map(({ key, nombre }) => ({ key, nombre }));
    return { porcentaje: Math.round(((secciones.length - faltantes.length) / secciones.length) * 100), faltantes };
  });

  readonly sinPromoHoy = computed(() => {
    const lugar = this.lugar();
    if (!lugar) return false;
    const dia = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', weekday: 'short' }).format(new Date());
    const clave = CLAVE_PROMO_HOY[dia];
    return !!clave && !lugar[clave]?.trim();
  });

  readonly fichasVistaPrevia = computed<EstablecimientoListDTO[]>(() => {
    const lugar = this.lugar();
    if (!lugar) return [];
    const editor = this.formularioEditor();
    const values = editor?.form() ?? dtoToFormValue(lugar);
    const filePreview = editor?.filePreviews().foto;
    const imagen = filePreview
      ? `data:image/jpeg;base64,${filePreview}`
      : lugar.imagenesPerfil?.[0] ?? '';
    return [{
      ...lugar,
      fldNombre: values.fldNombre,
      fldDescripcion: values.fldDescripcion ?? '',
      fldSugerenciaDeLaCasa: values.fldSugerenciaDeLaCasa ?? '',
      fldImgRefs: imagen,
      imagenesPerfil: imagen ? [imagen] : [],
    } as EstablecimientoListDTO];
  });

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.consultas.unsubscribe());
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => this.cargarVista(Number(params.get('id'))));
  }

  cargarVista(id = this.lugar()?.idEstablecimiento ?? Number(this.route.snapshot.paramMap.get('id'))): void {
    this.consultas.unsubscribe(); this.consultas = new Subscription();
    this.lugar.set(null); this.stats.set(null); this.canjesResumen.set(null); this.comentarios.set([]);
    this.error.set(null); this.cargando.set(true);
    this.showFormModal.set(false); this.showPromosModal.set(false);
    if (!Number.isInteger(id) || id <= 0) { this.error.set('Establecimiento no válido.'); this.cargando.set(false); return; }
    this.consultas.add(this.botaneroService.obtenerEstablecimiento(id).subscribe({
      next: respuesta => {
        if (respuesta?.codigoEstatus !== 1 || !respuesta.cuerpoDeRespuesta) this.error.set('No se encontró este establecimiento.');
        else this.lugar.set(respuesta.cuerpoDeRespuesta);
        this.cargando.set(false);
      },
      error: () => { this.error.set('No pudimos cargar el establecimiento.'); this.cargando.set(false); }
    }));
    this.cargarStats(id); this.cargarCanjes(id); this.cargarComentarios(id);
  }

  cargarStats(id = this.lugar()?.idEstablecimiento): void {
    if (!id) return;
    this.statsLoading.set(true); this.statsError.set('');
    this.consultas.add(this.botaneroService.obtenerStats(id).subscribe({
      next: r => {
        if (r?.codigoEstatus === 1 && r.cuerpoDeRespuesta) this.stats.set(r.cuerpoDeRespuesta);
        else this.statsError.set('No se pudieron cargar las estadísticas.');
        this.statsLoading.set(false);
      },
      error: () => { this.statsError.set('No se pudieron cargar las estadísticas.'); this.statsLoading.set(false); }
    }));
  }

  cargarCanjes(id = this.lugar()?.idEstablecimiento): void {
    if (!id) return;
    this.canjesLoading.set(true); this.canjesError.set('');
    this.consultas.add(this.botaneroService.obtenerCanjesResumen(id).subscribe({
      next: response => {
        if (response?.codigoEstatus === 1 && response.cuerpoDeRespuesta) this.canjesResumen.set(response.cuerpoDeRespuesta);
        else this.canjesError.set('No se pudieron cargar los canjes.');
        this.canjesLoading.set(false);
      },
      error: () => { this.canjesError.set('No se pudieron cargar los canjes.'); this.canjesLoading.set(false); },
    }));
  }

  cargarComentarios(id = this.lugar()?.idEstablecimiento): void {
    if (!id) return;
    this.comentariosLoading.set(true); this.comentariosError.set('');
    this.consultas.add(this.botaneroService.listarComentarios(id).subscribe({
      next: r => {
        if (r && r.codigoEstatus !== 1) this.comentariosError.set('No se pudieron cargar los comentarios.');
        else this.comentarios.set(r?.cuerpoDeRespuesta ?? []);
        this.comentariosLoading.set(false);
      },
      error: () => { this.comentariosError.set('No se pudieron cargar los comentarios.'); this.comentariosLoading.set(false); }
    }));
  }

  abrirModalEditar(): void {
    const lugar = this.lugar();
    if (!lugar) return;
    this.formDirty.set(false);
    this.formValue.set(dtoToFormValue(lugar));
    this.showFormModal.set(true);
  }

  cerrarModalEditar(): void {
    if (!this.guardando()) {
      this.showFormModal.set(false);
      this.mostrarVistaPrevia.set(false);
    }
  }

  abrirModalPromos(): void {
    const lugar = this.lugar();
    if (!lugar) return;
    this.promos = dtoToPromos(lugar);
    this.diaOrigenCopia.set('fldPromoLunes');
    this.showPromosModal.set(true);
  }

  copiarPromoATodos(): void {
    this.copiarPromoA(this.diasPromo.map(dia => dia.key));
  }

  copiarPromoALunesAViernes(): void {
    this.copiarPromoA(DIAS_LABORALES);
  }

  completarFicha(key: string): void {
    if (key === 'promos') {
      this.abrirModalPromos();
      return;
    }
    this.abrirModalEditar();
  }

  abrirVistaPrevia(): void {
    this.mostrarVistaPrevia.set(true);
  }

  cerrarVistaPrevia(): void {
    this.mostrarVistaPrevia.set(false);
  }

  private copiarPromoA(destinos: readonly (keyof BotaneroPromosDTO)[]): void {
    if (!this.promos) return;
    const texto = this.promos[this.diaOrigenCopia()];
    this.promos = { ...this.promos, ...Object.fromEntries(destinos.map(dia => [dia, texto])) };
  }

  cerrarModalPromos(): void {
    if (!this.guardandoPromos()) this.showPromosModal.set(false);
  }

  promosDirty(): boolean {
    const lugar = this.lugar();
    return !!lugar && !!this.promos && JSON.stringify(this.promos) !== JSON.stringify(dtoToPromos(lugar));
  }

  guardarPromos(): void {
    const lugar = this.lugar();
    if (!lugar || !this.promos || this.guardandoPromos()) return;

    this.guardandoPromos.set(true);
    this.botaneroService.editarPromos(lugar.idEstablecimiento, this.promos).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (respuesta) => {
        if (respuesta?.codigoEstatus !== 1 || !respuesta.cuerpoDeRespuesta) {
          this.toastService.showError(respuesta?.mensaje || 'No se guardaron los cambios.');
          this.guardando.set(false); this.guardandoPromos.set(false); return;
        }
        this.lugar.set(respuesta.cuerpoDeRespuesta);
        this.toastService.showSuccess('Promociones actualizadas correctamente.');
        this.guardandoPromos.set(false);
        this.showPromosModal.set(false);
      },
      error: (err) => {
        this.toastService.showError(err?.error?.mensaje || 'Error al actualizar las promociones.');
        this.guardandoPromos.set(false);
      }
    });
  }

  onEstablecimientoSubmit(event: EstablecimientoFormSubmitEvent): void {
    const lugar = this.lugar();
    if (!lugar || this.guardando()) return;

    const { values, files } = event;

    // El backend consume multipart/form-data con las partes "datos" (JSON), "perfil" y "menu".
    // fldZona, fkIdEmpresa/fkIdSuscripcion y las promos no se tocan desde este formulario:
    // se preservan tal cual venían del establecimiento original.
    const datos = {
      idEstablecimiento: values.idEstablecimiento,
      fkIdSuscripcion: lugar.fkIdSuscripcion,
      fkIdEmpresa: lugar.fkIdEmpresa,
      fkIdTipoEstablecimiento: values.fkIdTipoEstablecimiento ?? lugar.fkIdTipoEstablecimiento,
      fldNombre: values.fldNombre,
      fldDescripcion: values.fldDescripcion ?? '',
      fldEstado: values.fldEstado,
      fldCiudad: values.fldCiudad,
      fldZona: lugar.fldZona,
      fldDireccion: values.fldDireccion,
      fldReferenciaGeografica: values.fldReferenciaGeografica,
      fldCoordLatitud: values.fldCoordLatitud,
      fldCoordLongitud: values.fldCoordLongitud,
      fldCorreoElectronico: values.fldCorreoElectronico ?? '',
      fldSugerenciaDeLaCasa: values.fldSugerenciaDeLaCasa ?? '',
      fldHorarioApertura: values.fldHorarioApertura,
      fldHorarioCierre: values.fldHorarioCierre,
      fldLunes: values.fldLunes,
      fldMartes: values.fldMartes,
      fldMiercoles: values.fldMiercoles,
      fldJueves: values.fldJueves,
      fldViernes: values.fldViernes,
      fldSabado: values.fldSabado,
      fldDomingo: values.fldDomingo,
      fldCelular1: values.fldCelular1 ?? '',
      fldCelular2: values.fldCelular2 ?? '',
      fldCelularComentarios: values.fldCelularComentarios ?? '',
      fldAlimentosBebidas: values.fldAlimentosBebidas ?? '',
      fldTicketPromedio: values.fldTicketPromedio ?? '',
      fldAntiguedadAnios: values.fldAntiguedadAnios,
      fldPromoLunes: lugar.fldPromoLunes,
      fldPromoMartes: lugar.fldPromoMartes,
      fldPromoMiercoles: lugar.fldPromoMiercoles,
      fldPromoJueves: lugar.fldPromoJueves,
      fldPromoViernes: lugar.fldPromoViernes,
      fldPromoSabado: lugar.fldPromoSabado,
      fldPromoDomingo: lugar.fldPromoDomingo,
      fldPromo300Lugares: lugar.fldPromo300Lugares,
      ...imagenesAConservar(lugar.imagenesPerfil, lugar.imagenesMenu, files),
    };

    const formData = new FormData();
    formData.append('datos', new Blob([JSON.stringify(datos)], { type: 'application/json' }));
    [files.foto, files.foto2, files.foto3, files.foto4, files.foto5].forEach((f) => {
      if (f) formData.append('perfil', f, f.name);
    });
    [files.menu, files.menu2].forEach(file => { if (file) formData.append('menu', file, file.name); });

    this.guardando.set(true);
    this.botaneroService.editarEstablecimiento(lugar.idEstablecimiento, formData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (respuesta) => {
        if (respuesta?.codigoEstatus !== 1 || !respuesta.cuerpoDeRespuesta) {
          this.toastService.showError(respuesta?.mensaje || 'No se guardaron los cambios.');
          this.guardando.set(false); this.guardandoPromos.set(false); return;
        }
        this.lugar.set(respuesta.cuerpoDeRespuesta);
        this.toastService.showSuccess('Establecimiento actualizado correctamente.');
        this.guardando.set(false);
        this.showFormModal.set(false);
      },
      error: (err) => {
        this.toastService.showError(err?.error?.mensaje || 'Error al actualizar el establecimiento.');
        this.guardando.set(false);
      }
    });
  }
}
