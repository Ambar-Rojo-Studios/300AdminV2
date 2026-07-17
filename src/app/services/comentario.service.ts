import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiResponseComentario, EditarComentarioDTO, CrearComentarioDTO, listarComentario } from "../models/comentario.model";

@Injectable({
  providedIn: 'root'
})
/**
 * Servicio para administrar comentarios y su relación con los establecimientos.
 */
export class ComentarioService {

  private listByEstablecimientoUrl = '/api/comentario/list-byid-establecimiento';
  private crearUrl = '/api/comentario/create';
  private editUrl = '/api/comentario/update';
  private deleteUrl = '/api/comentario/delete';

  constructor(private http: HttpClient) { }

  obtenerComentariosPorEstablecimiento(idEstablecimiento: number, pageNumber: number, pageSize: number): Observable<ApiResponseComentario<listarComentario[]>> {
    let params = new HttpParams()
      .set('idEstablecimiento', idEstablecimiento.toString())
      .set('fldPageNumber', pageNumber.toString())
      .set('fldPageSize', pageSize.toString());

    console.log('🔍 [Service] Cargando comentarios con parámetros:', params.toString());

    return this.http.get<ApiResponseComentario<listarComentario[]>>(
      this.listByEstablecimientoUrl, { params: params }
    ).pipe(catchError(this.handleError));
  }

  crearComentario(payload: CrearComentarioDTO): Observable<ApiResponseComentario<CrearComentarioDTO[]>> {
    return this.http.post<ApiResponseComentario<CrearComentarioDTO[]>>(this.crearUrl, payload).pipe(
      catchError(this.handleError)
    );
  }

  editarComentario(payload: EditarComentarioDTO): Observable<ApiResponseComentario<EditarComentarioDTO[]>> {
    return this.http.put<ApiResponseComentario<EditarComentarioDTO[]>>(this.editUrl, payload).pipe(
      catchError(this.handleError)
    );
  }

  eliminarComentario(id: number): Observable<ApiResponseComentario<listarComentario[]>> {
    const url = `${this.deleteUrl}?id=${id}`;
    return this.http.delete<ApiResponseComentario<listarComentario[]>>(url).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('❌ [Service] Ocurrió un error en la API:', error);
    return throwError(() => new Error(error.error?.mensaje || 'Error desconocido del servidor'));
  }
}