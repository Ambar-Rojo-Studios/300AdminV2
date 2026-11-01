export type AudienciaNotificacion = 'TODOS' | 'CLIENTES';
export type TipoNotificacion = 'GENERAL' | 'ESTABLECIMIENTO' | 'PROMO' | 'CAPSULA';

export interface ResumenNotificacionesDTO {
  tokensActivos: number;
  clientesConToken: number;
}

export interface EnviarNotificacionRequest {
  titulo: string;
  mensaje: string;
  audiencia: AudienciaNotificacion;
  idsClientes?: number[];
  tipo: TipoNotificacion;
  idDestino?: number;
  imagenUrl?: string;
}

export interface EnvioNotificacionResponse {
  idNotificacion: number;
  destinatarios: number;
  enviados: number;
  fallidos: number;
  tokensDesactivados: number;
}

export interface HistorialNotificacionDTO {
  idNotificacion: number;
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  idDestino: number | null;
  audiencia: AudienciaNotificacion;
  destinatarios: number;
  enviados: number;
  fallidos: number;
  tokensDesactivados: number;
  fechaEnvio: string;
  nombreUsuario: string;
}

export interface ApiResponseNotificaciones<T> {
  codigoEstatus: number;
  mensaje: string;
  cuerpoDeRespuesta: T;
}
