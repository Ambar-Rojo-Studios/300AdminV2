
export interface BasePromocionDTO{
  fldNombre: string,
  fldDescripcion: string,
  fldFechaInicio: string,
  fldFechaFin: string,
  fldCodigoValidacion: string,
  diasDisponibles: string[] | null,
  tipoPromocion: string | null
}

export interface listarPromocionesDTO extends BasePromocionDTO 
{
  idPromocion: number;  
  fldSuscripcion:string,
  fldEstablecimiento: string,
}

export interface CrearPromocionDTO extends BasePromocionDTO 
{
  idPromocion: 0;
  fkIdSuscripcion: number;
  fkIdEstablecimiento: number;
  fldImagen: string;
}

export interface EditarPromocionDTO extends BasePromocionDTO 
{
  idPromocion: number;
  fkIdSuscripcion: number;
  fkIdEstablecimiento: number;
  fldImagen: string;
}

export interface ApiResponsivePromocion<T> 
{
    codigoEstatus: number;
    mensaje: string;
    cuerpoDeRespuesta: T;
}       
