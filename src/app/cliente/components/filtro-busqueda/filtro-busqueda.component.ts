import {
  Component,
  EventEmitter,
  Output,
  inject,
  OnDestroy,
  AfterViewInit,
  Renderer2,
  Input,
  HostBinding,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

import { EstablecimientosService } from '../../../services/establecimientos.service';
import { EstablecimientoListDTO } from '../../../models/establecimiento.model';

@Component({
  selector: 'app-filtro-busqueda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filtro-busqueda.component.html',
  styleUrls: ['./filtro-busqueda.component.css'],
})
export class FiltroBusquedaComponent implements AfterViewInit, OnDestroy {
  @Input() width = '100%';
  @Input() height = 'auto';

  @HostBinding('style.width') get hostWidth(): string {
    return this.width;
  }
  @HostBinding('style.height') get hostHeight(): string {
    return this.height;
  }

  @Output() establecimientoSeleccionado = new EventEmitter<EstablecimientoListDTO>();

  searchText = '';
  resultados: EstablecimientoListDTO[] = [];
  mostrarResultados = false;

  private filtro$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  private isMouseOverDropdown = false;
  private removeClickListener?: () => void;

  private readonly establecimientosService = inject(EstablecimientosService);
  private readonly renderer = inject(Renderer2);
  private readonly router = inject(Router);

  constructor() {
    this.initFiltro();
  }

  ngAfterViewInit(): void {
    this.initClickOutside();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.removeClickListener?.();
  }

  onSearchChange(value: string): void {
    this.searchText = value;
    this.filtro$.next(value);
  }

  onInputFocus(): void {
    if (this.resultados.length > 0) this.mostrarResultados = true;
  }

  onInputBlur(): void {
    setTimeout(() => {
      if (!this.isMouseOverDropdown) this.mostrarResultados = false;
    }, 200);
  }

  onDropdownEnter(): void {
    this.isMouseOverDropdown = true;
  }

  onDropdownLeave(): void {
    this.isMouseOverDropdown = false;
  }

  seleccionar(est: EstablecimientoListDTO): void {
    if (!est?.idEstablecimiento) return;
    this.establecimientoSeleccionado.emit(est);
    this.searchText = est.fldNombre ?? '';
    this.mostrarResultados = false;
    this.resultados = [];
    this.router.navigate(['/detalleEstablecimiento', est.idEstablecimiento]);
  }

  trackById(_: number, item: EstablecimientoListDTO): number {
    return item.idEstablecimiento ?? _;
  }

  private initFiltro(): void {
    this.filtro$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((termino) => {
        const value = termino.trim();
        if (value.length > 0) this.obtenerResultados(value);
        else this.limpiarResultados();
      });
  }

  private obtenerResultados(filtro: string): void {
    this.establecimientosService
      .obtenerEstablecimientoFiltrado(1, 10, filtro)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.resultados = response?.cuerpoDeRespuesta ?? [];
          this.mostrarResultados = this.resultados.length > 0;
        },
        error: (err: any) => {
          console.error('[FiltroBusqueda] error:', err);
          this.limpiarResultados();
        },
      });
  }

  private limpiarResultados(): void {
    this.resultados = [];
    this.mostrarResultados = false;
  }

  private initClickOutside(): void {
    this.removeClickListener = this.renderer.listen('document', 'click', (event: Event) => {
      const target = event.target as HTMLElement;
      const inside = target.closest('.buscador-container');
      if (!inside && this.mostrarResultados) this.mostrarResultados = false;
    });
  }
}