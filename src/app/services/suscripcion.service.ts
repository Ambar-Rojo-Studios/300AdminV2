import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ListSuscripcionDTO, CreateSuscripcionDTO, EditSuscripcionDTO, ApiResponseSuscipcion } from '../models/suscripcion.model';

@Injectable({
  providedIn: 'root'
})

export class SuscripcionesService {
  private apiUrlCliente = '/api/suscripcion/list?fldEsSuscripcionDeCliente=true';
  private apiUrlNoCliente = '/api/suscripcion/list?fldEsSuscripcionDeCliente=false';
  private crearUrl = '/api/suscripcion/create';
  private editUrl = '/api/suscripcion/edit';
  private deleteUrl = '/api/suscripcion/delete';

  constructor(private http: HttpClient) {}

 obtenerSuscripcionesCliente(): Observable<ApiResponseSuscipcion<ListSuscripcionDTO[]>> {
    return this.http.get<ApiResponseSuscipcion<ListSuscripcionDTO[]>>(this.apiUrlCliente)
      .pipe(catchError(this.handleError));
  }

  obtenerSuscripcionesNoCliente(): Observable<ApiResponseSuscipcion<ListSuscripcionDTO[]>> {
    return this.http.get<ApiResponseSuscipcion<ListSuscripcionDTO[]>>(this.apiUrlNoCliente)
      .pipe(catchError(this.handleError));
  }

  crearSuscripcion(payload: CreateSuscripcionDTO): Observable<ApiResponseSuscipcion<ListSuscripcionDTO>> {
    return this.http.post<ApiResponseSuscipcion<ListSuscripcionDTO>>(this.crearUrl, payload)
      .pipe(catchError(this.handleError));
  }

  editarSuscripcion(payload: EditSuscripcionDTO): Observable<ApiResponseSuscipcion<ListSuscripcionDTO>> {
    return this.http.put<ApiResponseSuscipcion<ListSuscripcionDTO>>(this.editUrl, payload)
      .pipe(catchError(this.handleError));
  }

  eliminarSuscripcion(id: number): Observable<any> {
    const url = `${this.deleteUrl}?id=${id}`;
    return this.http.delete<any>(url)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('❌ [Service] Ocurrió un error en la API:', error);
    return throwError(() => new Error(error.error?.mensaje || 'Error desconocido del servidor'));
  }
}