/**
 * Datos básicos compartidos por un comentario en la plataforma.
 */
export interface BaseComentarioDTO
{
    fldFechaComentario: string;
    fldComentario: string;
    idCliente: number;
}

export interface listarComentario extends BaseComentarioDTO
{
    idComentario: number;
    fldImagenPerfil: string;
    fldEstrellas: number;
    fldNombre: string;
}

export interface CrearComentarioDTO extends BaseComentarioDTO
{
    idComentario:null |number;
    idEstablecimiento: number;
}
export interface EditarComentarioDTO extends BaseComentarioDTO
{
    idComentario: number;
    idEstablecimiento: number;
}

export interface ApiResponseComentario<T> {
  codigoEstatus: number;
  mensaje: string;
  cuerpoDeRespuesta: T;
}
