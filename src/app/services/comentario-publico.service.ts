import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiResponseComentario, listarComentario } from "../models/comentario.model";

@Injectable({
  providedIn: 'root'
})

/**
 * Servicio para gestionar los comentarios públicos visibles en la aplicación.
 */
export class ComentariosPublicos {

  private readonly listByEstablecimientoUrl = '/api/comentariosPublic/list-byid-establecimiento';

  constructor(private http: HttpClient) { }


  obtenerComentariosPublicos(idEstablecimiento: number): Observable<ApiResponseComentario<listarComentario[]>> {
    const params = new HttpParams().set('idEstablecimiento', idEstablecimiento.toString());
    return this.http.get<ApiResponseComentario<listarComentario[]>>(
      this.listByEstablecimientoUrl, { params }
    ).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('[Service] Ocurrió un error en la API:', error);
    return throwError(() => new Error(error.error?.mensaje || 'Error desconocido del servidor'));
  }

}