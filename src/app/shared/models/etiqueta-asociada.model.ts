import { Observable } from 'rxjs';

/** Etiqueta ya asociada a una entidad (cliente, establecimiento, etc). */
export interface EtiquetaAsociada {
  /** Id de la relación (fila en etiqueta_x_cliente / etiqueta_x_establecimiento). Se usa para eliminar. */
  id: number;
  /** Id de la etiqueta en el catálogo general. */
  idEtiqueta: number;
  /** Nombre de la etiqueta. */
  fldNombre: string;
  /** Nombre de la categoría a la que pertenece, para agrupar visualmente. */
  fldCategoria: string;
}

/** Etiqueta disponible en el catálogo general, para el selector de "agregar". */
export interface EtiquetaDisponible {
  idEtiqueta: number;
  fldNombre: string;
  fldCategoria: string;
}

/**
 * Contrato que debe cumplir cualquier "fuente de datos" de etiquetas para
 * poder usarse con <app-etiquetas-selector>.
 *
 * Hoy existen dos implementaciones casi idénticas de este flujo
 * (etiquetas-cliente y etiquetas-establecimiento) que solo difieren en qué
 * endpoint llaman. Con este adapter, el componente de UI queda ÚNICO y cada
 * caso de uso (cliente, establecimiento, y cualquier entidad futura que
 * tenga etiquetas) solo aporta una implementación pequeña de esta interfaz,
 * sin tocar los servicios HTTP existentes.
 */
export interface EtiquetasAdapter {
  /** Etiquetas ya asociadas a la entidad. */
  obtenerAsociadas(entidadId: number): Observable<EtiquetaAsociada[]>;
  /** Catálogo completo de etiquetas para poder agregar nuevas. */
  obtenerDisponibles(): Observable<EtiquetaDisponible[]>;
  /** Crea la relación entidad-etiqueta. */
  crear(entidadId: number, idEtiqueta: number): Observable<unknown>;
  /** Elimina la relación por su id (no el id de la etiqueta). */
  eliminar(idRelacion: number): Observable<unknown>;
}
