export type EstablecimientoFormMode = 'admin' | 'botanero';

export interface DiaSemanaKey {
  fldLunes: boolean;
  fldMartes: boolean;
  fldMiercoles: boolean;
  fldJueves: boolean;
  fldViernes: boolean;
  fldSabado: boolean;
  fldDomingo: boolean;
}

/** Valores editables del formulario (sin archivos). */
export interface EstablecimientoFormValue extends DiaSemanaKey {
  idEstablecimiento: number; // 0 = creación

  // Solo relevantes en modo admin (el botanero opera sobre su propia empresa/suscripción).
  fkIdEmpresa: number | null;
  fkIdSuscripcion: number | null;

  fkIdTipoEstablecimiento: number | null;

  fldNombre: string;
  fldDescripcion: string | null;

  fldEstado: string;
  fldCiudad: string;
  fldDireccion: string;
  fldReferenciaGeografica: string;
  fldCoordLatitud: string;
  fldCoordLongitud: string;

  fldCorreoElectronico: string | null;
  fldSugerenciaDeLaCasa: string | null;

  fldHorarioApertura: string | null; // HH:MM o HH:MM:SS
  fldHorarioCierre: string | null;

  fldCelular1: string | null;
  fldCelular2: string | null;
  fldCelularComentarios: string | null;

  fldAlimentosBebidas: string | null;
  fldTicketPromedio: string | null;
  fldAntiguedadAnios: number | null;

  // URLs actuales de imágenes (solo lectura, para preview en edición).
  fldImgRefs: string | null;
  fldImgRefs2: string | null;
  fldImgRefs3: string | null;
  fldImgRefs4: string | null;
  fldMenu: string | null;
}

/** Archivos nuevos seleccionados por el usuario (null = sin cambios / no aplica). */
export interface EstablecimientoFormFiles {
  foto: File | null;
  foto2: File | null;
  foto3: File | null;
  foto4: File | null;
  menu: File | null;
}

/** Payload emitido al enviar el formulario. */
export interface EstablecimientoFormSubmitEvent {
  values: EstablecimientoFormValue;
  files: EstablecimientoFormFiles;
}

export function getEmptyEstablecimientoFormValue(): EstablecimientoFormValue {
  return {
    idEstablecimiento: 0,
    fkIdEmpresa: null,
    fkIdSuscripcion: null,
    fkIdTipoEstablecimiento: null,

    fldNombre: '',
    fldDescripcion: null,

    fldEstado: '',
    fldCiudad: '',
    fldDireccion: '',
    fldReferenciaGeografica: '',
    fldCoordLatitud: '',
    fldCoordLongitud: '',

    fldCorreoElectronico: null,
    fldSugerenciaDeLaCasa: null,

    fldHorarioApertura: null,
    fldHorarioCierre: null,

    fldLunes: false,
    fldMartes: false,
    fldMiercoles: false,
    fldJueves: false,
    fldViernes: false,
    fldSabado: false,
    fldDomingo: false,

    fldCelular1: null,
    fldCelular2: null,
    fldCelularComentarios: null,

    fldAlimentosBebidas: null,
    fldTicketPromedio: null,
    fldAntiguedadAnios: null,

    fldImgRefs: null,
    fldImgRefs2: null,
    fldImgRefs3: null,
    fldImgRefs4: null,
    fldMenu: null,
  };
}
