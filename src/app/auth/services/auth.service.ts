import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { LoginCredentials, LoginResponse, DecodedToken, AuthState, ApiResponse } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})

/**
 * Servicio central de autenticación para usuarios y clientes.
 * Gestiona sesión, tokens, roles y redirección según el tipo de usuario.
 */
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly CLAVE_TOKEN = 'auth_token';
  private readonly API_URL = '/api/auth/usuario/login';
  private readonly API_URL_CLIENTE = '/api/auth/cliente/login';

  private _authState = signal<AuthState>(this.getInitialAuthState());
  public authState = this._authState.asReadonly();

  private getInitialAuthState(): AuthState {
    const token = this.obtenerToken();
    const isAuthenticated = this.estaAutenticado();

    return {
      isAuthenticated,
      user: isAuthenticated ? this.obtenerUsuario() : null,
      role: isAuthenticated ? this.obtenerRol() : null,
      token
    };
  }

  iniciarSesion(credenciales: LoginCredentials): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(this.API_URL, credenciales).pipe(
      tap(response => {
        if (response?.cuerpoDeRespuesta?.token) {
          this.guardarToken(response.cuerpoDeRespuesta.token);
          this.updateAuthState();
          const userRole = this.obtenerRol();
          if (userRole === 'usuario') {
            this.router.navigate(['/admin/dashboard']);
          } else if (userRole === 'botanero') {
            this.router.navigate(['/mi-lugar']);
          } else {
            this.router.navigate(['/unauthorized']);
          }
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  iniciarSesionCliente(credenciales: LoginCredentials): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(this.API_URL_CLIENTE, credenciales).pipe(
      tap(response => {
        if (response?.cuerpoDeRespuesta?.token) {
          this.guardarToken(response.cuerpoDeRespuesta.token);
          this.updateAuthState();
          const userRole = this.obtenerRol();
          if (userRole === 'cliente') {
            this.router.navigate(['/inicio']);
          } else {
            this.router.navigate(['/unauthorized']);
          }
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido al iniciar sesión.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente o de red: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Solicitud incorrecta. Verifica los datos enviados.';
          break;
        case 401:
          errorMessage = 'Credenciales inválidas. Por favor, verifica tu correo y contraseña.';
          break;
        case 403:
          errorMessage = 'Acceso denegado. No tienes permisos para realizar esta acción.';
          break;
        case 404:
          errorMessage = 'El recurso solicitado no se encontró.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Inténtalo de nuevo más tarde.';
          break;
        default:
          errorMessage = error.error?.message || `Error ${error.status}: ${error.message}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }

  private updateAuthState(): void {
    this._authState.set(this.getInitialAuthState());
  }

  guardarToken(token: string): void {
    try {
      localStorage.setItem(this.CLAVE_TOKEN, token);
    } catch {
      // localStorage no disponible (SSR)
    }
  }

  obtenerToken(): string | null {
    try {
      return localStorage.getItem(this.CLAVE_TOKEN);
    } catch {
      return null;
    }
  }

  cerrarSesion(rutaRedireccion: string = '/inicio'): void {
    try {
      localStorage.removeItem(this.CLAVE_TOKEN);
      const loggedOutState: AuthState = {
        isAuthenticated: false,
        user: null,
        role: null,
        token: null
      };
      this._authState.set(loggedOutState);
      this.router.navigate([rutaRedireccion]);
    } catch {
      // ignorar errores al limpiar storage
    }
  }

  estaAutenticado(): boolean {
    const token = this.obtenerToken();
    if (!token) return false;

    const decodedToken = this.decodificarToken(token);
    if (!decodedToken) return false;

    const currentTime = Math.floor(Date.now() / 1000);
    return decodedToken.exp > currentTime;
  }

  obtenerRol(): string | null {
    const token = this.obtenerToken();
    if (!token) return null;

    const decodedToken = this.decodificarToken(token);
    // El backend manda el rol en MAYUSCULAS (ADMIN/BOTANERO/CLIENTE); el front
    // trabaja con usuario/botanero/cliente. Normalizamos en un solo punto para
    // que redirect, guards y login components sigan usando su vocabulario.
    const raw = decodedToken?.role;
    if (!raw) return null;
    switch (raw.toUpperCase()) {
      case 'ADMIN':
      case 'USUARIO': return 'usuario';
      case 'BOTANERO': return 'botanero';
      case 'CLIENTE': return 'cliente';
      default: return raw;
    }
  }

  obtenerUsuario(): string | null {
    const token = this.obtenerToken();
    if (!token) return null;

    const decodedToken = this.decodificarToken(token);
    return decodedToken?.sub || null;
  }

  getId(): number | null {
    const token = this.obtenerToken();
    if (!token) return null;

    const decodedToken = this.decodificarToken(token);
    if (!decodedToken) return null;

    // Intentar obtener idCliente del token, si no existe usar sub
    const idValue = decodedToken.idCliente || decodedToken.sub;
    
    // Si es string, intentar convertir a número
    if (typeof idValue === 'string') {
      const parsedId = parseInt(idValue, 10);
      return isNaN(parsedId) ? null : parsedId;
    }
    
    return idValue || null;
  }

  private decodificarToken(token: string): DecodedToken | null {
    try {
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      return payload as DecodedToken;
    } catch {
      return null;
    }
  }

  tokenProximoAExpirar(minutosAntes: number = 5): boolean {
    const token = this.obtenerToken();
    if (!token) return false;

    const decodedToken = this.decodificarToken(token);
    if (!decodedToken) return false;

    const currentTime = Math.floor(Date.now() / 1000);
    const tiempoRestante = decodedToken.exp - currentTime;
    return tiempoRestante <= (minutosAntes * 60);
  }

  hasRole(role: string): boolean {
    const userRole = this.obtenerRol();
    return userRole === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const userRole = this.obtenerRol();
    return userRole ? roles.includes(userRole) : false;
  }

  get isAuthenticated() {
    return this._authState().isAuthenticated;
  }

  get currentUser() {
    return this._authState().user;
  }

  get currentRole() {
    return this._authState().role;
  }

  estaUsuarioLogueado(): boolean {
    return this.hasRole('usuario');
  }

  estaClienteLogueado(): boolean {
    return this.hasRole('cliente');
  }

  logoutCliente(): void {
    this.cerrarSesion('/inicio');
  }

  logoutUsuario(): void {
    this.cerrarSesion('/login/usuario');
  }
}