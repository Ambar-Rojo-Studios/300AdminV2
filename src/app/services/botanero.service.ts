import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponseBotanero, BotaneroStatsDTO } from '../models/botanero.model';
import { EstablecimientoResponseDTO, idEstablecimiento, EstablecimientoEditDTO } from '../models/establecimiento.model';
import { listarComentario } from '../models/comentario.model';
import { listarPromocionesDTO } from '../models/promocion.model';

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

  listarMisEstablecimientos(): Observable<ApiResponseBotanero<EstablecimientoResponseDTO[]>> {
    return this.http.get<ApiResponseBotanero<EstablecimientoResponseDTO[]>>(this.API_URL);
  }

  obtenerEstablecimiento(id: number): Observable<ApiResponseBotanero<idEstablecimiento>> {
    return this.http.get<ApiResponseBotanero<idEstablecimiento>>(`${this.API_URL}/${id}`);
  }

  editarEstablecimiento(id: number, datos: EstablecimientoEditDTO): Observable<ApiResponseBotanero<idEstablecimiento>> {
    return this.http.put<ApiResponseBotanero<idEstablecimiento>>(`${this.API_URL}/${id}`, datos);
  }

  editarPromos(id: number, promos: listarPromocionesDTO[]): Observable<ApiResponseBotanero<listarPromocionesDTO[]>> {
    return this.http.put<ApiResponseBotanero<listarPromocionesDTO[]>>(`${this.API_URL}/${id}/promos`, promos);
  }

  listarComentarios(id: number): Observable<ApiResponseBotanero<listarComentario[]>> {
    return this.http.get<ApiResponseBotanero<listarComentario[]>>(`${this.API_URL}/${id}/comentarios`);
  }

  obtenerStats(id: number): Observable<ApiResponseBotanero<BotaneroStatsDTO>> {
    return this.http.get<ApiResponseBotanero<BotaneroStatsDTO>>(`${this.API_URL}/${id}/stats`);
  }
}
