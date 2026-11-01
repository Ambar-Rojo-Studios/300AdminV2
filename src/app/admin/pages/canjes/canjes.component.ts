import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { TableColumn, SortEvent } from '../../../shared/models/table.model';
import { CanjesResumenDTO } from '../../../models/canjes-resumen.model';
import { CanjeDetalleAdminDTO, CanjesPaginaDTO } from '../../../models/canje-detalle.model';
import { CanjesService } from '../../../services/canjes.service';
import { csvCell, fechaHoyChiapas, formatearFechaCanje, rangoRapidoChiapas, RangoRapidoCanjes } from '../../../utils/canjes-fechas';

const TAMANO_PAGINA = 15;

@Component({
  selector: 'app-canjes',
  standalone: true,
  imports: [CommonModule, DataTableComponent, ModalComponent],
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
  readonly establecimientoSeleccionado = signal<CanjesResumenDTO | null>(null);
  readonly detalleFilas = signal<CanjeDetalleAdminDTO[]>([]);
  readonly detalleTotal = signal(0);
  readonly detallePagina = signal(0);
  readonly detalleCargando = signal(false);
  readonly detalleError = signal('');
  readonly exportando = signal(false);
  readonly desde = signal('');
  readonly hasta = signal('');
  readonly detalleColumns: TableColumn<CanjeDetalleAdminDTO>[] = [
    { key: 'fechaHora', label: 'Fecha y hora', format: row => formatearFechaCanje(row.fechaHora) },
    { key: 'textoPromocion', label: 'Promoción' },
    { key: 'nombreCliente', label: 'Cliente' },
    { key: 'codigo', label: 'Código' },
  ];
  readonly totalPaginasDetalle = computed(() => Math.max(1, Math.ceil(this.detalleTotal() / 20)));

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

  abrirDetalle(row: CanjesResumenDTO): void {
    this.establecimientoSeleccionado.set(row);
    const hoy = fechaHoyChiapas();
    const inicio = new Date(`${hoy}T12:00:00Z`);
    inicio.setUTCDate(inicio.getUTCDate() - 29);
    this.desde.set(inicio.toISOString().slice(0, 10));
    this.hasta.set(hoy);
    this.cargarDetalle(0);
  }

  cerrarDetalle(): void { this.establecimientoSeleccionado.set(null); }

  aplicarRango(rango: RangoRapidoCanjes): void {
    const dates = rangoRapidoChiapas(rango);
    this.desde.set(dates.desde); this.hasta.set(dates.hasta); this.cargarDetalle(0);
  }

  cambiarFecha(campo: 'desde' | 'hasta', valor: string): void {
    (campo === 'desde' ? this.desde : this.hasta).set(valor);
    this.cargarDetalle(0);
  }

  cargarDetalle(pagina = this.detallePagina()): void {
    const establecimiento = this.establecimientoSeleccionado();
    if (!establecimiento) return;
    this.detalleCargando.set(true); this.detalleError.set('');
    this.service.listarDetalle(establecimiento.idEstablecimiento, {
      desde: this.desde(), hasta: this.hasta(), pagina, tamano: 20,
    }).subscribe({
      next: response => {
        const result = response?.codigoEstatus === 1 ? response.cuerpoDeRespuesta : null;
        this.detalleFilas.set(result?.filas ?? []);
        this.detalleTotal.set(result?.total ?? 0);
        this.detallePagina.set(result?.pagina ?? pagina);
        this.detalleCargando.set(false);
      },
      error: () => { this.detalleError.set('No se pudieron cargar los canjes.'); this.detalleCargando.set(false); },
    });
  }

  onDetallePageChange(paginaUno: number): void { this.cargarDetalle(paginaUno - 1); }

  async exportarCsv(): Promise<void> {
    const establecimiento = this.establecimientoSeleccionado();
    if (!establecimiento || this.detalleTotal() === 0 || this.exportando()) return;
    this.exportando.set(true);
    try {
      const rows: CanjeDetalleAdminDTO[] = [];
      let pagina = 0;
      let total = this.detalleTotal();
      while (rows.length < total) {
        const response = await new Promise<CanjeDetalleAdminDTO[]>((resolve, reject) => {
          this.service.listarDetalle(establecimiento.idEstablecimiento, {
            desde: this.desde(), hasta: this.hasta(), pagina, tamano: 100,
          }).subscribe({
            next: value => value?.codigoEstatus === 1
              ? resolve(value.cuerpoDeRespuesta?.filas ?? []) : reject(new Error('Respuesta inválida')),
            error: reject,
          });
        });
        rows.push(...response); total = Math.min(total, rows.length + response.length);
        if (response.length === 0) break;
        pagina++;
      }
      const csv = [
        ['Fecha y hora', 'Promoción', 'Cliente', 'Código'].map(csvCell).join(','),
        ...rows.map(row => [formatearFechaCanje(row.fechaHora), row.textoPromocion, row.nombreCliente, row.codigo].map(csvCell).join(',')),
      ].join('\r\n');
      const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a'); link.href = url;
      link.download = `canjes-${establecimiento.idEstablecimiento}-${this.desde()}-${this.hasta()}.csv`;
      link.click(); URL.revokeObjectURL(url);
    } catch {
      this.detalleError.set('No se pudo exportar el CSV. Intenta de nuevo.');
    } finally { this.exportando.set(false); }
  }
}
