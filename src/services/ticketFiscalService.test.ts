import { describe, it, expect, vi } from 'vitest';
import {
  construirPayloadDian,
  ticketATextoImpresion,
  ventaATextoImpresion,
  EMPRESA_NIT,
  EMPRESA_NOMBRE,
  DOCUMENTO_CONSUMIDOR,
  TIPO_DOC_CONSUMIDOR,
  TIPO_DOC_PERSONA,
} from './ticketFiscalService';
import { splitNombreCompleto, formatHora } from '@/services/travelsoftService';
import type { TicketVenta, TurnoSateliteVenta } from '@/services/travelsoftService';
import { ESC_POS } from '@/utils/ticketFormatter';

// Silenciado del env en tests (no se toca el backend).
vi.mock('@/services/travelsoftService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/travelsoftService')>();
  return { ...actual, formatHora: (m: number) => actual.formatHora(m) };
});

const ticketBase: TicketVenta = {
  id_planilla: 45470142,
  consecutivo_pasajero: 1,
  consecutivo_planilla: 7,
  cod_ruta: 2,
  fecha_ruta: '2026-07-31',
  hora_ruta: 1246, // 20:46
  hora_tiquete: '20:46',
  placa_vehi: 'DMW-900',
  origen: 'BOGOTA',
  destino: 'TOCAIMA',
  puesto: 2,
  valor: 34000,
  pasajero: {
    nombre: 'JUAN PEREZ RODRIGUEZ',
    documento: '79900001',
    correo: 'juan@test.com',
  },
  forma_pago: 'EFECTIVO',
  numero_factura: 'FSV3',
  resolucion_numero: '18764000000001',
  nit_emisor: '860.022.105-1',
  cufe: '7CBC8F46A05C96A491A61565DD8648FEEA35C834',
  qr_dian: 'http://www.dian.gov.co/qr',
};

const ventaBase: TurnoSateliteVenta = {
  id_planilla: 100,
  consecutivo: 2,
  hora: '10:30',
  cod_ruta: 548,
  placa: 'TTO-218',
  origen: 'BOGOTA',
  destino: 'LA VIRGEN',
  asiento: 3,
  pasajero: 'MARIA LOPEZ',
  documento: '79900004',
  valor: 19000,
  forma_pago: 'EFECTIVO',
  numero_factura: 'QPL2',
  resolucion_numero: '18764000000013',
  cufe: 'ABCDEF1234',
  qr_dian: 'http://www.dian.gov.co/qr2',
  nit_emisor: '860.022.105-1',
  fecha_ruta: '2026-04-19',
  hora_ruta: 645,
};

describe('constantes operativas', () => {
  it('expone el NIT y nombre de la empresa emisora', () => {
    expect(EMPRESA_NIT).toBe('860.022.105-1');
    expect(EMPRESA_NOMBRE).toBe('FLOTA SAN VICENTE S.A.');
  });

  it('documento/placeholder de consumidor', () => {
    expect(DOCUMENTO_CONSUMIDOR).toBe('222222222222');
    expect(TIPO_DOC_CONSUMIDOR).toBe('14');
    expect(TIPO_DOC_PERSONA).toBe('13');
  });
});

