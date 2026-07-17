
export interface ApiResponseSuscipcion<T> {
  codigoEstatus: number;
  mensaje: string;
  cuerpoDeRespuesta: T;
}

export interface SuscripcionBaseDTO 
{
  fldNombre: string;
  fldDescripcion: string;
  fldPrecio: number;
  fldEsSuscripcionDeCliente: boolean;
}

export interface ListSuscripcionDTO extends SuscripcionBaseDTO 
{
  idSuscripcion: number;
}

export interface CreateSuscripcionDTO extends SuscripcionBaseDTO {
  idSuscripcion: number|null;
}

export interface EditSuscripcionDTO extends SuscripcionBaseDTO 
{
  idSuscripcion: number;
}
