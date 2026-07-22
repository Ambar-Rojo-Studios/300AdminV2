import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../cliente/components/header/header.component';
import { FooterComponent } from '../../cliente/components/footer/footer.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    <main><router-outlet /></main>
    <app-footer></app-footer>
  `,
  styles: `
    main { min-height: calc(100vh - 64px - 56px); }
  `,
})
export class PublicLayoutComponent {}