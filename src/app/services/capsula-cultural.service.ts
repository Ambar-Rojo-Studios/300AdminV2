import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { ApiResponseCultural, ListCulturalDTO, CreateCulturalDTO, EditCulturalDTO } from "../models/cultural.model";

@Injectable({
  providedIn: "root",
})

/**
 * Servicio para gestionar la información de cápsulas culturales disponibles en la plataforma.
 */
export class CulturalService {
    private baseApiUrl = "/api/capsula-cultural/list-all";
    private crearCulturalUrl = "/api/capsula-cultural/create";
    private editarCulturalUrl = "/api/capsula-cultural/edit";
    private eliminarCulturalUrl = "/api/capsula-cultural/delete";

    constructor(private http: HttpClient) {}

    // Obtener todas las cápsulas culturales
    obtenerCulturales(): Observable<ApiResponseCultural<ListCulturalDTO[]>> {
        return this.http.get<ApiResponseCultural<ListCulturalDTO[]>>(this.baseApiUrl)
            .pipe(catchError(this.handleError));
    }


    // Crear una nueva cápsula cultural
    
      crearCultural(data: CreateCulturalDTO, foto?: File,):Observable<ApiResponseCultural<ListCulturalDTO>> {
    

        const formData = new FormData();
    
        const payload: CreateCulturalDTO = {
          ...data,
          idCapsula: 0,
          fldImagen: '',
        };
    
        formData.append('datos', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    
        if(foto){
          formData.append('foto', foto, foto.name);
        }
        return this.http.post<ApiResponseCultural<ListCulturalDTO>>(
          this.crearCulturalUrl,
          formData
        ).pipe(
          catchError(this.handleError)
        );
      }

      // Editar una cápsula cultural existente

      editarCultural(data: EditCulturalDTO,foto?: File):Observable<ApiResponseCultural<EditCulturalDTO>> {

        data.fldImagen = data.fldImagen ?? '';

        const formData = new FormData();
    
        formData.append('datos', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    
        if (foto) {
          formData.append('foto', foto, foto.name);
        }
    
        
        return this.http.put<ApiResponseCultural<EditCulturalDTO>>(
          this.editarCulturalUrl,
          formData
        ).pipe(catchError(this.handleError));
      }
    

    // Eliminar una cápsula cultural por su ID
    eliminarCultural(fldId: number): Observable<ApiResponseCultural<null>> {
    const url = `${this.eliminarCulturalUrl}?id=${fldId}`;
    return this.http.delete<ApiResponseCultural<null>>(url)
        .pipe(catchError(this.handleError));
}

    
    private handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.error?.mensaje || 'Error desconocido del servidor'));
  }
}