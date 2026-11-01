import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { EstablecimientosService } from './establecimientos.service';
import { EstablecimientoCreateDTO } from '../models/establecimiento.model';

describe('Imágenes de establecimientos', () => {
  it('envía las cinco fotos y las dos imágenes de menú con los nombres multipart del backend', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(EstablecimientosService), http = TestBed.inject(HttpTestingController);
    const file = new File(['imagen'], 'foto.png', { type: 'image/png' });
    service.createEstablecimiento({} as EstablecimientoCreateDTO, file, file, file, file, file, file, file).subscribe();
    const request = http.expectOne('/api/establecimientos/create');
    expect(request.request.body.getAll('perfil').length).toBe(5); expect(request.request.body.getAll('menu').length).toBe(2);
    request.flush({ codigoEstatus: 1 }); http.verify();
  });
});
