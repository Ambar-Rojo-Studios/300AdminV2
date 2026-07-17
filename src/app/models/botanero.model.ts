/**
 * DTOs del portal de botaneros (/api/botanero/**).
 * Contrato definido en PLAN-ADMIN-V2.md sección 7.3.
 */

export interface ApiResponseBotanero<T> {
  codigoEstatus: number;
  mensaje: string;
  cuerpoDeRespuesta: T;
}

/**
 * Estadísticas de un establecimiento para su dueño.
 * La BD hoy solo registra: calificaciones, comentarios y canjes.
 */
export interface BotaneroStatsDTO {
  calificacionPromedio: number;
  totalComentarios: number;
  totalCanjes: number;
}
