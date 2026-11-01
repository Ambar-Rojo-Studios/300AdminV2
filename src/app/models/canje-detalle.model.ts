export interface CanjeDetalleBaseDTO {
  idCanje: number;
  fechaHora: string;
  idPromocion: number;
  textoPromocion: string;
  nombreCliente: string;
}

export interface CanjeDetalleAdminDTO extends CanjeDetalleBaseDTO {
  codigo: string;
  idCliente: number;
}

export interface CanjeDetalleBotaneroDTO extends CanjeDetalleBaseDTO {}

export interface CanjesPaginaDTO<T> {
  filas: T[];
  pagina: number;
  tamano: number;
  total: number;
}

export interface FiltroCanjes {
  desde: string;
  hasta: string;
  pagina: number;
  tamano: number;
}
