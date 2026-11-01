import { Component, EventEmitter, Output, inject, OnDestroy, Input, HostBinding, HostListener, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, map, of, Subject, switchMap, takeUntil, timer } from 'rxjs';
import { EstablecimientosPublicService } from '../../../services/establecimientos-public.service';
import { EstablecimientoListDTO } from '../../../models/establecimiento.model';

export interface EstadoBusqueda {
  termino: string;
  resultados: EstablecimientoListDTO[];
  cargando: boolean;
  error: string | null;
}

@Component({
  selector: 'app-filtro-busqueda', standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filtro-busqueda.component.html',
  styleUrls: ['./filtro-busqueda.component.css'],
})
export class FiltroBusquedaComponent implements OnDestroy {
  @Input() width = '100%';
  @Input() height = 'auto';
  @Input() inputId = 'busqueda-header';
  @Input() mostrarSugerencias = true;
  @Output() establecimientoSeleccionado = new EventEmitter<EstablecimientoListDTO>();
  @Output() estadoCambio = new EventEmitter<EstadoBusqueda>();
  @HostBinding('style.width') get hostWidth() { return this.width; }
  @HostBinding('style.height') get hostHeight() { return this.height; }

  searchText = '';
  resultados: EstablecimientoListDTO[] = [];
  mostrarResultados = false;
  cargando = false;
  error: string | null = null;
  indiceActivo = -1;
  private readonly filtro$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly service = inject(EstablecimientosPublicService);
  private readonly element = inject(ElementRef<HTMLElement>);

  constructor() {
    this.filtro$.pipe(
      switchMap((termino) => {
        if (!termino) return of<EstadoBusqueda>({ termino, resultados: [], cargando: false, error: null });
        return timer(300).pipe(
          switchMap(() => this.service.obtenerEstablecimientosPublicos(1, 50, termino)),
          map((res): EstadoBusqueda => {
            if (res && res.codigoEstatus !== 1) throw new Error(res.mensaje);
            return { termino, resultados: res?.cuerpoDeRespuesta ?? [], cargando: false, error: null };
          }),
          catchError(() => of<EstadoBusqueda>({ termino, resultados: [], cargando: false, error: 'No pudimos buscar los lugares. Intenta de nuevo.' }))
        );
      }), takeUntil(this.destroy$)
    ).subscribe((estado) => {
      this.resultados = estado.resultados;
      this.cargando = estado.cargando;
      this.error = estado.error;
      this.estadoCambio.emit(estado);
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  onSearchChange(value: string) {
    this.searchText = value;
    this.indiceActivo = -1;
    this.resultados = [];
    this.error = null;
    const termino = value.trim();
    this.cargando = !!termino;
    this.mostrarResultados = !!termino && this.mostrarSugerencias;
    this.estadoCambio.emit({ termino, resultados: [], cargando: this.cargando, error: null });
    this.filtro$.next(termino);
  }

  onInputFocus() { this.mostrarResultados = !!this.searchText.trim() && this.mostrarSugerencias; }

  seleccionar(est: EstablecimientoListDTO) {
    this.mostrarResultados = false;
    this.establecimientoSeleccionado.emit(est);
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') { this.mostrarResultados = false; return; }
    if (!this.mostrarSugerencias || !this.resultados.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.mostrarResultados = true;
      const salto = event.key === 'ArrowDown' ? 1 : -1;
      this.indiceActivo = (this.indiceActivo + salto + this.resultados.length) % this.resultados.length;
    } else if (event.key === 'Enter' && this.mostrarResultados && this.indiceActivo >= 0) {
      event.preventDefault();
      this.seleccionar(this.resultados[this.indiceActivo]);
    }
  }

  @HostListener('document:click', ['$event'])
  onOutside(event: Event) {
    if (!this.element.nativeElement.contains(event.target as Node)) this.mostrarResultados = false;
  }

  @HostListener('focusout', ['$event'])
  onFocusOut(event: FocusEvent) {
    if (!this.element.nativeElement.contains(event.relatedTarget as Node)) this.mostrarResultados = false;
  }
}
