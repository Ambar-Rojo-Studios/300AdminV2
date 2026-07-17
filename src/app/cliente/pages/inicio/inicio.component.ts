import { Component } from '@angular/core';

@Component({
  selector: 'app-inicio',
  standalone: true,
  template: `
    <section class="inicio-placeholder">
      <h1>300 Lugares</h1>
      <p>Web pública v2 — aquí van inicio, buscador, mapa y detalle (Etapa 2, Jhonatan).</p>
    </section>
  `,
  styles: `.inicio-placeholder { padding: 2rem; text-align: center; }`
})
export class InicioComponent {}
