
/**
 * Credenciales requeridas para iniciar sesión en la plataforma.
 */
export interface LoginCredentials {
  fldCorreoElectronico: string;
  fldContrasenia: string;
}

export interface LoginResponse {
  token: string;
}

export interface ApiResponse<T> {
  codigoEstatus: number;      
  mensaje: string;           
  cuerpoDeRespuesta: T;       
}

export interface DecodedToken {
  idCliente?: number;
  role: string;
  sub: string;
  iat: number;
  exp: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: string | null;
  role: string | null;
  token: string | null;
}