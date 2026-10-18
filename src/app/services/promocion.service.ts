import { HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError, map } from 'rxjs';
import { listarPromocionesDTO, CrearPromocionDTO, EditarPromocionDTO, ApiResponsivePromocion} from '../models/promocion.model';

@Injectable({
  providedIn: 'root'
})

export class PromocionesService {

  private crearUrl = '/api/promocion/create';
  private editUrl = '/api/promocion/edit';
  private listarUrl = '/api/promocion/list';
  private deleteUrl = '/api/promocion/delete';
  private byIdEstablec = '/api/promocion/by-establecimiento';
  constructor(private http: HttpClient) {}


  obtenerPromociones(pageNumber:number, pageSize:number): Observable<ApiResponsivePromocion<listarPromocionesDTO[]>> {
      let params = new HttpParams()
            .set('fldPageNumber', pageNumber.toString()) 
            .set('fldPageSize', pageSize.toString());  
      console.log('🔍 [Service] Cargando promociones con parámetros:', params.toString());
      return this.http.get<ApiResponsivePromocion<listarPromocionesDTO[]>>(this.listarUrl, { params: params }).pipe(
        catchError(this.handleError)
      );
  }

  crearPromocion(payload: CrearPromocionDTO): Observable<ApiResponsivePromocion<CrearPromocionDTO>> {
    return this.http.post<ApiResponsivePromocion<CrearPromocionDTO>>(this.crearUrl, payload).pipe(
      catchError(this.handleError)
    );
  }

  editarPromocion(payload: EditarPromocionDTO): Observable<ApiResponsivePromocion<EditarPromocionDTO>> {
    return this.http.put<ApiResponsivePromocion<EditarPromocionDTO>>(this.editUrl, payload).pipe(
      catchError(this.handleError)
    );
  }

  eliminarPromocion(id: number): Observable<void> {
    // El backend a veces regresa el cuerpo VACÍO en el DELETE (éxito igual);
    // pedimos texto crudo para que Angular no truene intentando parsear JSON de la nada.
    return this.http.delete(`${this.deleteUrl}?id=${id}`, { responseType: 'text' }).pipe(
      map(() => undefined),
      catchError(this.handleError)
    );
  }
  
  obtenerbyIdEstablecimiento(idEstablecimiento: number, idSuscripcion: number): Observable<ApiResponsivePromocion<listarPromocionesDTO[]>> {
  return this.http.get<ApiResponsivePromocion<listarPromocionesDTO[]>>(this.byIdEstablec, {
    params: {
      idEstablecimiento: String(idEstablecimiento),
      idSuscripcion: String(idSuscripcion),
    },
  })
  .pipe(catchError(this.handleError));
}

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ Error en la solicitud:', error);
    return throwError(() => new Error(`Error en la solicitud: ${error.status}`));
  }

}
