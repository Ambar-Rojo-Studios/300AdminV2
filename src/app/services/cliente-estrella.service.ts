// src/app/cliente-estrella-controler.services.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateClienteEstrella, ApiResponseClienteEstrella } from '../models/cliente-estrella.model';


@Injectable({
  providedIn: 'root'
})

/**
 * Servicio para gestionar los clientes destacados o de relevancia especial.
 */
export class ClienteEstrellaService {
  private apiUrl = '/api/estrellas/create';

  constructor(private http: HttpClient) {}

  crearEstrella(payload: CreateClienteEstrella): Observable<ApiResponseClienteEstrella<CreateClienteEstrella>> {
    return this.http.post<ApiResponseClienteEstrella<CreateClienteEstrella>>(this.apiUrl, payload);
  }
  
}
