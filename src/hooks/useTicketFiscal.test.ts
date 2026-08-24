import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// ── Mock del AuthContext: useAuth devuelve un usuario autenticado ────────────
// La convención `mockUser`/`mockLogout` permite que vi.mock lo referencie (hoisting).
const mockUser = {
  id: 79,
  rol: 'CAJERO',
  nombre: 'Operador Prueba',
  nombreCompleto: 'Operador Prueba',
  agencia: 'BOGOTA',
  id_orides: 1,
};
const mockLogout = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
    isAuthenticated: true,
    isLoading: false,
    loginStateUpdate: vi.fn(),
  }),
}));

// ── Mock del Core DIAN: emisión exitosa con CUFE ──────────────────────────────
const cufeMock = 'AABBCCDDEE1234567890AABBCCDDEE1234567890AABBCCDDEE1234567890AABBCCD';
const mockEmitir = vi.fn().mockResolvedValue({
  success: true,
  cufe: cufeMock,
  numero_factura: 'FSV1',
  qr_dian: 'https://qr.dian/cufe',
});
vi.mock('@/services/dianService', () => ({
  dianService: { emitirTiqueteTransporte: (...args: unknown[]) => mockEmitir(...args) },
}));

// ── Mock del backend: impresión USB "exitosa" ────────────────────────────────
const mockImprimir = vi.fn().mockResolvedValue({ impresora: 'TMU' });
vi.mock('@/services/travelsoftService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/travelsoftService')>();
  return {
    ...actual,
    travelsoftService: { ...actual.travelsoftService, imprimirTicketEscPos: (...args: unknown[]) => mockImprimir(...args) },
  };
});

// ── Mock del formateador: BLE/USB/Android desactivados (usa USB del mock) ─────
vi.mock('@/utils/ticketFormatter', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/ticketFormatter')>();
  return {
    ...actual,
    isAndroidDevice: vi.fn(() => false),
    soportaBluetoothEscPos: vi.fn(() => false),
    imprimirBleEscPos: vi.fn().mockRejectedValue(new Error('BLE no disponible')),
    buildRawBtIntent: (t: string) => actual.buildRawBtIntent(t),
    generateTicketTXT: (d: unknown) => actual.generateTicketTXT(d as Parameters<typeof actual.generateTicketTXT>[0]),
  };
});

// ── Mock del loader de logo ESC/POS: en entorno jsdom no hay canvas ni Image ────
vi.mock('@/utils/escPosImage', () => ({
  obtenerLogoEscPos: vi.fn().mockResolvedValue(''),
  limpiarCacheLogo: vi.fn(),
}));

// ── Mock del servicio WS local: en tests no hay mini-servicio en 127.0.0.1 ────
vi.mock('@/services/pdaWebSocketService', () => ({
  imprimirPdaWs: vi.fn().mockRejectedValue(new Error('WS no disponible')),
  reiniciarCachePda: vi.fn(),
  servicioPdaDisponible: vi.fn().mockResolvedValue(false),
}));

import { useTicketFiscal } from '@/hooks/useTicketFiscal';
import type { TicketVenta } from '@/services/travelsoftService';

const ticketBase = (parcial: Partial<TicketVenta> = {}): TicketVenta => ({
  id_planilla: 45470142,
  consecutivo_pasajero: 1,
  consecutivo_planilla: 7,
  cod_ruta: 2,
  fecha_ruta: '2026-07-31',
  hora_ruta: 1246,
  hora_tiquete: '20:46',
  placa_vehi: 'DMW-900',
  origen: 'BOGOTA',
  destino: 'TOCAIMA',
  puesto: 2,
  valor: 34000,
  pasajero: { nombre: 'JUAN PEREZ RODRIGUEZ', documento: '79900001', correo: 'juan@test.com' },
  forma_pago: 'EFECTIVO',
  resolucion_numero: '18764000000001',
  numero_factura: 'FSV3',
  nit_emisor: '860.022.105-1',
  cufe: '7CBC8F46A05C96A491A61565DD8648FEEA35C834',
  qr_dian: 'https://qr.dian',
  ...parcial,
});

describe('useTicketFiscal (con auth mockeada)', () => {
  it('construirPayload inyecta id_agencia y divide nombres/apellidos', () => {
    const { result } = renderHook(() => useTicketFiscal());
    const payload = result.current.construirPayload(ticketBase());
    expect(payload.datos_emisor?.id_agencia).toBe(1);
    expect(payload.adquirente?.nombres).toBe('JUAN');
    expect(payload.adquirente?.apellidos).toBe('PEREZ RODRIGUEZ');
    expect(payload.formaPago).toBe('1');
    expect(payload.totales?.totalImpuestos).toBe(0);
  });

  it('construirPayload marca tipo 14 para consumidor final', () => {
    const { result } = renderHook(() => useTicketFiscal());
    const t = ticketBase({ pasajero: { nombre: 'CONSUMIDOR', documento: '222222222222' } });
    expect(result.current.construirPayload(t).adquirente?.tipoIdentificacion).toBe('14');
  });

  it('emitirConDian enriquece el ticket con CUFE/QR/factura cuando el Core autoriza', async () => {
    const { result } = renderHook(() => useTicketFiscal());
    const advertencias: string[] = [];
    const final = await result.current.emitirConDian(ticketBase(), (m) => advertencias.push(m));
    expect(final.cufe).toBe(cufeMock);
    expect(final.qr_dian).toBe('https://qr.dian/cufe');
    expect(final.numero_factura).toBe('FSV1');
    expect(advertencias).toHaveLength(0);
    expect(mockEmitir).toHaveBeenCalledTimes(1);
  });

  it('emitirConDian conserva el ticket original con fallback cuando el Core rechaza', async () => {
    mockEmitir.mockResolvedValueOnce({ success: false, message: 'CUFE denegado' });
    const { result } = renderHook(() => useTicketFiscal());
    const t = ticketBase();
    const adv: string[] = [];
    const final = await result.current.emitirConDian(t, (m) => adv.push(m));
    expect(final).toBe(t);
    expect(adv).toContain('CUFE denegado');
  });

  it('emitirConDian captura errores del Core y advierte sin lanzar', async () => {
    mockEmitir.mockRejectedValueOnce(new Error('Core caído'));
    const { result } = renderHook(() => useTicketFiscal());
    const adv: string[] = [];
    const final = await result.current.emitirConDian(ticketBase(), (m) => adv.push(m));
    expect(final).toMatchObject({ consecutivo_pasajero: 1 });
    expect(adv[0]).toMatch(/Core DIAN no respondió/);
  });

  it('imprimirTicket usa USB como primer medio exitoso', async () => {
    const { result } = renderHook(() => useTicketFiscal());
    const r = await result.current.imprimirTicket(ticketBase());
    expect(r).toBe('usb');
    expect(mockImprimir).toHaveBeenCalled();
  });
});
