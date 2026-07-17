import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BotaneroService } from '../../../services/botanero.service';
import { BotaneroEstablecimientoDTO } from '../../../models/botanero.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-mis-establecimientos',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent],
  template: `
    <h1>Mis establecimientos</h1>

    @if (cargando()) {
      <app-loading-spinner />
    } @else if (error()) {
      <p class="error">{{ error() }}</p>
    } @else if (establecimientos().length === 0) {
      <p>Tu empresa aún no tiene establecimientos registrados.</p>
    } @else {
      <ul class="lista-lugares">
        @for (lugar of establecimientos(); track lugar.idEstablecimiento) {
          <li>
            <a [routerLink]="['/mi-lugar/establecimiento', lugar.idEstablecimiento]">
              <strong>{{ lugar.fldNombre }}</strong>
              <span>{{ lugar.fldDireccion }}</span>
            </a>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .lista-lugares { list-style: none; padding: 0; display: grid; gap: 0.75rem; }
    .lista-lugares a {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 1rem;
      border: 1px solid var(--border, #e5e5e5);
      border-radius: 8px;
      text-decoration: none;
      color: inherit;
    }
    .error { color: var(--danger, #c0392b); }
  `
})
export class MisEstablecimientosComponent implements OnInit {
  private readonly botaneroService = inject(BotaneroService);
  private readonly router = inject(Router);

  establecimientos = signal<BotaneroEstablecimientoDTO[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.botaneroService.listarMisEstablecimientos().subscribe({
      next: (respuesta) => {
        const lugares = respuesta.cuerpoDeRespuesta ?? [];
        // Si la empresa solo tiene un lugar, entrar directo al detalle
        if (lugares.length === 1) {
          this.router.navigate(['/mi-lugar/establecimiento', lugares[0].idEstablecimiento]);
          return;
        }
        this.establecimientos.set(lugares);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar tus establecimientos. Intenta de nuevo.');
        this.cargando.set(false);
      }
    });
  }
}
