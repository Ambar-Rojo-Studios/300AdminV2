
/**
 * Datos base de un usuario del sistema.
 */
export interface UsuarioBaseDTO {
    fldNombre: string;
    fldTelefono: string;
    fldCorreoElectronico: string;
    fldContrasenia: string;  
}

export interface UsuarioLisDTO extends UsuarioBaseDTO {
    idUsuario: number;
}

export interface UsuarioCreateDTO extends UsuarioBaseDTO {
    idUsuario: 0; 
}

export interface UsuarioEditDTO extends UsuarioBaseDTO {
    idUsuario: number; 
}

export interface ApiResponsiveUsuario<T> 
{
    codigoEstatus: number;
    mensaje: string;
    cuerpoDeRespuesta: T;
}       