interface DatosFicha {
  imagenesPerfil?: string[] | null;
  fldImgRefs?: string | null;
  imagenesMenu?: string[] | null;
  fldMenu?: string | null;
  fldCoordLatitud?: string | null;
  fldCoordLongitud?: string | null;
  fldDescripcion?: string | null;
  fldHorarioApertura?: string | null;
  fldHorarioCierre?: string | null;
}

export function pendientesFicha(ficha: DatosFicha): string[] {
  const pendientes: string[] = [];
  if (!ficha.imagenesPerfil?.length && !ficha.fldImgRefs) pendientes.push('Fotos');
  if (!ficha.imagenesMenu?.length && !ficha.fldMenu) pendientes.push('Menú');
  const lat = Number(ficha.fldCoordLatitud), lng = Number(ficha.fldCoordLongitud);
  if (!ficha.fldCoordLatitud?.trim() || !ficha.fldCoordLongitud?.trim() || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) pendientes.push('Ubicación');
  if (!ficha.fldDescripcion?.trim()) pendientes.push('Descripción');
  if (!ficha.fldHorarioApertura || !ficha.fldHorarioCierre) pendientes.push('Horario');
  return pendientes;
}
