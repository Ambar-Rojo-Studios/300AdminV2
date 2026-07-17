import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError} from 'rxjs/operators';
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
    return this.http.delete<ApiResponseCategoriaEtiqueta<any>>(url).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('❌ [Service] Ocurrió un error en la API:', error);
    return throwError(() => new Error(error.error?.mensaje || 'Error desconocido del servidor'));
  }
}