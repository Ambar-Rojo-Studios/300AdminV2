import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { createTagsEtiquetasXEstablecimiento, ApiResponseTagsEtiquetasXEstablecimiento, TagsEtiquetasXEstablecimiento } from '../models/tags-etiquetasXEstablecimiento.model';

@Injectable({
  providedIn: 'root'
})

export class TagsEtiquetasXEstablecimientoService {

  private readonly listByEstablecimientoUrl = '/api/etiqueta_x_establecimiento';
  private readonly createEtiquetaByEstablecimientoUrl = '/api/etiqueta_x_establecimiento/create';
  private readonly deleteEtiquetaByEstablecimientoUrl = '/api/etiqueta_x_establecimiento/delete';

  constructor(private http: HttpClient) {}

  obtenerEtiquetasPorEstablecimiento(idEstablecimiento: number): Observable<ApiResponseTagsEtiquetasXEstablecimiento<TagsEtiquetasXEstablecimiento[]>> {
    const params = new HttpParams().set('id', idEstablecimiento.toString());
    console.log('🔍 [Service] Cargando etiquetas con parámetros:', params.toString());
    return this.http
      .get<ApiResponseTagsEtiquetasXEstablecimiento<TagsEtiquetasXEstablecimiento[]>>(
        `${this.listByEstablecimientoUrl}/list`,
        { params }
      )
      .pipe(catchError(this.handleError));
  }

  crearEtiquetaEnEstablecimiento(payload: createTagsEtiquetasXEstablecimiento): Observable<ApiResponseTagsEtiquetasXEstablecimiento<any>> {
    return this.http.post<ApiResponseTagsEtiquetasXEstablecimiento<any>>(
      this.createEtiquetaByEstablecimientoUrl,
      payload
    ).pipe(catchError(this.handleError));
  }

  eliminarEtiquetaDeEstablecimiento(id: number): Observable<ApiResponseTagsEtiquetasXEstablecimiento<any>> {
     const url = `${this.deleteEtiquetaByEstablecimientoUrl}?id=${id}`;
     return this.http.delete<ApiResponseTagsEtiquetasXEstablecimiento<any>>(url).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('❌ Error en TagsEtiquetasXEstablecimientoService:', error);
    return throwError(() => error);
  }
}