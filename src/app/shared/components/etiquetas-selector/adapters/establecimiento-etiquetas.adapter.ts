import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { TagsEtiquetasXEstablecimientoService } from '../../../../services/etiqueta-establecimiento.service';
import { EtiquetasService } from '../../../../services/etiquetas.service';
import {
  EtiquetaAsociada,
  EtiquetaDisponible,
  EtiquetasAdapter,
} from '../../../models/etiqueta-asociada.model';

/**
 * Implementación de EtiquetasAdapter para establecimientos.
 * Traduce entre los DTOs de etiqueta_x_establecimiento y el contrato
 * genérico que espera <app-etiquetas-selector>.
 */
@Injectable({ providedIn: 'root' })
export class EstablecimientoEtiquetasAdapter implements EtiquetasAdapter {
  private readonly etiquetasXEstablecimiento = inject(TagsEtiquetasXEstablecimientoService);
  private readonly etiquetasService = inject(EtiquetasService);

  obtenerAsociadas(establecimientoId: number): Observable<EtiquetaAsociada[]> {
    return this.etiquetasXEstablecimiento
      .obtenerEtiquetasPorEstablecimiento(establecimientoId)
      .pipe(
        map((res) =>
          (res.cuerpoDeRespuesta ?? []).map((t) => ({
            id: t.id,
            idEtiqueta: t.idEtiqueta,
            fldNombre: t.fldNombre,
            fldCategoria: t.fldCategoria,
          }))
        )
      );
  }

  obtenerDisponibles(): Observable<EtiquetaDisponible[]> {
    return this.etiquetasService.listarEtiquetas(1, 1000).pipe(
      map((res) =>
        (res.cuerpoDeRespuesta ?? []).map((e) => ({
          idEtiqueta: e.idEtiqueta,
          fldNombre: e.fldNombre,
          fldCategoria: e.fldCategoria,
        }))
      )
    );
  }

  crear(establecimientoId: number, idEtiqueta: number): Observable<unknown> {
    return this.etiquetasXEstablecimiento.crearEtiquetaEnEstablecimiento({
      id: 0,
      fkIdEstablecimiento: establecimientoId,
      fkIdEtiqueta: idEtiqueta,
    });
  }

  eliminar(idRelacion: number): Observable<unknown> {
    return this.etiquetasXEstablecimiento.eliminarEtiquetaDeEstablecimiento(idRelacion);
  }
}
