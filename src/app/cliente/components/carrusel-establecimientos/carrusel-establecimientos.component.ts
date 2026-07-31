import {
  Component,
  Input,
  OnDestroy,
  signal,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subscription, interval } from 'rxjs';

import { EstablecimientoListDTO } from '../../../models/establecimiento.model';

@Component({
  selector: 'app-carrusel-establecimientos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carrusel-establecimientos.component.html',
  styleUrls: ['./carrusel-establecimientos.component.css'],
})
export class CarruselEstablecimientosComponent implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  @Input() intervaloMs = 5000;

  readonly establecimientos = signal<EstablecimientoListDTO[]>([]);
  readonly currentIndex = signal(0);

  private carouselSubscription?: Subscription;

  @Input() set data(value: EstablecimientoListDTO[]) {
    this.establecimientos.set(value ?? []);
    if (value?.length > 0) {
      this.startCarousel();
    }
  }

  startCarousel(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.carouselSubscription?.unsubscribe();
    this.carouselSubscription = this.intervaloMs > 0
      ? interval(this.intervaloMs).subscribe(() => this.nextSlide())
      : undefined;
  }

  nextSlide(): void {
    const total = this.establecimientos().length;
    if (total === 0) return;
    this.currentIndex.update(i => (i + 1) % total);
  }

  prevSlide(): void {
    const total = this.establecimientos().length;
    if (total === 0) return;
    this.currentIndex.update(i => (i - 1 + total) % total);
  }

  showSlide(index: number): void {
    this.currentIndex.set(index);
    this.startCarousel();
  }

  ngOnDestroy(): void {
    this.carouselSubscription?.unsubscribe();
  }
}