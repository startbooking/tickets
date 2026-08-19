/**
 * Utilidades de fecha/hora para el negocio.
 *
 * Colombia usa UTC-5. Aunque la hora del dispositivo del operador (o del
 * servidor que sirve el frontend, p.ej. Hostinger/Holanda) sea otro huso,
 * TODAS las fechas/horas que el sistema muestra o envía al backend deben
 * calcularse con la zona de Colombia para no descuadrar "hoy" ni la hora
 * de la venta frente a `fecha_venta`/`datetime.now()` del backend local.
 */
export const ZONA_COLOMBIA = 'America/Bogota';

const COLOMBIA_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_COLOMBIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const COLOMBIA_TIME = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZONA_COLOMBIA,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

const COLOMBIA_FULL = new Intl.DateTimeFormat('es-CO', {
  timeZone: ZONA_COLOMBIA,
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function parte(formato: Intl.DateTimeFormat, type: string, date: Date): string {
  return formato.formatToParts(date).find((p) => p.type === type)?.value ?? '';
}

/** Fecha de hoy (YYYY-MM-DD) en la zona de Colombia, no del dispositivo. */
export function fechaHoyColombia(date: Date = new Date()): string {
  return COLOMBIA_DATE.format(date);
}

/** Hora actual (HH:MM:SS) en la zona de Colombia. */
export function horaColombia(date: Date = new Date()): string {
  const h = parte(COLOMBIA_TIME, 'hour', date);
  const m = parte(COLOMBIA_TIME, 'minute', date);
  const s = parte(COLOMBIA_TIME, 'second', date);
  return `${h}:${m}:${s}`;
}

/** Hora actual (HH:MM) en la zona de Colombia. */
export function horaColombiaCorta(date: Date = new Date()): string {
  return horaColombia(date).slice(0, 5);
}

/** Fecha y hora completa en español, en la zona de Colombia. */
export function fechaHoraColombia(date: Date = new Date()): string {
  return COLOMBIA_FULL.format(date);
}