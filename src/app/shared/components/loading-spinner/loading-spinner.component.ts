import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.css']
})

/**
 * Componente reutilizable para indicar visualmente un proceso en curso.
 * Se utiliza en vistas que dependen de datos o peticiones asíncronas.
 */
export class LoadingSpinnerComponent {
  /** Tamaño del spinner en píxeles. */
  @Input() size: number = 40;
  /** Texto mostrado mientras se espera la respuesta. */
  @Input() message: string = 'Cargando...';
  /** Activa un fondo de carga sobre el contenido actual. */
  @Input() overlay: boolean = false;
}