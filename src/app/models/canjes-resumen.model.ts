export interface CanjesResumenDTO {
  idEstablecimiento: number;
  nombreEstablecimiento: string;
  hoy: number;
  semana: number;
  mes: number;
  total: number;
}

export interface ApiResponseCanjes<T> {
  codigoEstatus: number;
  mensaje: string;
  cuerpoDeRespuesta: T;
}
