
export interface ListHistorialCodigo {
    idCanje: number;
    idPromocion: number;//De la tabla Promociones 
    fldSuscripcion: string;
    fldEstablecimiento: string;
    fldNombre: string;
    fldDescripcion: string;
    idCliente: number;
    nombreCliente: string;
    fldfecha: string;
}

export interface ApiHistorialCodigo<T> {
    codigoEstatus: number;
    mensaje: string;
    cuerpoDeRespuesta: T;
}