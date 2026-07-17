import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
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
    return this.http.delete<ApiResponseEtiqueta<any>>(url).pipe(
      catchError(this.handleError)
    );
  }


  private handleError(error: HttpErrorResponse) {
    console.error('❌ [Service] Ocurrió un error en la API:', error);
    return throwError(() => new Error(error.error?.mensaje || 'Error desconocido del servidor'));
  }

}