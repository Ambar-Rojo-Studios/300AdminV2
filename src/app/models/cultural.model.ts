
export interface EditCulturalDTO extends BaseCulturalDTO {
    idCapsula: number;
}

export interface CreateCulturalDTO extends BaseCulturalDTO {
    idCapsula: 0;
}

export interface ListCulturalDTO extends BaseCulturalDTO {
    idCapsula: number;
}

export interface BaseCulturalDTO {
    fldTitulo: string;
    fldDescripcion: string;
    fldImagen?: string;
    fldFechaPublicacion: string;
    fldEsVisible?: boolean;
}

export interface ApiResponseCultural<T> {
    codigoEstatus: number;
    mensaje: string;
    cuerpoDeRespuesta: T;
}
