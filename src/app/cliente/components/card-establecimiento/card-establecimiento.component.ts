import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { EstablecimientoListDTO } from '../../../models/establecimiento.model';

@Component({
  selector: 'app-card-establecimiento',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './card-establecimiento.component.html',
  styleUrls: ['./card-establecimiento.component.css'],
})
export class CardEstablecimientoComponent {
  @Input() establecimientos: EstablecimientoListDTO[] = [];

  trackById(_: number, item: EstablecimientoListDTO): number {
    return item.idEstablecimiento;
  }
}