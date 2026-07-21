import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  inject,
  input,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { ComentarioService } from '../../../services/comentario.service';
import { ComentariosPublicos } from '../../../services/comentario-publico.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ClienteEstrellaComponent } from '../cliente-estrella/cliente-estrella.component';

import {
  listarComentario,
  CrearComentarioDTO,
  EditarComentarioDTO,
} from '../../../models/comentario.model';

@Component({
  selector: 'app-comentarios-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, ClienteEstrellaComponent],
  templateUrl: './comentarios-cliente.component.html',
  styleUrls: ['./comentarios-cliente.component.css'],
})
export class ComentariosClienteComponent implements OnInit {
  private readonly comentarioService = inject(ComentarioService);
  private readonly comentariosPublicosService = inject(ComentariosPublicos);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  public readonly establecimientoId = input<number | null>(null);
  @Output() comentariosActualizados = new EventEmitter<void>();

  readonly comentarios = signal<listarComentario[]>([]);
  readonly cargando = signal(false);
  readonly idClienteAutenticado = signal<number | null>(null);
  readonly showModal = signal(false);
  readonly comentarioSeleccionado = signal<listarComentario | null>(null);
  readonly comentarioEnEdicion = signal<EditarComentarioDTO | null>(null);
  readonly nuevoTexto = signal('');
  readonly edicionTexto = signal('');

  constructor() {
    effect(() => {
      const id = this.establecimientoId();
      if (id && id > 0) this.cargarComentariosPublicos();
    });
  }

  ngOnInit(): void {
    this.idClienteAutenticado.set(this.authService.getId());
  }

  async cargarComentariosPublicos(): Promise<void> {
    const id = this.establecimientoId();
    if (!id || id <= 0) return;
    this.cargando.set(true);
    try {
      const res: any = await firstValueFrom(
        this.comentariosPublicosService.obtenerComentariosPublicos(id)
      );
      this.comentarios.set(res?.cuerpoDeRespuesta ?? []);
    } catch (err) {
      this.toastService.showError('No se pudieron cargar los comentarios.');
    } finally {
      this.cargando.set(false);
    }
  }

  esAutor(comentario: listarComentario): boolean {
    return this.idClienteAutenticado() === comentario.idCliente;
  }

  async crearComentario(form: NgForm): Promise<void> {
    const id = this.establecimientoId();
    const idCliente = this.idClienteAutenticado();
    const texto = this.nuevoTexto().trim();

    if (!texto || !idCliente || idCliente <= 0 || !id) {
      this.toastService.showError('Debes iniciar sesión como cliente y escribir un comentario.');
      return;
    }

    const payload: CrearComentarioDTO = {
      idComentario: null,
      fldComentario: texto,
      idEstablecimiento: id,
      idCliente,
      fldFechaComentario: new Date().toISOString().slice(0, 10),
    };

    try {
      const res: any = await firstValueFrom(this.comentarioService.crearComentario(payload));
      this.toastService.show(res?.mensaje || 'Comentario creado.');
      this.nuevoTexto.set('');
      form.resetForm({ texto: '' });
      await this.cargarComentariosPublicos();
      this.comentariosActualizados.emit();
    } catch (err: any) {
      this.toastService.showError(err?.message || 'Error al crear comentario.');
    }
  }

  iniciarEdicion(comentario: listarComentario): void {
    if (!this.esAutor(comentario)) return;
    this.comentarioEnEdicion.set({
      idComentario: comentario.idComentario,
      idEstablecimiento: this.establecimientoId() ?? -1,
      idCliente: comentario.idCliente,
      fldComentario: comentario.fldComentario,
      fldFechaComentario: new Date().toISOString().slice(0, 10),
    });
    this.edicionTexto.set(comentario.fldComentario);
  }

  async guardarEdicion(): Promise<void> {
    const data = this.comentarioEnEdicion();
    if (!data) return;
    const texto = this.edicionTexto().trim();
    if (!texto) return;
    const payload: EditarComentarioDTO = {
      ...data,
      fldComentario: texto,
    };
    try {
      const res: any = await firstValueFrom(this.comentarioService.editarComentario(payload));
      this.comentarios.update((lista) =>
        lista.map((c) =>
          c.idComentario === data.idComentario
            ? { ...c, fldComentario: texto }
            : c
        )
      );
      this.toastService.show(res?.mensaje || 'Edición guardada.');
      this.cancelarEdicion();
      this.comentariosActualizados.emit();
    } catch (err) {
      this.toastService.showError('Error al editar.');
    }
  }

  cancelarEdicion(): void {
    this.comentarioEnEdicion.set(null);
  }

  prepararEliminacion(comentario: listarComentario): void {
    if (!this.esAutor(comentario)) return;
    this.comentarioSeleccionado.set(comentario);
    this.showModal.set(true);
  }

  async confirmarEliminacion(): Promise<void> {
    const id = this.comentarioSeleccionado()?.idComentario;
    if (!id) return;
    try {
      await firstValueFrom(this.comentarioService.eliminarComentario(id));
      this.comentarios.update((p) => p.filter((c) => c.idComentario !== id));
      this.toastService.show('Comentario eliminado.');
      this.comentariosActualizados.emit();
    } catch (err) {
      this.toastService.showError('Error al eliminar.');
    } finally {
      this.cerrarModal();
    }
  }

  cerrarModal(): void {
    this.showModal.set(false);
    this.comentarioSeleccionado.set(null);
  }

  onNuevoTexto(value: string): void {
    this.nuevoTexto.set(value);
  }
}