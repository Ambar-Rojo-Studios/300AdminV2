import { Component, Input, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import { TagsEtiquetasXEstablecimientoService } from '../../../services/etiqueta-establecimiento.service';
import { TagsEtiquetasXEstablecimiento } from '../../../models/tags-etiquetasXEstablecimiento.model';

@Component({
  selector: 'app-etiquetas-listado-public',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './etiquetas-listado-public.component.html',
  styleUrls: ['./etiquetas-listado-public.component.css'],
})
export class EtiquetasListadoPublicComponent implements OnInit {
  private readonly etiquetaEstablecimientoService = inject(TagsEtiquetasXEstablecimientoService);

  @Input() establecimientoId: number | null = null;

  readonly etiquetas = signal<TagsEtiquetasXEstablecimiento[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    if (!this.establecimientoId) {
      this.cargando.set(false);
      return;
    }
    try {
      const res: any = await firstValueFrom(
        this.etiquetaEstablecimientoService.obtenerEtiquetasPorEstablecimiento(
          this.establecimientoId
        )
      );
      this.etiquetas.set(res?.cuerpoDeRespuesta ?? []);
    } catch (err: any) {
      console.error('[EtiquetasListadoPublic] error:', err);
      this.error.set('No se pudieron cargar las etiquetas.');
    } finally {
      this.cargando.set(false);
    }
  }
}