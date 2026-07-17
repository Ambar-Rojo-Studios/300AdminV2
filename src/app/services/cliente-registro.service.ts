import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ClienteCreateDTO, ApiResponseCliente, ClienteListDTO } from '../models/cliente.model';

@Injectable({
  providedIn: 'root'
})
/**
 * Servicio para el registro y manejo inicial de clientes en el sistema.
 */
export class ClientesService {
  
  private registroUrl = '/api/auth/cliente/register';

  constructor(private http: HttpClient) {}

  private handleError = (error: HttpErrorResponse) => {
    console.error(' [Service] Ocurrió un error en la API:', error);

    const userMessage = error.error?.mensaje || error.error?.message || `Error ${error.status}: Fallo de conexión o respuesta no esperada.`;
    
    return throwError(() => new Error(userMessage));
  }

  registroCliente(data: ClienteCreateDTO, foto?: File): Observable<ApiResponseCliente<ClienteListDTO>> {

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
      this.registroUrl,
      formData,
    ).pipe(
      catchError(this.handleError)
    );
  }
}