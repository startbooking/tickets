import { describe, it, expect } from 'vitest';
import {
  fechaHoyColombia,
  horaColombia,
  horaColombiaCorta,
  fechaHoraColombia,
} from './tiempo';

describe('utilidades de tiempo en zona de Colombia (UTC-5)', () => {
  it('fechaHoyColombia usa la fecha de Colombia, no la UTC', () => {
    // 2026-08-19T01:00:00Z son las 20:00 del 2026-08-18 en Bogotá.
    // toISOString() (UTC) diría 2026-08-19 → bug de "hoy" que se corrige.
    const d = new Date('2026-08-19T01:00:00Z');
    expect(fechaHoyColombia(d)).toBe('2026-08-18');
  });

  it('fechaHoyColombia mantiene la misma fecha cuando Colombia y UTC coinciden de día', () => {
    // 2026-08-19T10:00:00Z son las 05:00 del 2026-08-19 en Bogotá.
    const d = new Date('2026-08-19T10:00:00Z');
    expect(fechaHoyColombia(d)).toBe('2026-08-19');
  });

  it('horaColombia devuelve HH:MM:SS ajustado al huso', () => {
    // 2026-08-19T01:00:00Z → 20:00:00 en Bogotá.
    const d = new Date('2026-08-19T01:00:00Z');
    expect(horaColombia(d)).toBe('20:00:00');
  });

  it('horaColombiaCorta devuelve HH:MM', () => {
    const d = new Date('2026-08-19T01:00:00Z');
    expect(horaColombiaCorta(d)).toBe('20:00');
  });

  it('fechaHoraColombia devuelve texto legible en español', () => {
    const d = new Date('2026-08-19T17:30:00Z'); // 12:30 del 19 en Bogotá
    const texto = fechaHoraColombia(d).toLowerCase();
    expect(texto).toContain('agosto');
    expect(texto).toContain('2026');
    expect(texto).toContain('12:30');
  });
});