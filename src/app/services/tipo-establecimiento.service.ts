
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiResponseTipoEstablecimiento, ListTipoEstablecimientoDTO, CreateTipoEstablecimientoDTO, EditTipoEstablecimientoDTO } from '../models/tipo_establecimiento.model';

@Injectable({
  providedIn: 'root'
})

export class TiposEstablecimientoService {

  private baseApiUrl = '/api/tipo-establecimiento/list';
  private crearUrl = '/api/tipo-establecimiento/create';
  private editarUrl = '/api/tipo-establecimiento/edit';
  private eliminarUrl = '/api/tipo-establecimiento/delete';

  constructor(private http: HttpClient) {}

  obtenerTipos(pageNumber: number, pageSize: number): Observable<ApiResponseTipoEstablecimiento<ListTipoEstablecimientoDTO[]>> {
    const apiUrl = `${this.baseApiUrl}?fldPageNumber=${pageNumber}&fldPageSize=${pageSize}`;
    console.log("")
    return this.http.get<ApiResponseTipoEstablecimiento<ListTipoEstablecimientoDTO[]>>(apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  obtenerTodos(): Observable<ApiResponseTipoEstablecimiento<ListTipoEstablecimientoDTO[]>> {
    const apiUrl = `${this.baseApiUrl}?fldPageNumber=1&fldPageSize=100`;
    return this.http.get<ApiResponseTipoEstablecimiento<ListTipoEstablecimientoDTO[]>>(apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  crearTipo(payload: CreateTipoEstablecimientoDTO): Observable<ApiResponseTipoEstablecimiento<ListTipoEstablecimientoDTO>> {
    return this.http.post<ApiResponseTipoEstablecimiento<ListTipoEstablecimientoDTO>>(this.crearUrl, payload).pipe(
      catchError(this.handleError)
    );
  }

  editarTipo(payload: EditTipoEstablecimientoDTO): Observable<ApiResponseTipoEstablecimiento<ListTipoEstablecimientoDTO>> {
    return this.http.put<ApiResponseTipoEstablecimiento<ListTipoEstablecimientoDTO>>(this.editarUrl, payload).pipe(
      catchError(this.handleError)
    );
  }

  eliminarTipo(id: number): Observable<ApiResponseTipoEstablecimiento<any>> {
    const url = `${this.eliminarUrl}?id=${id}`;
    return this.http.delete(url, { responseType: 'text' }).pipe(
      map((texto) => this.parseRespuestaDelete(texto)),
      catchError(this.handleError)
    );
  }

  private parseRespuestaDelete(texto: string): ApiResponseTipoEstablecimiento<any> {
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