import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {ApiResponseCategoriaEtiqueta, ListCategoriaEtiquetaDTO, CreateCategoriaEtiquetaDTO,
EditCategoriaEtiquetaDTO
} from '../models/categoria-etiqueta.model';

@Injectable({
  providedIn: 'root'
})

/**
 * Servicio para administrar las categorías y etiquetas asociadas a los establecimientos.
 */
export class CategoriaEtiquetaService {
  private baseApiUrl = '/api/categoria-etiqueta/list';
  private crearCategoriaEtiquetaUrl = '/api/categoria-etiqueta/create';
  private editarCategoriaEtiquetaUrl = '/api/categoria-etiqueta/update';
  private eliminarCategoriaEtiquetaUrl = '/api/categoria-etiqueta/delete';

  constructor(private http: HttpClient) {}

   obtenerCategoriasEtiquetas(pageNumber: number, pageSize: number): Observable<ApiResponseCategoriaEtiqueta<ListCategoriaEtiquetaDTO[]>> {
     let params = new HttpParams()
      .set('fldPageNumber', pageNumber.toString()) 
      .set('fldPageSize', pageSize.toString());
    console.log('🔍 [Service] Cargando etiquetas con parámetros:', params.toString());
    return this.http.get<ApiResponseCategoriaEtiqueta<ListCategoriaEtiquetaDTO[]>>(this.baseApiUrl, { params: params }).pipe(
      catchError(this.handleError)
    );
  }

  crearCategoriaEtiqueta(payload: CreateCategoriaEtiquetaDTO): Observable<ApiResponseCategoriaEtiqueta<ListCategoriaEtiquetaDTO>> {
    return this.http.post<ApiResponseCategoriaEtiqueta<ListCategoriaEtiquetaDTO>>(this.crearCategoriaEtiquetaUrl, payload).pipe(
      catchError(this.handleError)
    );
  }

  editarCategoriaEtiqueta(payload: EditCategoriaEtiquetaDTO): Observable<ApiResponseCategoriaEtiqueta<ListCategoriaEtiquetaDTO>> {
      return this.http.put<ApiResponseCategoriaEtiqueta<ListCategoriaEtiquetaDTO>>(this.editarCategoriaEtiquetaUrl, payload).pipe(
        catchError(this.handleError)
      );
  }

  eliminarCategoriaEtiqueta(id: number): Observable<ApiResponseCategoriaEtiqueta<any>> {
    const url = `${this.eliminarCategoriaEtiquetaUrl}?id=${id}`;
    // El backend a veces regresa el cuerpo VACÍO en el DELETE (éxito igual);
    // pedimos texto crudo para no que Angular no truene intentando parsear JSON de la nada.
    return this.http.delete(url, { responseType: 'text' }).pipe(
      map((texto) => this.parseRespuestaDelete(texto)),
      catchError(this.handleError)
    );
  }

  private parseRespuestaDelete(texto: string): ApiResponseCategoriaEtiqueta<any> {
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