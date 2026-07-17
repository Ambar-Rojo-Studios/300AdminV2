
export interface BaseMarcaDTO {
    fldNombre: string;
    fldDescripcion: string;
}

export interface MarcaListDTO extends BaseMarcaDTO {
    idMarca: number;
}

export interface MarcaCreateDTO extends BaseMarcaDTO {
    idMarca: null | number;
}

export interface MarcaEditDTO extends BaseMarcaDTO {
    idMarca: number;
}

export interface ApiResponseMarca<T> {
    codigoEstatus: number;
    mensaje: string;
    cuerpoDeRespuesta: T;
}