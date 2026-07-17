
/**
 * Estructura base con los datos principales de un cliente.
 */
export interface BaseClienteDTO {
  fldNombre: string;
  fldNombreCorto: string;
  fldTelefono: string;
  fldCorreoElectronico: string;
  fldImagenPerfil?: string;
  fldFechaNacimiento?: string;
  idSuscripcion: number;
}

//usado en el DTO para el multi part datos en la edicion
export interface ClienteCreateDTO extends BaseClienteDTO {
  idCliente: 0;
  fldContrasenia: string;
}

//usado en el DTO para el multi part datos en la edicion 
export interface ClienteEditDTO extends BaseClienteDTO {
  idCliente: number;
  fldContrasenia?: string;
}

export interface ClienteListDTO extends BaseClienteDTO {
  idCLiente: number;
  fldSuscripcion: string;
}

export interface ApiResponseCliente<T> {
  codigoEstatus: number;
  mensaje: string;
  cuerpoDeRespuesta: T;
}


