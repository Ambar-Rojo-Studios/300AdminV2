/**
 * DTO utilizado para mostrar información resumida de un establecimiento en filtros o listados.
 */
export interface EstablecimientoResponseDTO {
  idEstablecimiento: number;
  fldHorarioApertura: string;
  fldHorarioCierre: string;
  fldNombre: string;
  fldDireccion: string;
  fldReferenciaGeografica: string;
  fldCoodLongitud: string;
  fldCoorLatitud: string;
  fldImgRefs: string;
}

export interface idEstablecimiento {
  idEstablecimiento: number;
  fkIdSuscripcion: number;
  fkIdEmpresa: number;
  fldTipoEstablecimiento: number | null;
  fldNombre: string;
  fldDescripcion: string;
  fldEstado: string;
  fldCiudad: string;
  fldDireccion: string;
  fldReferenciaGeografica: string;
  fldCoordLatitud: string;
  fldCoordLongitud: string;
  fldCorreoElectronico: string;
  fldSugerenciaDeLaCasa: string;
  fldImgRefs: string;
  fldMenu: string | null;
  fldHorarioApertura: string;
  fldHorarioCierre: string;
  fldLunes: boolean;
  fldMartes: boolean;
  fldMiercoles: boolean;
  fldJueves: boolean;
  fldViernes: boolean;
  fldSabado: boolean;
  fldDomingo: boolean;
}

export interface BaseEstablecimientoDTO {
  fkIdSuscripcion: number;
  fkIdEmpresa: number;
  fkIdTipoEstablecimiento: number | null;

  fldNombre: string;
  fldEstado: string;
  fldCiudad: string;
  /** Agregado: el backend lo devuelve/espera (EstablecimientoDTO), no editable desde este form todavía. */
  fldZona: string | null;
  fldDireccion: string;
  fldReferenciaGeografica: string;
  fldCoordLatitud: string;
  fldCoordLongitud: string;

  fldDescripcion: string | null;
  fldCorreoElectronico: string | null;
  fldSugerenciaDeLaCasa: string | null;

  /**
   * Campos legacy: el backend los sigue devolviendo en las respuestas por compatibilidad,
   * pero YA NO son la fuente de verdad para editar. Para eso ahora usa imagenesPerfil/imagenesMenu.
   */
  fldImgRefs: string | null;
  fldImgRefs2: string | null;
  fldImgRefs3: string | null;
  fldImgRefs4: string | null;
  fldMenu: string | null;

  /**
   * Fuente de verdad ACTUAL de las imágenes (sincronización por arreglo).
   * Al editar: hay que mandar aquí las URLs existentes que se quieren CONSERVAR;
   * cualquier URL que no se incluya se BORRA (BD + Supabase). Ver EstablecimientosService.editEstablecimiento.
   */
  imagenesPerfil: string[];
  imagenesMenu: string[];

  fldHorarioApertura: string | null;
  fldHorarioCierre: string | null;
  fldLunes: boolean | null;
  fldMartes: boolean | null;
  fldMiercoles: boolean | null;
  fldJueves: boolean | null;
  fldViernes: boolean | null;
  fldSabado: boolean | null;
  fldDomingo: boolean | null;
  fldCelular1: string | null;
  fldCelular2: string | null;
  fldCelularComentarios: string | null;
  fldAlimentosBebidas: string | null;
  fldTicketPromedio: string | null;
  fldAntiguedadAnios: number | null;
  fldPromoLunes: string | null;
  fldPromoMartes: string | null;
  fldPromoMiercoles: string | null;
  fldPromoJueves: string | null;
  fldPromoViernes: string | null;
  fldPromoSabado: string | null;
  fldPromoDomingo: string | null;
  fldPromo300Lugares: string | null;
}

export interface EstablecimientoCreateDTO extends BaseEstablecimientoDTO {
  idEstablecimiento: 0; // siempre 0 al crear
}

export interface EstablecimientoEditDTO extends BaseEstablecimientoDTO {
  idEstablecimiento: number; // >0 al editar
}

export interface EstablecimientoListDTO extends BaseEstablecimientoDTO {
  idEstablecimiento: number; // devuelto por API
}

export interface ApiResponseEstablecimiento<T> {
  codigoEstatus: number;
  mensaje: string;
  cuerpoDeRespuesta: T;
}
