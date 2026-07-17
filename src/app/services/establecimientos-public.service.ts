import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiResponseEstablecimiento, idEstablecimiento, EstablecimientoListDTO } from '../models/establecimiento.model';

@Injectable({
  providedIn: 'root'
})
export class EstablecimientosPublicService {

  private readonly baseApiUrl = '/api/establecimientosPublic/list';
  private readonly idApiUrl = '/api/establecimientosPublic/get-byid';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene lista paginada de establecimientos para el lado público (cliente)
   * No requiere autenticación
   */
  
  obtenerEstablecimientosPublicos(pageNumber: number, pageSize: number): Observable<ApiResponseEstablecimiento<EstablecimientoListDTO[]>> {
    const params = new HttpParams()
      .set('fldPageNumber', pageNumber.toString())
      .set('fldPageSize', pageSize.toString());

    return this.http
      .get<ApiResponseEstablecimiento<EstablecimientoListDTO[]>>(this.baseApiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtiene los detalles de un establecimiento específico por ID
   * No requiere autenticación
   */
  obtenerEstablecimientoPorId(id: number): Observable<ApiResponseEstablecimiento<idEstablecimiento>> {
    const params = new HttpParams().set('id', id.toString());
    return this.http
      .get<ApiResponseEstablecimiento<idEstablecimiento>>(this.idApiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error(
      'API Error:',
      `Status: ${error.status} - ${error.statusText || 'Error Desconocido'}`,
      `URL: ${error.url || 'N/A'}`
    );

    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(
        'Backend returned status code:',
        error.status,
        'Body:',
        error.error
      );
    }

    return throwError(() => error);
  }
}

