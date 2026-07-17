import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BotaneroService } from '../../../services/botanero.service';
import { BotaneroStatsDTO } from '../../../models/botanero.model';
import { idEstablecimiento } from '../../../models/establecimiento.model';
import { listarComentario } from '../../../models/comentario.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-establecimiento-detalle',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent],
  template: `
    <a routerLink="/mi-lugar" class="volver">← Mis establecimientos</a>

    @if (cargando()) {
      <app-loading-spinner />
    } @else if (error()) {
      <p class="error">{{ error() }}</p>
    } @else if (lugar(); as l) {
      <header class="detalle-header">
        <h1>{{ l.fldNombre }}</h1>
        <p>{{ l.fldDireccion }}, {{ l.fldCiudad }}</p>
      </header>

      <!-- ponytail: botones deshabilitados hasta que exista establecimiento-form (Ma. Fernanda, E2) -->
      <div class="acciones">
        <button type="button" disabled title="Disponible cuando esté el formulario compartido">Editar información</button>
        <button type="button" disabled title="Disponible cuando esté el formulario compartido">Editar promos</button>
      </div>

      <section>
        <h2>Estadísticas</h2>
        @if (stats(); as s) {
          <dl class="stats">
            <div><dt>Calificación</dt><dd>{{ s.calificacionPromedio }}</dd></div>
            <div><dt>Comentarios</dt><dd>{{ s.totalComentarios }}</dd></div>
            <div><dt>Canjes</dt><dd>{{ s.totalCanjes }}</dd></div>
          </dl>
        } @else {
          <p class="pendiente">Sin datos de estadísticas.</p>
        }
      </section>

      <section>
        <h2>Comentarios de clientes</h2>
        @if (comentarios().length === 0) {
          <p class="pendiente">Aún no hay comentarios.</p>
        } @else {
          <ul class="comentarios">
            @for (c of comentarios(); track c.idComentario) {
              <li>
                <strong>{{ c.fldNombre }}</strong> · {{ c.fldEstrellas }}★ · {{ c.fldFechaComentario }}
                <p>{{ c.fldComentario }}</p>
              </li>
            }
          </ul>
        }
      </section>
    }
  `,
  styles: `
    .volver { display: inline-block; margin-bottom: 1rem; text-decoration: none; }
    .detalle-header p { color: var(--text-muted, #666); }
    .acciones { display: flex; gap: 0.75rem; margin: 1rem 0 2rem; }
    .stats { display: flex; gap: 2rem; }
    .stats dt { font-size: 0.85rem; color: var(--text-muted, #666); }
    .stats dd { margin: 0; font-size: 1.5rem; font-weight: 700; }
    .comentarios { list-style: none; padding: 0; display: grid; gap: 1rem; }
    .comentarios li { border-bottom: 1px solid var(--border, #e5e5e5); padding-bottom: 0.75rem; }
    .error { color: var(--danger, #c0392b); }
    .pendiente { color: var(--text-muted, #666); }
  `
})
export class EstablecimientoDetalleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly botaneroService = inject(BotaneroService);

  lugar = signal<idEstablecimiento | null>(null);
  stats = signal<BotaneroStatsDTO | null>(null);
  comentarios = signal<listarComentario[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set('Establecimiento no válido.');
      this.cargando.set(false);
      return;
    }

    this.botaneroService.obtenerEstablecimiento(id).subscribe({
      next: (respuesta) => {
        this.lugar.set(respuesta.cuerpoDeRespuesta);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el establecimiento (¿pertenece a tu empresa?).');
        this.cargando.set(false);
      }
    });

    // Stats y comentarios son secundarios: si fallan, la página sigue viva
    this.botaneroService.obtenerStats(id).subscribe({
      next: (r) => this.stats.set(r.cuerpoDeRespuesta),
      error: () => {}
    });
    this.botaneroService.listarComentarios(id).subscribe({
      next: (r) => this.comentarios.set(r.cuerpoDeRespuesta ?? []),
      error: () => {}
    });
  }
}
