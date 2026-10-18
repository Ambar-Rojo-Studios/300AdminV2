import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { UsuarioCreateDTO, UsuarioLisDTO, UsuarioEditDTO, ApiResponsiveUsuario } from '../models/usuario.model';

@Injectable({
    providedIn: 'root'
})

export class UsuarioService {

    private baseApiUrl = '/api/usuario/list';
    private crearUrl = '/api/usuario/create';
    private editUrl = '/api/usuario/edit';
    private deleteUrl = '/api/usuario/delete';

    constructor(private http: HttpClient) { }

    obtenerUsuarios(pageNumber:number, pageSize:number): Observable<ApiResponsiveUsuario<UsuarioLisDTO[]>> {
        let params = new HttpParams()
            .set('fldPageNumber', pageNumber.toString()) 
            .set('fldPageSize', pageSize.toString());     
        console.log('🔍 [Service] Cargando usuarios con parámetros:', params.toString());
        return this.http.get<ApiResponsiveUsuario<UsuarioLisDTO[]>>(this.baseApiUrl, { params: params }).pipe(catchError(this.handleError)
        );
    }

    crearUsuario(payload: UsuarioCreateDTO): Observable<ApiResponsiveUsuario<UsuarioCreateDTO>> {
        return this.http.post<ApiResponsiveUsuario<UsuarioCreateDTO>>(this.crearUrl, payload).pipe(
            catchError(this.handleError)
        );
    }

    editarUsuario(payload: UsuarioEditDTO): Observable<ApiResponsiveUsuario<UsuarioEditDTO>> {
        return this.http.put<ApiResponsiveUsuario<UsuarioEditDTO>>(this.editUrl, payload).pipe(
            catchError(this.handleError)
        );
    }

    eliminarUsuario(id: number): Observable<ApiResponsiveUsuario<string>> { 
        const url = `${this.deleteUrl}?id=${id}`;
            return this.http.delete<ApiResponsiveUsuario<any>>(url).pipe(
              catchError(this.handleError)
            );
    }


    private handleError(error: HttpErrorResponse) {
        console.error('❌ [Service] Ocurrió un error en la API:', error);
        return throwError(() => new Error(error.error?.mensaje || 'Error desconocido del servidor'));
    }
    
}