import { EstablecimientoFormFiles } from '../shared/models/establecimiento-form.model';

/**
 * El backend sincroniza en edición: lo que NO venga en imagenesPerfil/imagenesMenu se borra
 * (BD y Supabase) y los archivos nuevos se agregan al final. Esta función calcula qué URLs
 * existentes hay que reenviar: se descarta la del slot que el usuario reemplazó con un archivo
 * nuevo, y el menú nuevo reemplaza a todos los existentes (el form tiene un solo slot de menú).
 */
export function imagenesAConservar(
  perfilExistente: string[] | null | undefined,
  menuExistente: string[] | null | undefined,
  files: EstablecimientoFormFiles
): { imagenesPerfil: string[]; imagenesMenu: string[] } {
  const slotsPerfil = [files.foto, files.foto2, files.foto3, files.foto4];
  return {
    imagenesPerfil: (perfilExistente ?? []).filter((_, i) => !slotsPerfil[i]),
    imagenesMenu: files.menu ? [] : (menuExistente ?? [])
  };
}
