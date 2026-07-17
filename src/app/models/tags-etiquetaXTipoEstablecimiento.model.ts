export interface TagsEtiquetasXEstablecimiento 
{
    id: 0,
    idEtiqueta: number, //Se debe de obtener de la tabla de etiquetas
    fldCategoria: string,  //Este es el nombre de la categoria
    fldNombre: string, //Este es el nombre de la etiqueta
    fldDescripcion: string,
    fldEsVisible: boolean
}

export interface createTagsEtiquetasXEstablecimiento {
  id: 0,
  fkIdEstablecimiento: number, //Se debe obtener de la tabla de establecimientos
  fkIdEtiqueta:number //se obtiene de la tabla etiquetas
}

export interface ApiResponseTagsEtiquetasXEstablecimiento<T> {
  codigoEstatus: number;
  mensaje: string;
  cuerpoDeRespuesta: T;
}