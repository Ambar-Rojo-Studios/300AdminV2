import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  MapaEstablecimientoComponent,
  EstablecimientoMarker,
} from '../../../shared/components/mapa-establecimiento';
import { EtiquetasListadoPublicComponent } from '../../components/etiquetas-listado-public/etiquetas-listado-public.component';
import { ComentariosClienteComponent } from '../../components/comentarios-cliente/comentarios-cliente.component';

import { EstablecimientosPublicService } from '../../../services/establecimientos-public.service';
import { idEstablecimiento } from '../../../models/establecimiento.model';

@Component({
  selector: 'app-detalle-establecimiento',
  standalone: true,
  imports: [
    CommonModule,
    MapaEstablecimientoComponent,
    EtiquetasListadoPublicComponent,
    ComentariosClienteComponent,
  ],
  templateUrl: './detalle-establecimiento.component.html',
  styleUrls: ['./detalle-establecimiento.component.css'],
})
export class DetalleEstablecimientoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly publicService = inject(EstablecimientosPublicService);

  readonly establecimiento = signal<idEstablecimiento | null>(null);
  readonly establecimientoId = signal<number | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly diasSemana: Array<[string, keyof idEstablecimiento]> = [
    ['Lunes', 'fldLunes'],
    ['Martes', 'fldMartes'],
    ['Miércoles', 'fldMiercoles'],
    ['Jueves', 'fldJueves'],
    ['Viernes', 'fldViernes'],
    ['Sábado', 'fldSabado'],
    ['Domingo', 'fldDomingo'],
  ];

  async ngOnInit(): Promise<void> {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (Number.isNaN(id) || id <= 0) {
      this.error.set('ID de establecimiento inválido.');
      this.cargando.set(false);
      return;
    }
    this.establecimientoId.set(id);
    try {
      const res: any = await firstValueFrom(
        this.publicService.obtenerEstablecimientoPorId(id)
      );
      const est = res?.cuerpoDeRespuesta as idEstablecimiento | null;
      if (!est) {
        this.error.set('No se encontró el establecimiento.');
      } else {
        this.establecimiento.set(est);
      }
    } catch (err: any) {
      console.error('[Detalle] error:', err);
      this.error.set('Error al cargar el establecimiento.');
    } finally {
      this.cargando.set(false);
    }
  }
}