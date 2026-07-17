import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import {ApiHistorialCodigo,ListHistorialCodigo} from "../models/historial-codigo.model"

@Injectable({
    providedIn:"root",
})

export class HistorialService{

    private baseApiUrl = "/api/historial/ListAllPromosCanjeadas";

    constructor(private http:HttpClient){}

    obtenerHistorial():Observable<ApiHistorialCodigo<ListHistorialCodigo>>{
        return this.http.get<ApiHistorialCodigo<ListHistorialCodigo>>(this.baseApiUrl).pipe(catchError(this.handleError));
    }

    private handleError(error: HttpErrorResponse) {
    console.error('❌ [Service] Ocurrió un error en la API:', error);
    return throwError(() => new Error(error.error?.mensaje || 'Error desconocido del servidor'));
  }
}