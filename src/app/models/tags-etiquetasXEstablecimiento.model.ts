export interface TagsEtiquetasXEstablecimiento 
{
    id: number,
    fkIdEstablecimiento: number, //Se debe obtener de la tabla de establecimientos
    fldIdCategoria: number, //Se debe de obtener de la tabla de categorias
    fldCategoria: string, //Este es el nombre de la categoria
    idEtiqueta: number, //Se debe de obtener de la tabla de etiquetas
    fldNombre: string //Este es el nombre de la etiqueta
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