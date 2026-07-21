import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { EtiquetasXClienteService } from '../../../../services/etiqueta-cliente.service';
import { EtiquetasService } from '../../../../services/etiquetas.service';
import {
  EtiquetaAsociada,
  EtiquetaDisponible,
  EtiquetasAdapter,
} from '../../../models/etiqueta-asociada.model';

/**
 * Implementación de EtiquetasAdapter para clientes.
 * Traduce entre los DTOs de etiqueta_x_cliente y el contrato genérico que
 * espera <app-etiquetas-selector>.
 */
@Injectable({ providedIn: 'root' })
export class ClienteEtiquetasAdapter implements EtiquetasAdapter {
  private readonly etiquetasXCliente = inject(EtiquetasXClienteService);
  private readonly etiquetasService = inject(EtiquetasService);

  obtenerAsociadas(clienteId: number): Observable<EtiquetaAsociada[]> {
    return this.etiquetasXCliente.obtenerEtiquetasPorCliente(clienteId).pipe(
      map((res) =>
        (res.cuerpoDeRespuesta ?? []).map((t) => ({
          id: t.id,
          idEtiqueta: t.fkIdEtiqueta,
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

  crear(clienteId: number, idEtiqueta: number): Observable<unknown> {
    return this.etiquetasXCliente.createEtiquetasXCliente({
      id: 0,
      fkIdCliente: clienteId,
      fkIdEtiqueta: idEtiqueta,
    });
  }

  eliminar(idRelacion: number): Observable<unknown> {
    return this.etiquetasXCliente.eliminarEtiquetaCliente(idRelacion);
  }
}
