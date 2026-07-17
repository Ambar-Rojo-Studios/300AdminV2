
/**
 * Respuesta genérica de la API utilizada por las operaciones de empresas.
 */
export interface ApiResponse<T> {
  codigoEstatus: number;
  mensaje: string;
  cuerpoDeRespuesta: T;
}

export interface EmpresaBaseDTO {
  fldNombre: string;
  fldDescripcion: string;
  fldTelefono: string;
  fldCorreoElectronico: string;
  fldEstado: string;
  fldCiudad: string;
  fldDireccion: string;
  fldFechaCreacion: string;
  fldFechaUltimaModificacion: string;
}

export interface ListEmpresaDTO extends EmpresaBaseDTO {
  idEmpresa: number;
}

export interface CreateEmpresaDTO extends EmpresaBaseDTO {
  idEmpresa: 0;
}

export interface EditEmpresaDTO extends EmpresaBaseDTO {
  idEmpresa: number;
}