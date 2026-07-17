import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { TagsEtiquetasXEstablecimiento, createTagsEtiquetasXEstablecimiento, ApiResponseTagsEtiquetasXEstablecimiento } from '../models/tags-etiquetaXTipoEstablecimiento.model';

@Injectable({
  providedIn: 'root'
})

export class EtiquetasXTipoEstablecimientoService {

    private readonly listUrl    = '/api/etiqueta_x_tipo_establecimiento/list';
    private readonly createUrl  = '/api/etiqueta_x_tipo_establecimiento/create';
    private readonly deleteUrl  = '/api/etiqueta_x_tipo_establecimiento/delete';

    constructor(private http: HttpClient) { }

    obtenerEtiquetasPorTipoEstablecimiento(
      idTipoEstablecimiento: number,
      pageSize: number = 100,
      pageNumber: number = 1
    ): Observable<ApiResponseTagsEtiquetasXEstablecimiento<TagsEtiquetasXEstablecimiento[]>> {
        const params = new HttpParams()
          .set('idTipoEstablecimiento', idTipoEstablecimiento.toString())
          .set('fldPageSize', pageSize.toString())
          .set('fldPageNumber', pageNumber.toString());
        return this.http
          .get<ApiResponseTagsEtiquetasXEstablecimiento<TagsEtiquetasXEstablecimiento[]>>(
            this.listUrl,
            { params }
          )
          .pipe(catchError(this.handleError));
      }

    crearEtiquetaEnTipoEstablecimiento(payload: createTagsEtiquetasXEstablecimiento): Observable<ApiResponseTagsEtiquetasXEstablecimiento<any>> {
        return this.http.post<ApiResponseTagsEtiquetasXEstablecimiento<any>>(this.createUrl, payload).pipe(catchError(this.handleError));
    }

    eliminarEtiquetaDeTipoEstablecimiento(id: number): Observable<ApiResponseTagsEtiquetasXEstablecimiento<any>> {
        const params = new HttpParams().set('id', id.toString());
        return this.http.delete<ApiResponseTagsEtiquetasXEstablecimiento<any>>(
          this.deleteUrl,
          { params }
        ).pipe(catchError(this.handleError));
      }

    private handleError(error: HttpErrorResponse) {
      console.error('❌ Error en EtiquetasXTipoEstablecimientoService:', error);
      return throwError(() => error);
    }

}


