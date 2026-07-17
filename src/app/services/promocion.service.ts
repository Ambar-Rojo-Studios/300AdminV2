import { HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError, firstValueFrom } from 'rxjs';
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
    return this.http.delete<void>(`${this.deleteUrl}?id=${id}`).pipe(
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

  /**
   * CONTABILIDAD DINÁMICA: Obtiene el total de promociones para el dashboard
   * Solicita un pageSize grande (10000) para obtener prácticamente todas las promociones
   * y contar el total real desde el backend
   * @returns Promise<number> Total de promociones
   */
  async obtenerTotalPromociones(): Promise<number> {
    try {
      const params = new HttpParams()
        .set('fldPageNumber', '1')
        .set('fldPageSize', '10000');
      
      const res = await firstValueFrom(
        this.http.get<ApiResponsivePromocion<listarPromocionesDTO[]>>(this.listarUrl, { params: params })
          .pipe(catchError(this.handleError))
      );
      
      if (res?.codigoEstatus === 1 && res.cuerpoDeRespuesta) {
        return res.cuerpoDeRespuesta.length;
      }
      return 0;
    } catch (error) {
      console.error('Error al obtener total de promociones:', error);
      return 0;
    }
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ Error en la solicitud:', error);
    return throwError(() => new Error(`Error en la solicitud: ${error.status}`));
  }

}