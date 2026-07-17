// src/app/services/establecimientos.services.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, firstValueFrom } from 'rxjs';
import {ApiResponseEstablecimiento,EstablecimientoCreateDTO,EstablecimientoEditDTO,EstablecimientoListDTO,
EstablecimientoResponseDTO,idEstablecimiento} from '../models/establecimiento.model';

@Injectable({
  providedIn: 'root'
})

export class EstablecimientosService {

  private readonly baseApiUrl   = '/api/establecimientos/list';
  private readonly crearUrl     = '/api/establecimientos/create';
  private readonly editUrl      = '/api/establecimientos/edit';
  private readonly deleteUrl    = '/api/establecimientos/delete';
  private readonly idApiUrl     = '/api/establecimientos/get-byid';
  private readonly filtradoUrl  = '/api/establecimientos/filter-list';

  constructor(private http: HttpClient) {}

  obtenerEstablecimientos(pageNumber: number,pageSize: number): Observable<ApiResponseEstablecimiento<EstablecimientoListDTO[]>> {

    const params = new HttpParams()
      .set('fldPageNumber', pageNumber.toString())
      .set('fldPageSize', pageSize.toString());

    return this.http
      .get<ApiResponseEstablecimiento<EstablecimientoListDTO[]>>(this.baseApiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  obtenerEstablecimientoFiltrado(pageNumber: number,pageSize: number,filtro: string): Observable<ApiResponseEstablecimiento<EstablecimientoListDTO[]>> {
    const params = new HttpParams()
      .set('fldPageNumber', pageNumber.toString())
      .set('fldPageSize', pageSize.toString())
      .set('fldNombre', filtro);

    return this.http
      .get<ApiResponseEstablecimiento<EstablecimientoListDTO[]>>(this.baseApiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * CONTABILIDAD DINÁMICA: Obtiene el total de establecimientos para el dashboard
   * Solicita un pageSize grande (10000) para obtener prácticamente todos los registros
   * y contar el total real desde el backend
   * @returns Promise<number> Total de establecimientos
   */
  async obtenerTotalEstablecimientos(): Promise<number> {
    try {
      const params = new HttpParams()
        .set('fldPageNumber', '1')
        .set('fldPageSize', '10000');
      
      const res = await firstValueFrom(
        this.http.get<ApiResponseEstablecimiento<EstablecimientoListDTO[]>>(this.baseApiUrl, { params })
          .pipe(catchError(this.handleError))
      );
      
      if (res?.codigoEstatus === 1 && res.cuerpoDeRespuesta) {
        return res.cuerpoDeRespuesta.length;
      }
      return 0;
    } catch (error) {
      console.error('Error al obtener total de establecimientos:', error);
      return 0;
    }
  }

  /**
   * Crea un nuevo establecimiento
   * @param data Datos del establecimiento
   * @param foto El archivo de la imagen principal del establecimiento (obligatorio)
   * @param menu Archivo del menú (opcional)
   * @param foto2 Segundo archivo de imagen (opcional)
   * @param foto3 Tercer archivo de imagen (opcional)
   * @param foto4 Cuarto archivo de imagen (opcional)
   * @returns Observable con la respuesta del servidor
   */
  createEstablecimiento(data: EstablecimientoCreateDTO, foto: File, menu?: File, foto2?: File, foto3?: File, foto4?: File):Observable<ApiResponseEstablecimiento<EstablecimientoListDTO>> {

    if (!foto) throw new Error('La foto principal es obligatoria.');

    const formData = new FormData();

    const payload: EstablecimientoCreateDTO = {
      ...data,
      idEstablecimiento: 0,
      fldImgRefs: '',
      fldImgRefs2: '',
      fldImgRefs3: '',
      fldImgRefs4: '',
      fldMenu: ''
    };

    formData.append('datos', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

    if(foto){
      formData.append('foto', foto, foto.name);
    }

    if (foto2) {
      formData.append('foto2', foto2, foto2.name);
    }

    if (foto3) {
      formData.append('foto3', foto3, foto3.name);
    }

    if (foto4) {
      formData.append('foto4', foto4, foto4.name);
    }

    if (menu){ 
      formData.append('menu', menu, menu.name)
    };

    return this.http.post<ApiResponseEstablecimiento<EstablecimientoListDTO>>(
      this.crearUrl,
      formData
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Edita un establecimiento existente
   * @param data Datos del establecimiento a actualizar
   * @param foto El archivo de la imagen principal del establecimiento (opcional)
   * @param menu Archivo del menú (opcional)
   * @param foto2 Un archivo de imagen opcional. Si se envía, reemplazará la segunda foto existente.
   * @param foto3 Un archivo de imagen opcional. Si se envía, reemplazará la tercera foto existente.
   * @param foto4 Un archivo de imagen opcional. Si se envía, reemplazará la cuarta foto existente.
   * @returns Observable con la respuesta del servidor
   */
  editEstablecimiento(data: EstablecimientoEditDTO, foto?: File, menu?: File, foto2?: File, foto3?: File, foto4?: File):Observable<ApiResponseEstablecimiento<EstablecimientoEditDTO>> {

    data.fldImgRefs = data.fldImgRefs ?? '';
    data.fldImgRefs2 = data.fldImgRefs2 ?? '';
    data.fldImgRefs3 = data.fldImgRefs3 ?? '';
    data.fldImgRefs4 = data.fldImgRefs4 ?? '';
    data.fldMenu = data.fldMenu ?? '';

    const formData = new FormData();

    formData.append('datos', new Blob([JSON.stringify(data)], { type: 'application/json' }));

    if (foto) {
      formData.append('foto', foto, foto.name);
    }

    if (foto2) {
      formData.append('foto2', foto2, foto2.name);
    }

    if (foto3) {
      formData.append('foto3', foto3, foto3.name);
    }

    if (foto4) {
      formData.append('foto4', foto4, foto4.name);
    }

    if (menu) {
      formData.append('menu', menu, menu.name);
    }
    
    return this.http.put<ApiResponseEstablecimiento<EstablecimientoEditDTO>>(
      this.editUrl,
      formData
    ).pipe(catchError(this.handleError));
  }

  deleteEstablecimiento(id: number): Observable<ApiResponseEstablecimiento<any>> {
     const url = `${this.deleteUrl}?id=${id}`;
        return this.http.delete<ApiResponseEstablecimiento<any>>(url).pipe(
          catchError(this.handleError)
      );
  }

  obtenerTodosEstablecimientos(): Observable<ApiResponseEstablecimiento<EstablecimientoListDTO[]>> {
    const params = new HttpParams()
      .set('fldPageNumber', '1')
      .set('fldPageSize', '200');

    return this.http.get<ApiResponseEstablecimiento<EstablecimientoListDTO[]>>(this.baseApiUrl, { params })
      .pipe(catchError(this.handleError));
  }

    filtrarPorEtiquetas(fldEtiquetCsv: number[], esBusquedaEstricta: boolean): Observable<ApiResponseEstablecimiento<EstablecimientoResponseDTO[]>> {

    let params = new HttpParams()
      .set('esBusquedaEstricta', esBusquedaEstricta.toString());

    fldEtiquetCsv.forEach(tagId => {
      params = params.append('fldEtiquetCsv', tagId.toString());
    });
    
    return this.http.get<ApiResponseEstablecimiento<EstablecimientoResponseDTO[]>>(this.filtradoUrl, { params }).pipe(
      catchError(this.handleError)
    );
  }

  obtenerIdPorEstablecimiento(id: number): Observable<ApiResponseEstablecimiento<idEstablecimiento>> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<ApiResponseEstablecimiento<idEstablecimiento>>(this.idApiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(() => error);
  }
}
