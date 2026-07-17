import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { createEtiquetasXCliente, ApiResponseEtiquetasXCliente, listEtiquetasXCliente } from '../models/etiquetasXCliente.model';

@Injectable({
  providedIn: 'root'
})

export class EtiquetasXClienteService {

    private apiUrl = '/api/etiqueta_x_cliente/create';
    private listByClienteUrl = '/api/etiqueta_x_cliente/list';
    private deleteEtiquetaByClienteUrl= '/api/etiqueta_x_cliente/delete';

    constructor(private http: HttpClient) { }

    obtenerEtiquetasPorCliente(idCliente: number): Observable<ApiResponseEtiquetasXCliente<listEtiquetasXCliente[]>> {
        const params = new HttpParams().set('idCliente', idCliente.toString());
        console.log('🔍 [Service] Cargando etiquetas con parámetros:', params.toString());
        return this.http
          .get<ApiResponseEtiquetasXCliente<listEtiquetasXCliente[]>>(
            this.listByClienteUrl,
            { params }
          )
          .pipe(catchError(this.handleError));
      }
      
    createEtiquetasXCliente(payload: createEtiquetasXCliente): Observable<ApiResponseEtiquetasXCliente<any>> {
        return this.http.post<ApiResponseEtiquetasXCliente<any>>(this.apiUrl, payload).pipe(catchError(this.handleError));
    }

    eliminarEtiquetaCliente(id: number): Observable<ApiResponseEtiquetasXCliente<any>> {
     const url = `${this.deleteEtiquetaByClienteUrl}?id=${id}`;
      return this.http.delete<ApiResponseEtiquetasXCliente<any>>(url).pipe(
        catchError(this.handleError)
      );
    }

    private handleError(error: HttpErrorResponse) {
    console.error('❌ Error en TagsEtiquetasXEstablecimientoService:', error);
    return throwError(() => error);
  }

}


