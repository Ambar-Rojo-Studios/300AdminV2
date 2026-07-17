export interface CreateClienteEstrella {
    idCliente: number | null,
    idEstablecimiento: number | null,
    fldCalificacion: string | null
};

export interface ApiResponseClienteEstrella<T> {
    codigoEstatus: number;
    mensaje: string;
    cuerpoDeRespuesta: T;
}
