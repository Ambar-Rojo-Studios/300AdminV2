import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { TableColumn, SortEvent } from '../../../shared/models/table.model';
import { CanjesResumenDTO } from '../../../models/canjes-resumen.model';
import { CanjesService } from '../../../services/canjes.service';

const TAMANO_PAGINA = 15;

@Component({
  selector: 'app-canjes',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  templateUrl: './canjes.component.html',
  styleUrl: './canjes.component.css',
})
export class CanjesComponent implements OnInit {
  private readonly service = inject(CanjesService);
  readonly filas = signal<CanjesResumenDTO[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly busqueda = signal('');
  readonly pagina = signal(1);
  readonly sortKey = signal<string | null>('nombreEstablecimiento');
  readonly sortDirection = signal<'asc' | 'desc' | null>('asc');

  readonly columns: TableColumn<CanjesResumenDTO>[] = [
    { key: 'nombreEstablecimiento', label: 'Establecimiento', sortable: true },
    { key: 'hoy', label: 'Hoy', sortable: true, align: 'right' },
    { key: 'semana', label: 'Esta semana', sortable: true, align: 'right' },
    { key: 'mes', label: 'Este mes', sortable: true, align: 'right' },
    { key: 'total', label: 'Total', sortable: true, align: 'right' },
  ];

  readonly filtradas = computed(() => {
    const query = this.busqueda().trim().toLocaleLowerCase('es-MX');
    const rows = this.filas().filter(row => row.nombreEstablecimiento.toLocaleLowerCase('es-MX').includes(query));
    const key = this.sortKey() as keyof CanjesResumenDTO | null;
    const direction = this.sortDirection();
    if (!key || !direction) return rows;
    return [...rows].sort((a, b) => {
      const left = a[key];
      const right = b[key];
      const comparison = typeof left === 'string' && typeof right === 'string'
        ? left.localeCompare(right, 'es-MX')
        : Number(left) - Number(right);
      return direction === 'asc' ? comparison : -comparison;
    });
  });

  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtradas().length / TAMANO_PAGINA)));
  readonly paginaActual = computed(() => Math.min(this.pagina(), this.totalPaginas()));
  readonly paginaFilas = computed(() => {
    const inicio = (this.paginaActual() - 1) * TAMANO_PAGINA;
    return this.filtradas().slice(inicio, inicio + TAMANO_PAGINA);
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.service.listarResumen().subscribe({
      next: response => {
        this.filas.set(response?.codigoEstatus === 1 ? response.cuerpoDeRespuesta ?? [] : []);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(error.message || 'No se pudieron cargar los canjes.');
        this.cargando.set(false);
      },
    });
  }

  onBuscar(valor: string): void {
    this.busqueda.set(valor);
    this.pagina.set(1);
  }

  onSort(event: SortEvent): void {
    this.sortKey.set(event.direction ? event.key : null);
    this.sortDirection.set(event.direction);
    this.pagina.set(1);
  }

  onPageChange(page: number): void {
    this.pagina.set(page);
  }

  readonly trackEstablecimiento = (_index: number, row: CanjesResumenDTO) => row.idEstablecimiento;
}
