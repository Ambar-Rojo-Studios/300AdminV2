/**
 * Estructura que agrupa una categoría con sus etiquetas asociadas.
 */
export interface ListCategoriaConEtiquetasDTO {
      idCategoria: number,
      fldNombre: string,
      etiquetas: [
        {
          idEtiqueta: number,
          fkIdCategoriaEtiqueta: number,
          fldNombre: "string",
          fldDescripcion: "string",
          fldEsVisible: true
        }
      ]
}

export interface EtiquetaBaseDTO 
{
    fldNombre: string,
    fldDescripcion: string,
    fldEsVisible: true
}

export interface ListEtiquetaDTO extends EtiquetaBaseDTO 
{ 
    idEtiqueta: number;
    fldCategoria:string;
}

export interface CreateEtiquetaDTO extends EtiquetaBaseDTO 
{   
    idEtiqueta: 0,
    fkIdCategoriaEtiqueta: number; 
}

export interface EditEtiquetaDTO extends EtiquetaBaseDTO 
{   
    idEtiqueta: number;
    fkIdCategoriaEtiqueta: number;
}

export interface ApiResponseEtiqueta<T> {
  codigoEstatus: number;
  mensaje: string;
  cuerpoDeRespuesta: T;
}

