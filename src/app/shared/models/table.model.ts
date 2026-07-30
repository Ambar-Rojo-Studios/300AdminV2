/**
 * Definición de una columna para <app-data-table>.
 * T es el tipo de fila (p. ej. ListEmpresaDTO).
 */
export interface TableColumn<T = any> {
  /** Clave del dato. Soporta rutas anidadas simples: 'direccion.ciudad'. */
  key: string;
  /** Texto del encabezado. */
  label: string;
  /** Habilita el click para ordenar por esta columna. */
  sortable?: boolean;
  /** Alineación del contenido de la celda. */
  align?: 'left' | 'center' | 'right';
  /** Ancho fijo opcional (ej. '80px'). */
  width?: string;
  /** Formateador custom: recibe la fila completa y devuelve el texto a mostrar. */
  format?: (row: T) => string;
}

export type SortDirection = 'asc' | 'desc' | null;

export interface SortEvent {
  key: string;
  direction: SortDirection;
}
