import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponseCanjes, CanjesResumenDTO } from '../models/canjes-resumen.model';
import { CanjeDetalleAdminDTO, CanjesPaginaDTO, FiltroCanjes } from '../models/canje-detalle.model';

@Injectable({ providedIn: 'root' })
export class CanjesService {
  private readonly http = inject(HttpClient);

  listarResumen(): Observable<ApiResponseCanjes<CanjesResumenDTO[]>> {
    return this.http.get<ApiResponseCanjes<CanjesResumenDTO[]>>('/api/historial/canjes-resumen');
  }

  listarDetalle(idEstablecimiento: number, filtro: FiltroCanjes): Observable<ApiResponseCanjes<CanjesPaginaDTO<CanjeDetalleAdminDTO>>> {
    const params = this.params(filtro);
    return this.http.get<ApiResponseCanjes<CanjesPaginaDTO<CanjeDetalleAdminDTO>>>(
      `/api/historial/canjes/${idEstablecimiento}`, { params },
    );
  }

  private params(filtro: FiltroCanjes): HttpParams {
    return new HttpParams()
      .set('desde', filtro.desde)
      .set('hasta', filtro.hasta)
      .set('pagina', filtro.pagina)
      .set('tamano', filtro.tamano);
  }
}
