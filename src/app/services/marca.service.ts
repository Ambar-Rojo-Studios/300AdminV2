import { HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiResponseMarca, MarcaCreateDTO, MarcaEditDTO, MarcaListDTO } from '../models/marcas.model';

@Injectable({
    providedIn: 'root'
})

export class MarcasService {

    private apiUrl = '/api/marcas/list'; 
    private crearUrl = '/api/marcas/create'; 
    private editUrl = '/api/marcas/edit'; 
    private deleteUrl = '/api/marcas/delete'; 

    constructor(private http: HttpClient) { }

    obtenerMarcas(pageNumber: number, pageSize: number): Observable<ApiResponseMarca<MarcaListDTO[]>> {
         let params = new HttpParams()
                .set('fldPageNumber', pageNumber.toString()) 
                .set('fldPageSize', pageSize.toString());
        console.log('🔍 [Service] Cargando marcas con parámetros:', params.toString());
        return this.http.get<ApiResponseMarca<MarcaListDTO[]>>
        ( this.apiUrl, {params: params}).pipe(
            catchError(this.handleError)
        );
    }

    crearMarca(payload: MarcaCreateDTO): Observable<ApiResponseMarca<MarcaCreateDTO>> {
        return this.http
            .post<ApiResponseMarca<MarcaCreateDTO>>(this.crearUrl, payload).pipe(
                catchError((error: HttpErrorResponse) => {
                    console.error('❌ [Service] Error al crear marca:', error);
                    return throwError(() => error);
                })
            );
    }

    editarMarca(payload: MarcaEditDTO): Observable<ApiResponseMarca<MarcaCreateDTO>> {
        return this.http.put<ApiResponseMarca<MarcaCreateDTO>>
        (this.editUrl, payload).pipe(
            catchError(this.handleError)
            );
    }

    eliminarMarca(id: number): 
    Observable<ApiResponseMarca<any>> {
        const url = `${this.deleteUrl}?id=${id}`;
        return this.http.delete<ApiResponseMarca<any>>(url).pipe(
            catchError(this.handleError)
        );
    }
    
    private handleError(error: HttpErrorResponse) {
        console.error('❌ [Service] Ocurrió un error en la API:', error);
        return throwError(() => new Error(error.error?.mensaje || 'Error desconocido del servidor'));
    }
}