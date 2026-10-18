import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map} from 'rxjs/operators';
import {ApiResponse,ListEmpresaDTO,CreateEmpresaDTO,EditEmpresaDTO
} from '../models/empresa.model';

@Injectable({
  providedIn: 'root'
})

/**
 * Servicio para gestionar la información de las empresas registradas en la plataforma.
 */
export class EmpresasService {
  private baseApiUrl = '/api/empresas/list';
  private crearEmpresaUrl = '/api/empresas/create';
  private editarEmpresaUrl = '/api/empresas/update';
  private eliminarEmpresaUrl = '/api/empresas/delete';

  constructor(private http: HttpClient) {}

   obtenerEmpresas(pageNumber: number, pageSize: number): Observable<ApiResponse<ListEmpresaDTO[]>> {
    const apiUrl = `${this.baseApiUrl}?fldPageNumber=${pageNumber}&fldPageSize=${pageSize}`;
    return this.http.get<ApiResponse<ListEmpresaDTO[]>>(apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  crearEmpresa(payload: CreateEmpresaDTO): Observable<ApiResponse<ListEmpresaDTO>> {
    return this.http.post<ApiResponse<ListEmpresaDTO>>(this.crearEmpresaUrl, payload).pipe(
      catchError(this.handleError)
    );
  }

  editarEmpresa(payload: EditEmpresaDTO): Observable<ApiResponse<ListEmpresaDTO>> {
      return this.http.put<ApiResponse<ListEmpresaDTO>>(this.editarEmpresaUrl, payload).pipe(
        catchError(this.handleError)
      );
  }

  eliminarEmpresa(id: number): Observable<ApiResponse<any>> {
    const url = `${this.eliminarEmpresaUrl}?id=${id}`;
    return this.http.delete(url, { responseType: 'text' }).pipe(
      map((texto) => this.parseRespuestaDelete(texto)),
      catchError(this.handleError)
    );
  }

  private parseRespuestaDelete(texto: string): ApiResponse<any> {
    if (!texto) return { codigoEstatus: 1, mensaje: 'Eliminado correctamente.', cuerpoDeRespuesta: null };
    try {
      return JSON.parse(texto);
    } catch {
      return { codigoEstatus: 1, mensaje: 'Eliminado correctamente.', cuerpoDeRespuesta: null };
    }
  }

  private handleError(error: HttpErrorResponse) {
    console.error('❌ [Service] Ocurrió un error en la API:', error);
    let mensaje = 'Error desconocido del servidor';
    if (typeof error.error === 'string') {
      try {
        mensaje = JSON.parse(error.error)?.mensaje || mensaje;
      } catch {
        // no era JSON, se queda el mensaje genérico
      }
    } else if (error.error?.mensaje) {
      mensaje = error.error.mensaje;
    }
    return throwError(() => new Error(mensaje));
  }
}