describe('construirPayloadDian', () => {
  it('divide nombres y apellidos (últimos 2 tokens = apellidos)', () => {
    const payload = construirPayloadDian(ticketBase, { id_orides: 1 });
    expect(payload.datos_pasajero?.nombres).toBe('JUAN');
    expect(payload.datos_pasajero?.apellidos).toBe('PEREZ RODRIGUEZ');
  });

  it('construye los datos obligatorios del viaje y emisor', () => {
    const payload = construirPayloadDian(ticketBase, { id_orides: 1, id: 79, rol: 'CAJERO' });
    expect(payload.operacion).toBe('Emision_Tiquete_Transporte');
    expect(payload.fecha_emision).toBe('2026-07-31');
    expect(payload.hora_emision).toBe('20:46');
    expect(payload.datos_emisor?.id_agencia).toBe(1);
    expect(payload.datos_viaje?.id_interno_viaje).toBe(45470142);
    expect(payload.datos_viaje?.placa_vehiculo).toBe('DMW-900');
    expect(payload.datos_viaje?.numero_asiento).toBe(2);
    expect(payload.datos_viaje?.valor_tiquete).toBe(34000);
  });

  it('marca tipo_documento=14 (consumidor) cuando el documento es el placeholder', () => {
    const consumidor: TicketVenta = { ...ticketBase, pasajero: { nombre: 'CONSUMIDOR', documento: DOCUMENTO_CONSUMIDOR } };
    const payload = construirPayloadDian(consumidor, { id_orides: 1 });
    expect(payload.datos_pasajero?.tipo_documento).toBe('14');
    expect(payload.datos_pasajero?.numero_documento).toBe('222222222222');
  });

  it('marca tipo_documento=13 para un pasajero con documento real', () => {
    const payload = construirPayloadDian(ticketBase, { id_orides: 1 });
    expect(payload.datos_pasajero?.tipo_documento).toBe('13');
  });

  it('usa el token de empresa del contexto si se provee', () => {
    const payload = construirPayloadDian(ticketBase, { id_orides: 1, empresaToken: 'sk_test_custom' });
    expect(payload.datos_emisor?.token_empresa).toBe('sk_test_custom');
  });

  it('usa el token de entorno (VITE_EMPRESA_TOKEN) como fallback', () => {
    const original = import.meta.env.VITE_EMPRESA_TOKEN;
    // @ts-expect-error - mutación controlada de env en tests
    import.meta.env.VITE_EMPRESA_TOKEN = 'sk_live_test_fallback';
    try {
      const payload = construirPayloadDian(ticketBase, { id_orides: 1 });
      expect(payload.datos_emisor?.token_empresa).toBe('sk_live_test_fallback');
    } finally {
      // @ts-expect-error - restauramos el env original para aislar el test
      import.meta.env.VITE_EMPRESA_TOKEN = original;
    }
  });

  it('propaga la numeración DIAN y la forma de pago del ticket', () => {
    const payload = construirPayloadDian(ticketBase, { id_orides: 1 });
    expect(payload.numero_factura).toBe('FSV3');
    expect(payload.forma_pago).toBe('EFECTIVO');
    expect(payload.numero_asiento).toBe('2');
    expect(payload.total).toBe(34000);
  });

  it('modela el IVA excluido de transporte público (art. 462 E.T.)', () => {
    const payload = construirPayloadDian(ticketBase, { id_orides: 1 });
    expect(payload.impuestos).toEqual([
      { codigo: '01', porcentaje: 0, base_imponible: 34000, valor_impuesto: 0 },
    ]);
  });
});

describe('ticketATextoImpresion', () => {
  it('genera texto ESC/POS con RESET al inicio y FEED+CUT al final', () => {
    const txt = ticketATextoImpresion(ticketBase);
    expect(txt.startsWith(ESC_POS.RESET)).toBe(true);
    expect(txt.endsWith(ESC_POS.FEED_6 + ESC_POS.CUT)).toBe(true);
  });

  it('incluye empresa, consecutivo, NIT, resolución y factura', () => {
    const txt = ticketATextoImpresion(ticketBase);
    expect(txt).toContain(EMPRESA_NOMBRE);
    expect(txt).toContain('TIQUETE: 1');
    expect(txt).toContain('NIT: 860.022.105-1');
    expect(txt).toContain('Res.: 18764000000001');
    expect(txt).toContain('Factura: FSV3');
  });

  it('incluye cufe y el bloque QR cuando el Core los autorizó', () => {
    const txt = ticketATextoImpresion(ticketBase);
    expect(txt).toContain('CUFE: 7CBC8F46A05C96A491A61565DD8648FEEA35C834');
    expect(txt).toContain(String.fromCharCode(0x1d, 0x28, 0x6b)); // GS ( k
  });

  it('usa el NIT de respaldo cuando el ticket no lo trae', () => {
    const sinNit = { ...ticketBase, nit_emisor: undefined };
    expect(ticketATextoImpresion(sinNit)).toContain(`NIT: ${EMPRESA_NIT}`);
  });

  it('formatea la hora con formatHora cuando no hay hora_tiquete', () => {
    const sinHoraTiquete = { ...ticketBase, hora_tiquete: undefined, hora_ruta: 1246 };
    expect(ticketATextoImpresion(sinHoraTiquete)).toContain(`Hora: ${formatHora(1246)}`);
  });
});

describe('ventaATextoImpresion', () => {
  it('genera texto ESC/POS para un ticket reimpreso del turno satélite', () => {
    const txt = ventaATextoImpresion(ventaBase);
    expect(txt.startsWith(ESC_POS.RESET)).toBe(true);
    expect(txt.endsWith(ESC_POS.FEED_6 + ESC_POS.CUT)).toBe(true);
    expect(txt).toContain('TIQUETE: 2');
    expect(txt).toContain('MARIA LOPEZ');
    expect(txt).toContain('Documento: 79900004');
    expect(txt).toContain('Factura: QPL2');
    expect(txt).toContain('Res.: 18764000000013');
  });

  it('usa el NIT de respaldo cuando la venta no lo declara', () => {
    const ventaSinNit = { ...ventaBase, nit_emisor: undefined };
    expect(ventaATextoImpresion(ventaSinNit)).toContain(`NIT: ${EMPRESA_NIT}`);
  });
});
