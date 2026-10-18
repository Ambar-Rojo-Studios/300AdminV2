import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';

import { EstablecimientosService } from '../../../services/establecimientos.service';
import { EmpresasService } from '../../../services/empresa.service';
import { MarcasService } from '../../../services/marca.service';
import { PromocionesService } from '../../../services/promocion.service';
import { EtiquetasService } from '../../../services/etiquetas.service';
import { ClientesService } from '../../../services/cliente.service';
import { UsuarioService } from '../../../services/usuario.service';
import { CulturalService } from '../../../services/capsula-cultural.service';
import { TiposEstablecimientoService } from '../../../services/tipo-establecimiento.service';
import { ToastService } from '../../../shared/services/toast.service';
import { EstablecimientoListDTO } from '../../../models/establecimiento.model';
import { listarPromocionesDTO } from '../../../models/promocion.model';
import { ListTipoEstablecimientoDTO } from '../../../models/tipo_establecimiento.model';

/** Forma común de las respuestas de todos los servicios del admin. */
interface ApiResponseConLista<T> {
  codigoEstatus: number;
  mensaje: string;
  cuerpoDeRespuesta: T[] | null;
}

/** Estado de carga de una lista; cada fuente falla o carga sin afectar a las demás. */
interface Fuente<T> {
  loading: boolean;
  error: boolean;
  data: T[];
}

interface DashboardKpi {
  label: string;
  icon: string;
  link: string;
  fuente: Fuente<unknown>;
  value: number;
}

interface BarraDesglose {
  label: string;
  total: number;
  porcentaje: number;
}

// ponytail: no hay endpoint de conteos en el backend, se piden las listas completas y se cuentan aquí.
// Techo: con miles de registros por catálogo esto pesa; ahí toca un endpoint /dashboard/resumen.
const PAGE_SIZE_TOTAL = 10000;
const TOP_DESGLOSE = 6;

