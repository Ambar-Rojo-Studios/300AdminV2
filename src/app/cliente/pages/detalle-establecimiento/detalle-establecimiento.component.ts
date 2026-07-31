import {
  Component,
  OnInit,
  inject,
  signal,
  PLATFORM_ID,
  TransferState,
  makeStateKey,
} from '@angular/core';
import { CommonModule, isPlatformServer } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';

import {
  MapaEstablecimientoComponent,
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
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transferState = inject(TransferState);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);

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

    const cacheKey = makeStateKey<idEstablecimiento>(`detalle-${id}`);
    const cached = this.transferState.get(cacheKey, null);
    if (cached) {
      this.establecerEstablecimiento(cached);
      this.transferState.remove(cacheKey);
      return;
    }

    try {
      const res: any = await firstValueFrom(
        this.publicService.obtenerEstablecimientoPorId(id)
      );
      const est = res?.cuerpoDeRespuesta as idEstablecimiento | null;
      if (!est) {
        this.error.set('No se encontró el establecimiento.');
      } else {
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(cacheKey, est);
        }
        this.establecerEstablecimiento(est);
      }
    } catch (err: any) {
      console.error('[Detalle] error:', err);
      this.error.set('Error al cargar el establecimiento.');
    } finally {
      this.cargando.set(false);
    }
  }

  private establecerEstablecimiento(est: idEstablecimiento): void {
    this.establecimiento.set(est);
    this.cargando.set(false);
    this.titleService.setTitle(`${est.fldNombre} — 300 Lugares`);
    if (est.fldDescripcion) {
      this.metaService.updateTag({
        name: 'description',
        content: est.fldDescripcion.slice(0, 160),
      });
    }
  }
}