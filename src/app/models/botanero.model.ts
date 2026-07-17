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

/**
 * Establecimiento tal como lo devuelve el backend en /api/botanero/**.
 * Refleja BotaneroEstablecimientoDTO.java. Time/Date llegan como string en JSON.
 */
export interface BotaneroEstablecimientoDTO {
  idEstablecimiento: number;
  fkIdSuscripcion: number;
  fkIdEmpresa: number;
  fkIdTipoEstablecimiento: number;
  fldNombre: string;
  fldDescripcion: string;
  fldEstado: string;
  fldCiudad: string;
  fldZona: string;
  fldDireccion: string;
  fldReferenciaGeografica: string;
  fldCoordLatitud: string;
  fldCoordLongitud: string;
  fldCorreoElectronico: string;
  fldSugerenciaDeLaCasa: string;
  imagenesPerfil: string[];
  imagenesMenu: string[];
  fldHorarioApertura: string;
  fldHorarioCierre: string;
  fldLunes: boolean;
  fldMartes: boolean;
  fldMiercoles: boolean;
  fldJueves: boolean;
  fldViernes: boolean;
  fldSabado: boolean;
  fldDomingo: boolean;
  fldCelular1: string;
  fldCelular2: string;
  fldCelularComentarios: string;
  fldAlimentosBebidas: string;
  fldTicketPromedio: string;
  fldAntiguedadAnios: number;
  fldPromoLunes: string;
  fldPromoMartes: string;
  fldPromoMiercoles: string;
  fldPromoJueves: string;
  fldPromoViernes: string;
  fldPromoSabado: string;
  fldPromoDomingo: string;
}

/**
 * Cuerpo de PUT /api/botanero/establecimientos/{id}/promos.
 * Refleja BotaneroPromosDTO.java: es un OBJETO, no un array.
 */
export interface BotaneroPromosDTO {
  fldPromoLunes: string;
  fldPromoMartes: string;
  fldPromoMiercoles: string;
  fldPromoJueves: string;
  fldPromoViernes: string;
  fldPromoSabado: string;
  fldPromoDomingo: string;
  fldPromo300Lugares: string;
}
