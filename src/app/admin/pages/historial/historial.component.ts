import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';

import { HistorialService } from '../../../services/historial-codigo.service';
import {
  ListHistorialCodigo,
  ApiHistorialCodigo,
} from '../../../models/historial-codigo.model';
import { ToastService } from '../../../shared/services/toast.service';

import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { TableColumn } from '../../../shared/models/table.model';

const FORMATO_FECHA_HORA = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' });

/** El backend manda la fecha sin zona horaria (LocalDateTime); se muestra tal cual llega. */
function formatearFechaHora(valor: string): string {
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? valor : FORMATO_FECHA_HORA.format(fecha);
}

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  templateUrl: './historial.component.html',
})
export class HistorialComponent implements OnInit {
  historial = signal<ListHistorialCodigo[]>([]);
  isLoading = signal(false);

  currentPage = signal(1);
  totalPages = signal(1);

  columns: TableColumn<ListHistorialCodigo>[] = [
    { key: 'idCanje', label: 'Canje', width: '70px' },
    { key: 'fldfecha', label: 'Fecha y hora', format: (row) => formatearFechaHora(row.fldfecha) },
    { key: 'nombreCliente', label: 'Cliente', format: (row) => row.nombreCliente || `Cliente #${row.idCliente}` },
    { key: 'fldEstablecimiento', label: 'Establecimiento' },
    { key: 'fldNombre', label: 'Promoción' },
    { key: 'fldDescripcion', label: 'Descripción' },
    { key: 'fldSuscripcion', label: 'Suscripción' },
    { key: 'idPromocion', label: 'ID promo', width: '90px' },
  ];

  constructor(
    private historialService: HistorialService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.obtenerHistorial();
  }

  private obtenerHistorial(): void {
    this.isLoading.set(true);
    this.historialService.obtenerHistorial().subscribe({
      next: (res: ApiHistorialCodigo<any>) => {
        const raw = res?.cuerpoDeRespuesta;
        const list: ListHistorialCodigo[] = Array.isArray(raw)
          ? raw
          : raw
          ? [raw]
          : [];
        this.historial.set(list);
        this.totalPages.set(1);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.toastService.showError(
          `Error al cargar el historial: ${err.message || 'Error de conexión'}`
        );
      },
    });
  }

  onPageChange(_page: number): void {}
}