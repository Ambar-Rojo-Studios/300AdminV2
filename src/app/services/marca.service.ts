import { HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError, map } from 'rxjs';
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
        // El backend a veces regresa el cuerpo VACÍO en el DELETE (éxito igual);
        // pedimos texto crudo para que Angular no truene intentando parsear JSON de la nada.
        return this.http.delete(url, { responseType: 'text' }).pipe(
            map((texto) => this.parseRespuestaDelete(texto)),
            catchError(this.handleError)
        );
    }

    private parseRespuestaDelete(texto: string): ApiResponseMarca<any> {
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