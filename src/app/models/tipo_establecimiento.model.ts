export interface ApiResponseTipoEstablecimiento<T> {
  codigoEstatus: number;
  mensaje: string;
  cuerpoDeRespuesta: T;
}

export interface TipoEstablecimientoDTO {
  fldNombre: string;
  fldDescripcion: string;
}

export interface ListTipoEstablecimientoDTO extends TipoEstablecimientoDTO {
  idTipoEstablecimiento: number;
}

export interface CreateTipoEstablecimientoDTO extends TipoEstablecimientoDTO {
  idTipoEstablecimiento: 0;
}

export interface EditTipoEstablecimientoDTO extends TipoEstablecimientoDTO {
  idTipoEstablecimiento: number;
}