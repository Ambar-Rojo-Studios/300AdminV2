import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BotaneroService } from '../../../services/botanero.service';
import { BotaneroStatsDTO, BotaneroEstablecimientoDTO } from '../../../models/botanero.model';
import { listarComentario } from '../../../models/comentario.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { EstablecimientoFormComponent } from '../../../shared/components/establecimiento-form/establecimiento-form.component';
import { ToastService } from '../../../shared/services/toast.service';
import { EstablecimientoFormSubmitEvent, EstablecimientoFormValue } from '../../../shared/models/establecimiento-form.model';

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
    fldImgRefs2: null,
    fldImgRefs3: null,
    fldImgRefs4: null,
    fldMenu: dto.imagenesMenu?.[0] ?? null,
  };
}

@Component({
  selector: 'app-establecimiento-detalle',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, ModalComponent, EstablecimientoFormComponent],
  templateUrl: './establecimiento-detalle.component.html',
  styleUrls: ['./establecimiento-detalle.component.css']
})
export class EstablecimientoDetalleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly botaneroService = inject(BotaneroService);
  private readonly toastService = inject(ToastService);

  lugar = signal<BotaneroEstablecimientoDTO | null>(null);
  stats = signal<BotaneroStatsDTO | null>(null);
  comentarios = signal<listarComentario[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  showFormModal = signal(false);
  guardando = signal(false);
  formValue = signal<EstablecimientoFormValue | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set('Establecimiento no válido.');
      this.cargando.set(false);
      return;
    }

    this.cargarEstablecimiento(id);

    // Stats y comentarios son secundarios: si fallan, la página sigue viva
    this.botaneroService.obtenerStats(id).subscribe({
      next: (r) => this.stats.set(r.cuerpoDeRespuesta),
      error: () => {}
    });
    this.botaneroService.listarComentarios(id).subscribe({
      next: (r) => this.comentarios.set(r.cuerpoDeRespuesta ?? []),
      error: () => {}
    });
  }

  private cargarEstablecimiento(id: number): void {
    this.botaneroService.obtenerEstablecimiento(id).subscribe({
      next: (respuesta) => {
        this.lugar.set(respuesta.cuerpoDeRespuesta);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el establecimiento (¿pertenece a tu empresa?).');
        this.cargando.set(false);
      }
    });
  }

  abrirModalEditar(): void {
    const lugar = this.lugar();
    if (!lugar) return;
    this.formValue.set(dtoToFormValue(lugar));
    this.showFormModal.set(true);
  }

  cerrarModalEditar(): void {
    this.showFormModal.set(false);
  }

  onEstablecimientoSubmit(event: EstablecimientoFormSubmitEvent): void {
    const lugar = this.lugar();
    if (!lugar) return;

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
    };

    const formData = new FormData();
    formData.append('datos', new Blob([JSON.stringify(datos)], { type: 'application/json' }));
    if (files.foto) formData.append('perfil', files.foto);
    if (files.menu) formData.append('menu', files.menu);

    this.guardando.set(true);
    this.botaneroService.editarEstablecimiento(lugar.idEstablecimiento, formData).subscribe({
      next: (respuesta) => {
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
