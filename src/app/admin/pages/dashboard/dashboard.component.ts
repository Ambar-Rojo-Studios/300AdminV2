import { Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { EstablecimientosService } from '../../../services/establecimientos.service';
import { EmpresasService } from '../../../services/empresa.service';
import { MarcasService } from '../../../services/marca.service';
import { PromocionesService } from '../../../services/promocion.service';
import { EtiquetasService } from '../../../services/etiquetas.service';
import { ToastService } from '../../../shared/services/toast.service';

/** Estado de una tarjeta KPI del dashboard. */
interface DashboardKpi {
  key: string;
  label: string;
  icon: string;
  value: number | null;
  loading: boolean;
  error: boolean;
}

/** Respuesta genérica paginada que ya usan todos los servicios del admin. */
interface ApiResponseConLista<T> {
  codigoEstatus: number;
  mensaje: string;
  cuerpoDeRespuesta: T[] | null;
}

const PAGE_SIZE_TOTAL = 10000;

/**
 * Dashboard admin (Etapa 4). Tarjetas KPI con conteos reales, cada una
 * cargada de forma independiente: si una falla, no tumba a las demás.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private establecimientosService = inject(EstablecimientosService);
  private empresasService = inject(EmpresasService);
  private marcasService = inject(MarcasService);
  private promocionesService = inject(PromocionesService);
  private etiquetasService = inject(EtiquetasService);
  private toastService = inject(ToastService);

  private readonly kpiDefs: { key: string; label: string; icon: string; loader: () => Promise<number> }[] = [
    { key: 'establecimientos', label: 'Establecimientos', icon: 'fa-store', loader: () => this.contarEstablecimientos() },
    { key: 'empresas', label: 'Empresas', icon: 'fa-building', loader: () => this.contarEmpresas() },
    { key: 'marcas', label: 'Marcas', icon: 'fa-tags', loader: () => this.contarMarcas() },
    { key: 'promociones', label: 'Promociones activas', icon: 'fa-bullhorn', loader: () => this.contarPromocionesActivas() },
    { key: 'etiquetas', label: 'Etiquetas', icon: 'fa-tag', loader: () => this.contarEtiquetas() },
  ];

  kpis = signal<DashboardKpi[]>(
    this.kpiDefs.map((def) => ({ key: def.key, label: def.label, icon: def.icon, value: null, loading: true, error: false }))
  );

  ngOnInit(): void {
    this.kpiDefs.forEach((def) => this.cargarKpi(def));
  }

  private cargarKpi(def: { key: string; label: string; loader: () => Promise<number> }): void {
    def.loader()
      .then((total) => this.actualizarKpi(def.key, { value: total, loading: false, error: false }))
      .catch((err: unknown) => {
        this.actualizarKpi(def.key, { value: null, loading: false, error: true });
        const mensaje = err instanceof Error ? err.message : 'Error de conexión';
        this.toastService.showError(`No se pudo cargar "${def.label}": ${mensaje}`);
      });
  }

  private actualizarKpi(key: string, patch: Partial<DashboardKpi>): void {
    this.kpis.update((lista) => lista.map((kpi) => (kpi.key === key ? { ...kpi, ...patch } : kpi)));
  }

  private extraerTotal<T>(res: ApiResponseConLista<T> | null | undefined): number {
    if (res?.codigoEstatus === 1 && Array.isArray(res.cuerpoDeRespuesta)) {
      return res.cuerpoDeRespuesta.length;
    }
    throw new Error(res?.mensaje || 'Respuesta inesperada del servidor.');
  }

  private async contarEstablecimientos(): Promise<number> {
    const res = await firstValueFrom(this.establecimientosService.obtenerEstablecimientos(1, PAGE_SIZE_TOTAL));
    return this.extraerTotal(res);
  }

  private async contarEmpresas(): Promise<number> {
    const res = await firstValueFrom(this.empresasService.obtenerEmpresas(1, PAGE_SIZE_TOTAL));
    return this.extraerTotal(res);
  }

  private async contarMarcas(): Promise<number> {
    const res = await firstValueFrom(this.marcasService.obtenerMarcas(1, PAGE_SIZE_TOTAL));
    return this.extraerTotal(res);
  }

  private async contarEtiquetas(): Promise<number> {
    const res = await firstValueFrom(this.etiquetasService.listarEtiquetas(1, PAGE_SIZE_TOTAL));
    return this.extraerTotal(res);
  }

  /** Una promoción se considera activa si hoy cae dentro de su rango de fechas. */
  private async contarPromocionesActivas(): Promise<number> {
    const res = await firstValueFrom(this.promocionesService.obtenerPromociones(1, PAGE_SIZE_TOTAL));
    if (res?.codigoEstatus !== 1 || !Array.isArray(res.cuerpoDeRespuesta)) {
      throw new Error(res?.mensaje || 'Respuesta inesperada del servidor.');
    }

    const hoy = new Date().toISOString().substring(0, 10);
    return res.cuerpoDeRespuesta.filter((promo) => {
      const inicio = (promo.fldFechaInicio || '').substring(0, 10);
      const fin = (promo.fldFechaFin || '').substring(0, 10);
      return inicio <= hoy && hoy <= fin;
    }).length;
  }
}
