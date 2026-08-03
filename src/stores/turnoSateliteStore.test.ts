import { describe, it, expect, beforeEach } from 'vitest';
import {
  cargarTurno,
  guardarTurno,
  limpiarTurno,
  totalTurno,
  desglosePorFormaPago,
  totalTiquetes,
  hoyISO,
  TURNO_KEY,
} from './turnoSateliteStore';
import type { TurnoSateliteVenta } from '@/services/travelsoftService';

const venta = (parcial: Partial<TurnoSateliteVenta>): TurnoSateliteVenta => ({
  id_planilla: 0,
  consecutivo: 0,
  hora: '00:00',
  cod_ruta: 0,
  placa: '',
  origen: '',
  destino: '',
  asiento: 0,
  pasajero: '',
  valor: 0,
  forma_pago: 'EFECTIVO',
  ...parcial,
});

const ventasFixture: TurnoSateliteVenta[] = [
  venta({ id_planilla: 1, consecutivo: 10, valor: 34000, forma_pago: 'EFECTIVO' }),
  venta({ id_planilla: 2, consecutivo: 11, valor: 14000, forma_pago: 'TARJETA' }),
  venta({ id_planilla: 3, consecutivo: 12, valor: 48000, forma_pago: 'QR' }),
  venta({ id_planilla: 4, consecutivo: 13, valor: 19000, forma_pago: 'EFECTIVO' }),
];

describe('totalTurno', () => {
  it('suma el valor de todas las ventas', () => {
    expect(totalTurno(ventasFixture)).toBe(115000);
  });

  it('devuelve 0 para un arreglo vacío', () => {
    expect(totalTurno([])).toBe(0);
  });

  it('trata valor null/undefined como 0', () => {
    expect(totalTurno([venta({ valor: null as unknown as number })])).toBe(0);
  });
});

describe('desglosePorFormaPago', () => {
  it('agrupa el total por cada forma de pago', () => {
    expect(desglosePorFormaPago(ventasFixture)).toEqual({
      EFECTIVO: 53000,
      TARJETA: 14000,
      QR: 48000,
    });
  });

  it('siempre devuelve las 3 formas aunque falten ventas', () => {
    const d = desglosePorFormaPago([venta({ valor: 10000, forma_pago: 'TARJETA' })]);
    expect(d).toEqual({ EFECTIVO: 0, TARJETA: 10000, QR: 0 });
  });

  it('acumula formas desconocidas en EFECTIVO', () => {
    const d = desglosePorFormaPago([venta({ valor: 5000, forma_pago: 'SINIESTRO' as never })]);
    expect(d.EFECTIVO).toBe(5000);
  });

  it('devuelve todo en ceros para arreglo vacío', () => {
    expect(desglosePorFormaPago([])).toEqual({ EFECTIVO: 0, TARJETA: 0, QR: 0 });
  });
});

describe('totalTiquetes', () => {
  it('cuenta las ventas del turno', () => {
    expect(totalTiquetes(ventasFixture)).toBe(4);
  });
});

describe('persistencia en localStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('cargarTurno devuelve null cuando no hay nada en localStorage', () => {
    expect(cargarTurno()).toBeNull();
  });

  it('cargarTurno rechaza un localStorage corrupto', () => {
    localStorage.setItem(TURNO_KEY, '{ no es json');
    expect(cargarTurno()).toBeNull();
  });

  it('cargarTurno rechaza un turno sin operador/inicio', () => {
    localStorage.setItem(TURNO_KEY, JSON.stringify({ inicio: 'x', ventas: [] }));
    expect(cargarTurno()).toBeNull();
  });

  it('guardarTurno + cargarTurno persiste y recupera el turno', () => {
    const t = { operador: 'María López', inicio: '2026-08-02T12:00:00.000Z', ventas: [ventasFixture[0]] };
    guardarTurno(t);
    const recuperado = cargarTurno();
    expect(recuperado).not.toBeNull();
    expect(recuperado!.operador).toBe('María López');
    expect(recuperado!.ventas).toHaveLength(1);
    expect(recuperado!.ventas[0].consecutivo).toBe(10);
  });

  it('limpiarTurno borra el turno de localStorage', () => {
    guardarTurno({ operador: 'X', inicio: '2026-08-02', ventas: [] });
    limpiarTurno();
    expect(cargarTurno()).toBeNull();
  });

  it('cargarTurno normaliza ventas no arreglo a []', () => {
    localStorage.setItem(TURNO_KEY, JSON.stringify({ operador: 'X', inicio: '2026-08-02', ventas: null }));
    expect(cargarTurno()!.ventas).toEqual([]);
  });
});

describe('hoyISO', () => {
  it('devuelve una fecha con formato YYYY-MM-DD', () => {
    expect(hoyISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
