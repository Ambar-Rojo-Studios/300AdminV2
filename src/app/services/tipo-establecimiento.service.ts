
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
    return this.http.delete<ApiResponseTipoEstablecimiento<any>>(url).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('❌ [Service] Ocurrió un error en la API:', error);
    return throwError(() => new Error(error.error?.mensaje || 'Error desconocido del servidor'));
  }
}