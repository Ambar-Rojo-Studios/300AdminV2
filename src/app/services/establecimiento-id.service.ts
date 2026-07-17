import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
/**
 * Servicio para obtener información detallada de un establecimiento mediante su identificador.
 */
export class EstablecimientoIdService {
  private idEstablecimientoSource = new BehaviorSubject<number | null>(null);
  idEstablecimiento$ = this.idEstablecimientoSource.asObservable();

  setIdEstablecimiento(id: number | null): void {
    this.idEstablecimientoSource.next(id);
  }
}