import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponseCanjes, CanjesResumenDTO } from '../models/canjes-resumen.model';

@Injectable({ providedIn: 'root' })
export class CanjesService {
  private readonly http = inject(HttpClient);

  listarResumen(): Observable<ApiResponseCanjes<CanjesResumenDTO[]>> {
    return this.http.get<ApiResponseCanjes<CanjesResumenDTO[]>>('/api/historial/canjes-resumen');
  }
}
