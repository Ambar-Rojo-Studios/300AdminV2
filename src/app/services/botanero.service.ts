import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponseBotanero, BotaneroStatsDTO, BotaneroEstablecimientoDTO, BotaneroPromosDTO } from '../models/botanero.model';
import { listarComentario } from '../models/comentario.model';

/**
 * Servicio del portal de botaneros. Todos los endpoints requieren
 * ROLE_BOTANERO y operan solo sobre los establecimientos de la empresa
 * del token (validado en servidor).
 */
@Injectable({
  providedIn: 'root'
})
export class BotaneroService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = '/api/botanero/establecimientos';

  listarMisEstablecimientos(): Observable<ApiResponseBotanero<BotaneroEstablecimientoDTO[]>> {
    return this.http.get<ApiResponseBotanero<BotaneroEstablecimientoDTO[]>>(this.API_URL);
  }

  obtenerEstablecimiento(id: number): Observable<ApiResponseBotanero<BotaneroEstablecimientoDTO>> {
    return this.http.get<ApiResponseBotanero<BotaneroEstablecimientoDTO>>(`${this.API_URL}/${id}`);
  }

  // El backend consume multipart/form-data con las partes "datos" (JSON), "perfil" y "menu".
  // El FormData se arma en el componente cuando llegue el establecimiento-form compartido (Ma. Fernanda, E2).
  editarEstablecimiento(id: number, form: FormData): Observable<ApiResponseBotanero<BotaneroEstablecimientoDTO>> {
    return this.http.put<ApiResponseBotanero<BotaneroEstablecimientoDTO>>(`${this.API_URL}/${id}`, form);
  }

  // Ojo: el backend espera un OBJETO BotaneroPromosDTO, no un array.
  editarPromos(id: number, promos: BotaneroPromosDTO): Observable<ApiResponseBotanero<BotaneroEstablecimientoDTO>> {
    return this.http.put<ApiResponseBotanero<BotaneroEstablecimientoDTO>>(`${this.API_URL}/${id}/promos`, promos);
  }

  listarComentarios(id: number): Observable<ApiResponseBotanero<listarComentario[]>> {
    return this.http.get<ApiResponseBotanero<listarComentario[]>>(`${this.API_URL}/${id}/comentarios`);
  }

  obtenerStats(id: number): Observable<ApiResponseBotanero<BotaneroStatsDTO>> {
    return this.http.get<ApiResponseBotanero<BotaneroStatsDTO>>(`${this.API_URL}/${id}/stats`);
  }
}
