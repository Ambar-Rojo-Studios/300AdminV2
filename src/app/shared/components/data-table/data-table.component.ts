import { CommonModule } from '@angular/common';
import {
  Component,
  ContentChild,
  TemplateRef,
  input,
  output,
} from '@angular/core';
import { SortDirection, SortEvent, TableColumn } from '../../models/table.model';

/**
 * Tabla paginada y genérica para el admin.
 *
 * Reemplaza el patrón copy-paste de <table> + paginación que hoy se repite
 * en empresa, establecimiento, promos, etiquetas, clientes, cápsulas e
 * historial. No trae CSS propio: usa las clases globales del sistema de
 * diseño (.table-wrapper, .pagination-controls, .no-data, etc. en styles.css)
 * para que ninguna página necesite CSS extra.
 *
 * Uso básico:
 * ```html
 * <app-data-table
 *   [columns]="columns"
 *   [data]="empresas"
 *   [loading]="isLoading"
 *   [currentPage]="currentPage"
 *   [totalPages]="totalPages"
 *   (pageChange)="onPageChange($event)"
 *   (sortChange)="onSortChange($event)"
 * >
 *   <ng-template let-row>
 *     <button class="edit-btn" (click)="abrirModal('edit', row)">
 *       <i class="fas fa-edit"></i>
 *     </button>
 *     <button class="delete-btn" (click)="abrirModal('delete', row)">
 *       <i class="fas fa-trash"></i>
 *     </button>
 *   </ng-template>
 * </app-data-table>
 * ```
 *
 * El `<ng-template>` proyectado es el "slot de acciones por fila": recibe
 * la fila como contexto implícito (`let-row`) y el índice (`let-i="index"`).
 * Si no se proyecta ningún template, la columna de acciones simplemente no
 * se renderiza.
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css'],
})
export class DataTableComponent<T = any> {
  /** Definición de columnas a renderizar. */
  columns = input.required<TableColumn<T>[]>();

  /** Filas a mostrar (ya paginadas por el padre / servicio). */
  data = input<T[]>([]);

  /** Estado de carga: muestra el spinner en vez de la tabla. */
  loading = input(false);

  /** Mensaje cuando no hay datos. */
  emptyMessage = input('No hay datos para mostrar.');

  /** Página actual, 1-indexada. */
  currentPage = input(1);

  /** Total de páginas conocidas. */
  totalPages = input(1);

  /** Columna por la que se está ordenando actualmente (si aplica). */
  sortKey = input<string | null>(null);

  /** Dirección de orden actual. */
  sortDirection = input<SortDirection>(null);

  /** Título de la columna de acciones (se oculta si no hay template). */
  actionsLabel = input('Acciones');

  /** Función para identificar cada fila en el @for (evita id, cae a la fila). */
  trackByFn = input<(index: number, row: T) => unknown>((_i, row) => (row as any)?.id ?? row);

  /** Se emite con el número de página solicitado (1-indexado). */
  pageChange = output<number>();

  /** Se emite cuando el usuario hace click en un encabezado ordenable. */
  sortChange = output<SortEvent>();

  /**
   * Template proyectado para las acciones de cada fila (editar/eliminar/etc).
   * Si el consumidor no proyecta nada, `rowActionsTpl` queda undefined y la
   * columna de acciones no se pinta.
   */
  @ContentChild(TemplateRef) rowActionsTpl?: TemplateRef<any>;

  /** Lee un valor anidado tipo 'a.b.c' de la fila, o aplica el formatter de la columna. */
  cellValue(row: T, column: TableColumn<T>): string {
    if (column.format) {
      return column.format(row);
    }
    const value = column.key
      .split('.')
      .reduce<any>((acc, k) => (acc == null ? acc : acc[k]), row);
    return value ?? '';
  }

  onHeaderClick(column: TableColumn<T>): void {
    if (!column.sortable) return;

    const isSameColumn = this.sortKey() === column.key;
    const current = isSameColumn ? this.sortDirection() : null;
    const next: SortDirection =
      current === null ? 'asc' : current === 'asc' ? 'desc' : null;

    this.sortChange.emit({ key: column.key, direction: next });
  }

  sortIcon(column: TableColumn<T>): string {
    if (!column.sortable) return '';
    if (this.sortKey() !== column.key || !this.sortDirection()) return 'fa-sort';
    return this.sortDirection() === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.pageChange.emit(page);
  }

  prevPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }
}
