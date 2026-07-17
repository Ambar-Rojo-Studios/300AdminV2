
export interface ListHistorialCodigo {
    idCanje: number;
    idPromocion: number;//De la tabla Promociones 
    fldSuscripcion: string;
    fldEstablecimiento: string;
    fldNombre: string;
    fldDescripcion: string;
    idusuario:number; //De la tabla Usuarios
    fldfecha: string;
}

export interface ApiHistorialCodigo<T> {
    codigoEstatus: number;
    mensaje: string;
    cuerpoDeRespuesta: T;
}