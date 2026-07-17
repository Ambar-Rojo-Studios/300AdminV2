
/**
 * Respuesta estándar de la API para operaciones relacionadas con categorías de etiquetas.
 */
export interface ApiResponseCategoriaEtiqueta<T> {
  codigoEstatus: number;
  mensaje: string;
  cuerpoDeRespuesta: T;
}

/**
 * Estructura base compartida por las categorías de etiquetas.
 */
export interface BasecategoriaEtiquetaDTO 
{
  fldNombre: string,
  fldDescripcion: string,
  fldFechaCreacion: string,
  fldFechaUltimaModificacion: string
}

export interface ListCategoriaEtiquetaDTO extends BasecategoriaEtiquetaDTO 
{
    idCategoria: number;
}

export interface CreateCategoriaEtiquetaDTO extends BasecategoriaEtiquetaDTO 
{
    idCategoria: 0
}

export interface EditCategoriaEtiquetaDTO extends BasecategoriaEtiquetaDTO 
{
    idCategoria: number
}