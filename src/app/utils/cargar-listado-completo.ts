import { Observable, firstValueFrom } from 'rxjs';

interface RespuestaLista<T> {
  codigoEstatus: number;
  mensaje: string;
  cuerpoDeRespuesta: T[] | null;
}

export async function cargarListadoCompleto<T>(consultar: (pagina: number, tamano: number) => Observable<RespuestaLista<T>>, tamano = 100): Promise<T[]> {
  const datos: T[] = [];
  let anterior = '';
  for (let pagina = 1; ; pagina++) {
    const respuesta = await firstValueFrom(consultar(pagina, tamano));
    if (respuesta && (respuesta.codigoEstatus !== 1 || !Array.isArray(respuesta.cuerpoDeRespuesta))) throw new Error(respuesta.mensaje || 'Respuesta inesperada.');
    const lote = respuesta?.cuerpoDeRespuesta ?? [];
    const firma = JSON.stringify(lote);
    if (lote.length && firma === anterior) throw new Error('El servidor devolvió una página repetida.');
    datos.push(...lote);
    if (lote.length < tamano) return datos;
    anterior = firma;
  }
}
