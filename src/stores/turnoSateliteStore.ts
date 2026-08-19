/**
 * turnoSateliteStore
 *
 * Gestión del estado de turno de la agencia satélite (PDA / móvil).
 *
 * El turno se persiste en localStorage: la agencia satélite vende tiquetes
 * sin estar conectada permanentemente al backend, por lo que el resumen del
 * turno (tiquetes vendidos + desglose) se mantiene local hasta el cierre,
 * cuando se envía al backend vía `POST /turnos/satelite/cierre`.
 *
 * Separado del componente SatéliteDashboard para poder testearlo de forma
 * aislada (sin DOM ni AuthContext).
 */

import type { TurnoSateliteVenta } from '@/services/travelsoftService';
import { fechaHoyColombia } from '@/utils/tiempo';

export const TURNO_KEY = 'sateliteTurno';

export const FORMA_PAGO_LABEL: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta',
  QR: 'QR',
};

export interface TurnoSatelite {
  operador: string;
  inicio: string;
  ventas: TurnoSateliteVenta[];
}

export interface DesgloseFormaPago {
  EFECTIVO: number;
  TARJETA: number;
  QR: number;
}

/**
 * Suma el valor de todas las ventas del turno.
 * Es el "TOTAL VENDIDO" que se muestra en el encabezado y en el cierre.
 */
export function totalTurno(ventas: TurnoSateliteVenta[]): number {
  return ventas.reduce((acc, v) => acc + (v.valor || 0), 0);
}

/**
 * Desglose del total vendido agrupado por forma de pago.
 * Siempre devuelve las tres formas, incluso si no hubo ventas en alguna.
 */
export function desglosePorFormaPago(ventas: TurnoSateliteVenta[]): DesgloseFormaPago {
  return ventas.reduce<DesgloseFormaPago>(
    (acc, v) => {
      const key = (v.forma_pago as keyof DesgloseFormaPago) || 'EFECTIVO';
      if (key in acc) {
        acc[key] += v.valor || 0;
      } else {
        // Forma de pago desconocida: se acumula como EFECTIVO de forma segura.
        acc.EFECTIVO += v.valor || 0;
      }
      return acc;
    },
    { EFECTIVO: 0, TARJETA: 0, QR: 0 }
  );
}

/** Cuenta cuántos tiquetes se vendieron en el turno. */
export function totalTiquetes(ventas: TurnoSateliteVenta[]): number {
  return ventas.length;
}

/** Carga el turno persistido en localStorage (o null si no hay uno válido). */
export function cargarTurno(): TurnoSatelite | null {
  try {
    const raw = localStorage.getItem(TURNO_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw) as TurnoSatelite;
    if (!t.operador || !t.inicio) return null;
    return {
      operador: t.operador,
      inicio: t.inicio,
      ventas: Array.isArray(t.ventas) ? t.ventas : [],
    };
  } catch {
    return null;
  }
}

/** Persiste el turno en localStorage. */
export function guardarTurno(turno: TurnoSatelite): void {
  localStorage.setItem(TURNO_KEY, JSON.stringify(turno));
}

/** Cierra el turno localmente: borra el localStorage. */
export function limpiarTurno(): void {
  localStorage.removeItem(TURNO_KEY);
}

/** Calcula la fecha ISO de hoy (YYYY-MM-DD) según la zona horaria de Colombia (UTC-5). */
export function hoyISO(): string {
  return fechaHoyColombia();
}
