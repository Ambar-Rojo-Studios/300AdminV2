import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ClienteListDTO, ClienteCreateDTO, ClienteEditDTO, ApiResponseCliente } from '../models/cliente.model';

@Injectable({
  providedIn: 'root'
})

/**
 * Servicio para consultar, crear, editar y eliminar clientes desde la administración.
 */
export class ClientesService {

  private baseApiUrl = '/api/clientes/list';
  private crearUrl = '/api/clientes/create';
  private editarUrl = '/api/clientes/edit';
  private eliminarUrl = '/api/clientes/delete';
  
  constructor(private http: HttpClient) {}

  listarClientes(pageNumber: number, pageSize: number): Observable<ApiResponseCliente<ClienteListDTO[]>> {
    let params = new HttpParams()
      .set('fldPageNumber', pageNumber.toString()) 
      .set('fldPageSize', pageSize.toString());
    return this.http.get<ApiResponseCliente<ClienteListDTO[]>>(this.baseApiUrl, { params: params }).pipe(
      catchError(this.handleError)
    );
  }

   obtenerClientes(): Observable<ApiResponseCliente<ClienteListDTO[]>> {
    const apiUrl = `${this.baseApiUrl}?fldPageNumber=1&fldPageSize=10`;
    return this.http.get<ApiResponseCliente<ClienteListDTO[]>>(apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  crearCliente(data: ClienteCreateDTO, foto?: File): Observable<ApiResponseCliente<ClienteListDTO>> {

      const formData = new FormData();

      const payload: ClienteCreateDTO = {
          ...data,
          idCliente: 0,
          fldImagenPerfil: '',
      };

      formData.append(
          'datos',
          new Blob([JSON.stringify(payload)], { type: 'application/json' })
      );

      if (foto) {
          formData.append('foto', foto, foto.name);
      }

      return this.http.post<ApiResponseCliente<ClienteListDTO>>(
          this.crearUrl,
          formData
      ).pipe(
          catchError(this.handleError)
      );
  }

  editarCliente(data: ClienteEditDTO,foto?: File):Observable<ApiResponseCliente<ClienteEditDTO>> {

    data.fldImagenPerfil = data.fldImagenPerfil?? '';

    const formData = new FormData();

    formData.append('datos', new Blob([JSON.stringify(data)], { type: 'application/json' }));

    if (foto) {
      formData.append('foto', foto, foto.name);
    }

    return this.http.put<ApiResponseCliente<ClienteEditDTO>>(
      this.editarUrl,
      formData
    ).pipe(catchError(this.handleError));
  }
 
  eliminarClientes(id: number): Observable<ApiResponseCliente<any>> {
    const url = `${this.eliminarUrl}?id=${id}`;
    return this.http.delete<ApiResponseCliente<any>>(url).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.error?.mensaje || 'Error desconocido del servidor'));
  }

}