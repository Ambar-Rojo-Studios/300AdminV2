import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SelectFieldComponent, SelectOption } from '../form-fields/select-field.component';
import {
  EtiquetaAsociada,
  EtiquetaDisponible,
  EtiquetasAdapter,
} from '../../models/etiqueta-asociada.model';

/**
 * Componente ÚNICO y parametrizado para gestionar etiquetas de una entidad
 * (agregar, listar agrupadas por categoría, eliminar).
 *
 * Antes existían dos juegos casi idénticos (etiquetas-cliente/ y
 * etiquetas-establecimiento/, cada uno con 3 sub-componentes: agregar,
 * listado y eliminar). Este componente reemplaza a los 6 con un solo
 * componente que recibe un `EtiquetasAdapter` (ver
 * shared/models/etiqueta-asociada.model.ts) que sabe cómo hablar con el
 * backend correspondiente.
 *
 * Uso para un cliente:
 * ```html
 * <app-etiquetas-selector
 *   [entidadId]="clienteId"
 *   [adapter]="clienteEtiquetasAdapter"
 * ></app-etiquetas-selector>
 * ```
 *
 * Uso para un establecimiento (mismo componente, otro adapter):
 * ```html
 * <app-etiquetas-selector
 *   [entidadId]="establecimientoId"
 *   [adapter]="establecimientoEtiquetasAdapter"
 * ></app-etiquetas-selector>
 * ```
 *
 * Los adapters (`ClienteEtiquetasAdapter`, `EstablecimientoEtiquetasAdapter`)
 * son `providedIn: 'root'`, así que se pueden inyectar directamente en el
 * componente padre con `inject(...)` y pasarlos como input.
 */
@Component({
  selector: 'app-etiquetas-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectFieldComponent],
  templateUrl: './etiquetas-selector.component.html',
})
export class EtiquetasSelectorComponent {
  /** Id de la entidad dueña de las etiquetas (idCliente, idEstablecimiento, ...). */
  entidadId = input.required<number | null>();

  /** Fuente de datos: qué backend consultar/mutar. */
  adapter = input.required<EtiquetasAdapter>();

  /** Etiquetado de solo lectura (oculta selector de agregar y botones de eliminar). */
  readonly = input(false);

  etiquetasAsociadas = signal<EtiquetaAsociada[]>([]);
  etiquetasDisponibles = signal<EtiquetaDisponible[]>([]);
  etiquetaSeleccionada = signal<number | null>(null);

  cargando = signal(false);
  guardando = signal(false);
  eliminandoId = signal<number | null>(null);

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  tieneEntidad = computed(() => !!this.entidadId());

  /** Ids ya asociados, para no ofrecerlos de nuevo en el selector de agregar. */
  private idsAsociados = computed(() => new Set(this.etiquetasAsociadas().map((e) => e.idEtiqueta)));

  opcionesDisponibles = computed<SelectOption[]>(() =>
    this.etiquetasDisponibles()
      .filter((e) => !this.idsAsociados().has(e.idEtiqueta))
      .map((e) => ({ value: e.idEtiqueta, label: `${e.fldNombre} (${e.fldCategoria})` }))
  );

  puedeGuardar = computed(
    () => this.tieneEntidad() && !!this.etiquetaSeleccionada() && !this.guardando()
  );

  /** Agrupa las etiquetas asociadas por categoría, para mostrarlas en secciones. */
  etiquetasPorCategoria = computed<Record<string, EtiquetaAsociada[]>>(() => {
    const grouped: Record<string, EtiquetaAsociada[]> = {};
    for (const etiqueta of this.etiquetasAsociadas()) {
      const categoria = etiqueta.fldCategoria || 'Sin categoría';
      (grouped[categoria] ??= []).push(etiqueta);
    }
    return grouped;
  });

  categorias = computed(() => Object.keys(this.etiquetasPorCategoria()));

  constructor() {
    effect(() => {
      const id = this.entidadId();
      // adapter() se lee también para reaccionar si el padre lo cambia en caliente
      this.adapter();
      if (id) {
        this.etiquetaSeleccionada.set(null);
        this.cargarTodo();
      } else {
        this.etiquetasAsociadas.set([]);
      }
    });
  }

  private async cargarTodo(): Promise<void> {
    const id = this.entidadId();
    if (!id) return;

    this.cargando.set(true);
    this.errorMessage.set(null);

    try {
      const [asociadas, disponibles] = await Promise.all([
        firstValueFrom(this.adapter().obtenerAsociadas(id)),
        firstValueFrom(this.adapter().obtenerDisponibles()),
      ]);
      this.etiquetasAsociadas.set(asociadas);
      this.etiquetasDisponibles.set(disponibles);
    } catch (error) {
      console.error('Error al cargar etiquetas:', error);
      this.errorMessage.set('No se pudieron cargar las etiquetas.');
    } finally {
      this.cargando.set(false);
    }
  }

  async agregarEtiqueta(): Promise<void> {
    const id = this.entidadId();
    const idEtiqueta = this.etiquetaSeleccionada();
    if (!id || !idEtiqueta || !this.puedeGuardar()) return;

    this.guardando.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await firstValueFrom(this.adapter().crear(id, idEtiqueta));
      this.etiquetaSeleccionada.set(null);
      this.successMessage.set('Etiqueta agregada correctamente.');
      await this.cargarTodo();
      this.autoDismiss();
    } catch (error: any) {
      if (error?.status === 409) {
        this.errorMessage.set('Esa etiqueta ya está asignada.');
      } else {
        this.errorMessage.set('Error al agregar la etiqueta.');
      }
      console.error('Error al agregar etiqueta:', error);
    } finally {
      this.guardando.set(false);
    }
  }

  async eliminarEtiqueta(etiqueta: EtiquetaAsociada): Promise<void> {
    this.eliminandoId.set(etiqueta.id);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await firstValueFrom(this.adapter().eliminar(etiqueta.id));
      this.successMessage.set('Etiqueta eliminada correctamente.');
      await this.cargarTodo();
      this.autoDismiss();
    } catch (error) {
      console.error('Error al eliminar etiqueta:', error);
      this.errorMessage.set('Error al eliminar la etiqueta.');
    } finally {
      this.eliminandoId.set(null);
    }
  }

  private autoDismiss(): void {
    setTimeout(() => this.successMessage.set(null), 3000);
  }
}