const fuenteInicial = <T>(): Fuente<T> => ({ loading: true, error: false, data: [] });

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private establecimientosService = inject(EstablecimientosService);
  private empresasService = inject(EmpresasService);
  private marcasService = inject(MarcasService);
  private promocionesService = inject(PromocionesService);
  private etiquetasService = inject(EtiquetasService);
  private clienteService = inject(ClientesService);
  private usuarioService = inject(UsuarioService);
  private capsulaService = inject(CulturalService);
  private tipoService = inject(TiposEstablecimientoService);
  private toastService = inject(ToastService);

  readonly hoy = signal(new Date());
  readonly fechaHoy = computed(() => new Intl.DateTimeFormat('es-MX', { dateStyle: 'full' }).format(this.hoy()));
  readonly cargando = signal(false);

  private establecimientos = signal(fuenteInicial<EstablecimientoListDTO>());
  private empresas = signal(fuenteInicial<unknown>());
  private marcas = signal(fuenteInicial<unknown>());
  readonly promociones = signal(fuenteInicial<listarPromocionesDTO>());
  private etiquetas = signal(fuenteInicial<unknown>());
  private clientes = signal(fuenteInicial<unknown>());
  private usuarios = signal(fuenteInicial<unknown>());
  private capsulas = signal(fuenteInicial<unknown>());
  private tipos = signal(fuenteInicial<ListTipoEstablecimientoDTO>());

  readonly promocionesActivas = computed(() => {
    const hoy = this.fechaLocal(this.hoy());
    return this.promociones().data.filter((promo) => this.estaActiva(promo, hoy)).length;
  });

  readonly promocionesPorVencer = computed(() => {
    const hoy = this.fechaLocal(this.hoy());
    const limite = new Date(this.hoy());
    limite.setDate(limite.getDate() + 7);
    const fechaLimite = this.fechaLocal(limite);
    return this.promociones().data.filter((promo) =>
      this.estaActiva(promo, hoy) && promo.fldFechaFin.substring(0, 10) <= fechaLimite
    ).length;
  });

  readonly kpis = computed<DashboardKpi[]>(() => {
    const est = this.establecimientos();
    const promos = this.promociones();
    const lista = (label: string, icon: string, link: string, fuente: Fuente<unknown>): DashboardKpi =>
      ({ label, icon, link, fuente, value: fuente.data.length });

    return [
      lista('Establecimientos', 'fa-store', '/admin/establecimientos', est),
      lista('Empresas', 'fa-building', '/admin/empresas', this.empresas()),
      lista('Marcas', 'fa-copyright', '/admin/marca', this.marcas()),
      { label: 'Promociones activas', icon: 'fa-bullhorn', link: '/admin/promociones', fuente: promos, value: this.promocionesActivas() },
      lista('Etiquetas', 'fa-tag', '/admin/etiquetas', this.etiquetas()),
      lista('Clientes', 'fa-users', '/admin/clientes', this.clientes()),
      lista('Usuarios', 'fa-user-shield', '/admin/usuarios', this.usuarios()),
      lista('Cápsulas culturales', 'fa-book-open', '/admin/capsulas', this.capsulas())
    ];
  });

  readonly porCiudad = computed<BarraDesglose[]>(() =>
    this.agrupar(this.establecimientos().data.map((e) => (e.fldCiudad || '').trim() || 'Sin ciudad'))
  );

  readonly porTipo = computed<BarraDesglose[]>(() => {
    const nombres = new Map(this.tipos().data.map((t) => [t.idTipoEstablecimiento, t.fldNombre]));
    return this.agrupar(
      this.establecimientos().data.map((e) => e.fkIdTipoEstablecimiento == null
        ? 'Sin tipo'
        : nombres.get(e.fkIdTipoEstablecimiento) || 'Tipo no disponible')
    );
  });

  readonly desgloseCargando = computed(() => this.establecimientos().loading);
  readonly desgloseError = computed(() => this.establecimientos().error);
  readonly tiposCargando = computed(() => this.desgloseCargando() || this.tipos().loading);
  readonly tiposError = computed(() => this.desgloseError() || this.tipos().error);

  ngOnInit(): void {
    this.cargarTodo();
  }

  cargarTodo(): void {
    if (this.cargando()) return;
    this.hoy.set(new Date());
    this.cargando.set(true);
    const cargas = [
      this.cargar('Establecimientos', this.establecimientosService.obtenerEstablecimientos(1, PAGE_SIZE_TOTAL), this.establecimientos),
      this.cargar('Empresas', this.empresasService.obtenerEmpresas(1, PAGE_SIZE_TOTAL), this.empresas),
      this.cargar('Marcas', this.marcasService.obtenerMarcas(1, PAGE_SIZE_TOTAL), this.marcas),
      this.cargar('Promociones', this.promocionesService.obtenerPromociones(1, PAGE_SIZE_TOTAL), this.promociones),
      this.cargar('Etiquetas', this.etiquetasService.listarEtiquetas(1, PAGE_SIZE_TOTAL), this.etiquetas),
      this.cargar('Clientes', this.clienteService.listarClientes(1, PAGE_SIZE_TOTAL), this.clientes),
      this.cargar('Usuarios', this.usuarioService.obtenerUsuarios(1, PAGE_SIZE_TOTAL), this.usuarios),
      this.cargar('Cápsulas', this.capsulaService.obtenerCulturales(), this.capsulas),
      this.cargar('Tipos', this.tipoService.obtenerTipos(1, PAGE_SIZE_TOTAL), this.tipos)
    ];
    Promise.all(cargas).then(() => this.cargando.set(false));
  }

  porcentajeAncho(barra: BarraDesglose): string {
    return `${barra.porcentaje}%`;
  }

  private fechaLocal(fecha: Date): string {
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
  }

  private estaActiva(promo: listarPromocionesDTO, hoy: string): boolean {
    const inicio = (promo.fldFechaInicio || '').substring(0, 10);
    const fin = (promo.fldFechaFin || '').substring(0, 10);
    return !!inicio && !!fin && inicio <= hoy && hoy <= fin;
  }

  private async cargar<T>(
    nombre: string,
    peticion: Observable<ApiResponseConLista<T>>,
    destino: { set: (f: Fuente<T>) => void }
  ): Promise<void> {
    destino.set(fuenteInicial<T>());
    try {
      const res = await firstValueFrom(peticion);
      if (res?.codigoEstatus !== 1 || !Array.isArray(res.cuerpoDeRespuesta)) {
        throw new Error(res?.mensaje || 'Respuesta inesperada del servidor.');
      }
      destino.set({ loading: false, error: false, data: res.cuerpoDeRespuesta });
    } catch (err: unknown) {
      destino.set({ loading: false, error: true, data: [] });
      const mensaje = err instanceof Error ? err.message : 'Error de conexión';
      this.toastService.showError(`No se pudo cargar "${nombre}": ${mensaje}`);
    }
  }

  private agrupar(etiquetas: string[]): BarraDesglose[] {
    const conteo = new Map<string, number>();
    etiquetas.forEach((etiqueta) => conteo.set(etiqueta, (conteo.get(etiqueta) ?? 0) + 1));

    const ordenado = [...conteo.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP_DESGLOSE);
    const maximo = ordenado[0]?.[1] ?? 1;
    return ordenado.map(([label, total]) => ({ label, total, porcentaje: Math.round((total / maximo) * 100) }));
  }
}
