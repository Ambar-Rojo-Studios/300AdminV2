import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ComentarioService } from '../../../services/comentario.service';
import {
  listarComentario,
  ApiResponseComentario,
} from '../../../models/comentario.model';
import { EstablecimientosService } from '../../../services/establecimientos.service';
import { EstablecimientoListDTO, ApiResponseEstablecimiento } from '../../../models/establecimiento.model';
import { ToastService } from '../../../shared/services/toast.service';

import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/modal/confirm-dialog.component';
import { SelectFieldComponent, SelectOption } from '../../../shared/components/form-fields/select-field.component';
import { TableColumn } from '../../../shared/models/table.model';

@Component({
  selector: 'app-comentarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTableComponent,
    ConfirmDialogComponent,
    SelectFieldComponent,
  ],
  templateUrl: './comentarios.component.html',
})
export class ComentariosComponent implements OnInit {
  establecimientos: SelectOption[] = [];
  establecimientoId = signal<number | null>(null);

  comentarios = signal<listarComentario[]>([]);
  isLoading = signal(false);
  isDeleting = signal(false);
  showDeleteModal = signal(false);
  comentarioAEliminar = signal<listarComentario | null>(null);

  currentPage = signal(1);
  pageSize = 10;
  totalPages = signal(1);

  columns: TableColumn<listarComentario>[] = [
    { key: 'fldNombre', label: 'Cliente', width: '140px' },
    { key: 'fldComentario', label: 'Comentario' },
    { key: 'fldFechaComentario', label: 'Fecha', width: '110px' },
    {
      key: 'fldEstrellas',
      label: 'Estrellas',
      width: '90px',
      format: (row) => (row.fldEstrellas ? String(row.fldEstrellas) : '-'),
    },
  ];

  constructor(
    private comentarioService: ComentarioService,
    private establecimientosService: EstablecimientosService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.obtenerEstablecimientos();
  }

  private obtenerEstablecimientos(): void {
    this.establecimientosService
      .obtenerTodosEstablecimientos()
      .subscribe({
        next: (res: ApiResponseEstablecimiento<EstablecimientoListDTO[]>) => {
          const list = res?.cuerpoDeRespuesta ?? [];
          this.establecimientos = list.map((e) => ({
            value: e.idEstablecimiento,
            label: e.fldNombre ?? `ID ${e.idEstablecimiento}`,
          }));
        },
        error: (err: HttpErrorResponse) => {
          this.toastService.showError(
            `Error al cargar establecimientos: ${err.message}`
          );
        },
      });
  }

  onEstablecimientoChange(id: number | string | null): void {
    const numId = typeof id === 'string' ? Number(id) : id;
    this.establecimientoId.set(numId);
    this.currentPage.set(1);
    if (numId) this.obtenerComentarios();
  }

  private obtenerComentarios(): void {
    const id = this.establecimientoId();
    if (!id) return;
    this.isLoading.set(true);
    this.comentarioService
      .obtenerComentariosPorEstablecimiento(
        id,
        this.currentPage(),
        this.pageSize
      )
      .subscribe({
        next: (res: ApiResponseComentario<listarComentario[]>) => {
          const list = res?.cuerpoDeRespuesta ?? [];
          this.comentarios.set(list);
          this.totalPages.set(
            list.length < this.pageSize
              ? this.currentPage()
              : this.currentPage() + 1
          );
          this.isLoading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.toastService.showError(
            `Error al cargar comentarios: ${err.message}`
          );
        },
      });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.obtenerComentarios();
  }

  abrirModalEliminar(comentario: listarComentario): void {
    this.comentarioAEliminar.set(comentario);
    this.showDeleteModal.set(true);
  }

  cerrarModalEliminar(): void {
    this.showDeleteModal.set(false);
    this.comentarioAEliminar.set(null);
  }

  confirmarEliminar(): void {
    const c = this.comentarioAEliminar();
    if (!c) return;
    this.isDeleting.set(true);
    this.comentarioService.eliminarComentario(c.idComentario).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.toastService.showSuccess('Comentario eliminado correctamente.');
        this.obtenerComentarios();
        this.cerrarModalEliminar();
      },
      error: (err: HttpErrorResponse) => {
        this.isDeleting.set(false);
        this.toastService.showError(
          `Error al eliminar comentario: ${err.error?.mensaje || err.message}`
        );
        this.cerrarModalEliminar();
      },
    });
  }
}