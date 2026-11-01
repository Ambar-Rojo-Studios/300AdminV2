import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BotaneroService } from '../../../services/botanero.service';
import { BotaneroEstablecimientoDTO } from '../../../models/botanero.model';
import { pendientesFicha } from '../../../utils/estado-ficha';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-mis-establecimientos', standalone: true, imports: [RouterLink, LoadingSpinnerComponent],
  templateUrl: './mis-establecimientos.component.html', styleUrl: './mis-establecimientos.component.css',
})
export class MisEstablecimientosComponent implements OnInit {
  private readonly service = inject(BotaneroService);
  private readonly destroyRef = inject(DestroyRef);
  readonly establecimientos = signal<BotaneroEstablecimientoDTO[]>([]);
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly fichas = computed(() => this.establecimientos().map(lugar => ({ lugar, pendientes: pendientesFicha(lugar) })));
  readonly conMenu = computed(() => this.establecimientos().filter(lugar => lugar.imagenesMenu?.length).length);
  readonly conPromociones = computed(() => this.establecimientos().filter(lugar => [lugar.fldPromoLunes, lugar.fldPromoMartes, lugar.fldPromoMiercoles, lugar.fldPromoJueves, lugar.fldPromoViernes, lugar.fldPromoSabado, lugar.fldPromoDomingo, lugar.fldPromo300Lugares].some(promo => promo?.trim())).length);
  readonly incompletas = computed(() => this.fichas().filter(ficha => ficha.pendientes.length).length);

  ngOnInit() { this.cargar(); }
  cargar() {
    if (this.cargando()) return;
    this.cargando.set(true); this.error.set('');
    this.service.listarMisEstablecimientos().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        if (res && res.codigoEstatus !== 1) this.error.set('No pudimos cargar tus establecimientos.');
        else this.establecimientos.set(res?.cuerpoDeRespuesta ?? []);
        this.cargando.set(false);
      },
      error: () => { this.error.set('No pudimos cargar tus establecimientos. Intenta de nuevo.'); this.cargando.set(false); }
    });
  }
}
