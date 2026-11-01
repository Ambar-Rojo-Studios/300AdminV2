import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiResponseTagsEtiquetasXEstablecimiento, TagsEtiquetasXEstablecimiento } from '../models/tags-etiquetasXEstablecimiento.model';
import { ApiResponseEtiqueta, ListCategoriaConEtiquetasDTO } from '../models/etiquetas.model';

@Injectable({ providedIn: 'root' })
export class EtiquetasPublicService {
  private readonly http = inject(HttpClient);

  obtenerEtiquetasPorEstablecimiento(id: number) {
    return this.http.get<ApiResponseTagsEtiquetasXEstablecimiento<TagsEtiquetasXEstablecimiento[]>>(
      '/api/etiquetaPorEstablecimientoPublic/list', { params: new HttpParams().set('id', id) }
    );
  }

  obtenerCategoriasConEtiquetas() {
    return this.http.get<ApiResponseEtiqueta<ListCategoriaConEtiquetasDTO[]>>(
      '/api/etiquetasPublic/list-movileapp'
    );
  }
}
