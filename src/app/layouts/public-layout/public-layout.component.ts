import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../cliente/components/header/header.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <app-header></app-header>
    <main><router-outlet /></main>
  `,
  styles: `
    main { min-height: calc(100vh - 64px); }
  `,
})
export class PublicLayoutComponent {}