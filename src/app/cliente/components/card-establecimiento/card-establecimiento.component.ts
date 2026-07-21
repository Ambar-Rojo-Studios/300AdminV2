import { Component, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { EstablecimientoListDTO } from '../../../models/establecimiento.model';

@Component({
  selector: 'app-card-establecimiento',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-establecimiento.component.html',
  styleUrls: ['./card-establecimiento.component.css'],
})
export class CardEstablecimientoComponent {
  @Input() establecimientos: EstablecimientoListDTO[] = [];
  @Output() cardClick = new EventEmitter<EstablecimientoListDTO>();

  constructor(private router: Router) {}

  irADetalle(est: EstablecimientoListDTO): void {
    this.cardClick.emit(est);
    this.router.navigate(['/detalleEstablecimiento', est.idEstablecimiento]);
  }

  trackById(_: number, item: EstablecimientoListDTO): number {
    return item.idEstablecimiento;
  }
}