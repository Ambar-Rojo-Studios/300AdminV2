import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApiResponseNotificaciones,
  EnviarNotificacionRequest,
  EnvioNotificacionResponse,
  HistorialNotificacionDTO,
  ResumenNotificacionesDTO,
} from '../models/notificacion-admin.model';

@Injectable({ providedIn: 'root' })
export class NotificacionesAdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/notificaciones';

  obtenerResumen(): Observable<ApiResponseNotificaciones<ResumenNotificacionesDTO>> {
    return this.http.get<ApiResponseNotificaciones<ResumenNotificacionesDTO>>(`${this.baseUrl}/resumen`);
  }

  obtenerHistorial(): Observable<ApiResponseNotificaciones<HistorialNotificacionDTO[]>> {
    return this.http.get<ApiResponseNotificaciones<HistorialNotificacionDTO[]>>(`${this.baseUrl}/historial`);
  }

  enviar(request: EnviarNotificacionRequest): Observable<ApiResponseNotificaciones<EnvioNotificacionResponse>> {
    return this.http.post<ApiResponseNotificaciones<EnvioNotificacionResponse>>(`${this.baseUrl}/enviar`, request);
  }
}
