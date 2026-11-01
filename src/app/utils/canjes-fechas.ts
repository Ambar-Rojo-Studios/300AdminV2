export type RangoRapidoCanjes = 'hoy' | 'semana' | 'mes';

export function fechaHoyChiapas(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(value => value.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function rangoRapidoChiapas(rango: RangoRapidoCanjes, now = new Date()): { desde: string; hasta: string } {
  const hasta = fechaHoyChiapas(now);
  if (rango === 'hoy') return { desde: hasta, hasta };
  const fecha = new Date(`${hasta}T12:00:00Z`);
  if (rango === 'mes') return { desde: `${hasta.slice(0, 7)}-01`, hasta };
  const diasDesdeLunes = (fecha.getUTCDay() + 6) % 7;
  fecha.setUTCDate(fecha.getUTCDate() - diasDesdeLunes);
  return { desde: fecha.toISOString().slice(0, 10), hasta };
}

export function formatearFechaCanje(fechaHora: string): string {
  const fecha = new Date(fechaHora);
  if (Number.isNaN(fecha.getTime())) return fechaHora;
  // fechaHora llega sin zona y ya está en hora de Chiapas: no se convierte.
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(fecha);
}

export function csvCell(value: unknown): string {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}
