import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="public-footer">
      <span class="public-footer__brand">Ambar Rojo Studios</span>
      <span class="public-footer__sep">·</span>
      <span class="public-footer__year">{{ anio() }}</span>
      <span class="public-footer__sep">·</span>
      <span class="public-footer__product">300 Lugares</span>
    </footer>
  `,
  styles: `
    .public-footer {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
      padding: 1.25rem 1rem;
      border-top: 1px solid var(--border, #e5e5e5);
      background: var(--surface, #fff);
      color: var(--text-muted, #777);
      font-size: 0.85rem;
      font-family: var(--font-display, serif);
    }
    .public-footer__brand {
      color: var(--accent, #f23219);
      font-weight: 600;
    }
    .public-footer__sep {
      opacity: 0.5;
    }
  `,
})
export class FooterComponent {
  readonly anio = () => new Date().getFullYear();
}