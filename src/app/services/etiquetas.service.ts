import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { ApiResponseEtiqueta, EditEtiquetaDTO, CreateEtiquetaDTO, ListEtiquetaDTO, ListCategoriaConEtiquetasDTO } from '../models/etiquetas.model';

@Injectable({
  providedIn: 'root'
})

export class EtiquetasService {

  private baseApiUrl = '/api/etiquetas/list';
  private crearUrl = '/api/etiquetas/create';
  private editarUrl = '/api/etiquetas/edit';
  private eliminarUrl = '/api/etiquetas/delete';
  //Usado en el sitio web para listar el filtrado de las etiquetas por las categorias
  private obtenerUrl = '/api/etiquetas/list-movileapp';

  constructor(private http: HttpClient) {}

  listarEtiquetas(pageNumber: number, pageSize: number): Observable<ApiResponseEtiqueta<ListEtiquetaDTO[]>> {
    let params = new HttpParams()
      .set('fldPageNumber', pageNumber.toString()) 
      .set('fldPageSize', pageSize.toString());
    console.log('🔍 [Service] Cargando etiquetas con parámetros:', params.toString());     
    return this.http.get<ApiResponseEtiqueta<ListEtiquetaDTO[]>>(this.baseApiUrl, { params: params }).pipe(
      catchError(this.handleError)
    );
  }

  crearEtiqueta(payload: CreateEtiquetaDTO): Observable<ApiResponseEtiqueta<CreateEtiquetaDTO>> {
    return this.http.post<ApiResponseEtiqueta<CreateEtiquetaDTO>>(this.crearUrl, payload).pipe(
      catchError(this.handleError)
    );
  }

  editarEtiqueta(payload: EditEtiquetaDTO): Observable<ApiResponseEtiqueta<EditEtiquetaDTO>> {
    return this.http.put<ApiResponseEtiqueta<EditEtiquetaDTO>>(this.editarUrl, payload).pipe(
      catchError(this.handleError)
    );
  }

  obtenerCategoriasConEtiquetas(): Observable<ApiResponseEtiqueta<ListCategoriaConEtiquetasDTO[]>> {
    return this.http.get<ApiResponseEtiqueta<ListCategoriaConEtiquetasDTO[]>>(this.obtenerUrl).pipe(
      catchError(this.handleError)
    );
  }

  eliminarEtiqueta(id: number): Observable<ApiResponseEtiqueta<any>> {
    const url = `${this.eliminarUrl}?id=${id}`;
    return this.http.delete(url, { responseType: 'text' }).pipe(
      map((texto) => this.parseRespuestaDelete(texto)),
      catchError(this.handleError)
    );
  }

  private parseRespuestaDelete(texto: string): ApiResponseEtiqueta<any> {
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