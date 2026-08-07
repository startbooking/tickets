import { describe, it, expect, vi } from 'vitest';
import {
  construirPayloadDian,
  ticketATextoImpresion,
  ventaATextoImpresion,
  manifiestoListadoTexto,
  manifiestoTotalesTexto,
  EMPRESA_NIT,
  EMPRESA_NOMBRE,
  DOCUMENTO_CONSUMIDOR,
  TIPO_DOC_CONSUMIDOR,
  TIPO_DOC_PERSONA,
  CUFE_MOCK,
} from './ticketFiscalService';
import { splitNombreCompleto, formatHora } from '@/services/travelsoftService';
import type { TicketVenta, TurnoSateliteVenta, ManifiestoDespacho } from '@/services/travelsoftService';
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
    expect(payload.adquirente?.nombres).toBe('JUAN');
    expect(payload.adquirente?.apellidos).toBe('PEREZ RODRIGUEZ');
  });

  it('emite un documento equivalente (tipo 21) con encabezado y datos del emisor', () => {
    const payload = construirPayloadDian(ticketBase, { id_orides: 1, id: 79, rol: 'CAJERO' });
    expect(payload.tipoDocumento).toBe('21');
    expect(payload.versionEstructura).toBe('1.0');
    expect(payload.fechaEmision).toBe('2026-07-31');
    expect(payload.horaEmision).toBe('20:46-05:00');
    expect(payload.numeroConsecutivo).toBe(3);
    expect(payload.emisor?.nit).toBe('860022105');
    expect(payload.emisor?.dv).toBe('1');
    expect(payload.emisor?.razonSocial).toBe(EMPRESA_NOMBRE);
    expect(payload.datos_emisor?.id_agencia).toBe(1);
    expect(payload.datos_viaje?.id_interno_viaje).toBe(45470142);
    expect(payload.datos_viaje?.placa_vehiculo).toBe('DMW-900');
    expect(payload.datos_viaje?.numero_asiento).toBe(2);
    expect(payload.datos_viaje?.valor_tiquete).toBe(34000);
  });

  it('marca tipo_documento=14 (consumidor) cuando el documento es el placeholder', () => {
    const consumidor: TicketVenta = { ...ticketBase, pasajero: { nombre: 'CONSUMIDOR', documento: DOCUMENTO_CONSUMIDOR } };
    const payload = construirPayloadDian(consumidor, { id_orides: 1 });
    expect(payload.adquirente?.tipoIdentificacion).toBe('14');
    expect(payload.adquirente?.numeroIdentificacion).toBe('222222222222');
  });

  it('marca tipo_documento=13 para un pasajero con documento real', () => {
    const payload = construirPayloadDian(ticketBase, { id_orides: 1 });
    expect(payload.adquirente?.tipoIdentificacion).toBe('13');
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

  it('propaga numeración, forma de pago y totales', () => {
    const payload = construirPayloadDian(ticketBase, { id_orides: 1 });
    expect(payload.cufe).toBe('7CBC8F46A05C96A491A61565DD8648FEEA35C834');
    expect(payload.formaPago).toBe('1');
    expect(payload.totales?.totalPagar).toBe(34000);
    expect((payload.lineasDetalle as Array<{ totalLinea: number }>).length).toBe(1);
  });

  it('modela el IVA excluido de transporte público (subtotal sin impuestos)', () => {
    const payload = construirPayloadDian(ticketBase, { id_orides: 1 });
    expect(payload.totales?.totalImpuestos).toBe(0);
    const linea = (payload.lineasDetalle as Array<{ impuestos: number[] }>)[0];
    expect(linea.impuestos).toEqual([]);
  });

  it('incluye la sección operativa del ticket (agencia, operación, tipo venta/transporte, elaboró)', () => {
    const cajero = { ...ticketBase, numero_operacion: 7, cajero_nombre: 'ANA GARCIA' };
    const payload = construirPayloadDian(cajero, { id_orides: 1 });
    expect(payload.agencia).toBe('BOGOTA');
    expect(payload.numero_operacion).toBe(7);
    expect(payload.tipo_venta).toBe('PARA HOY');
    expect(payload.tipo_transporte).toBe('Terrestre');
    expect(payload.elaborado).toBe('ANA GARCIA');
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
    expect(ticketATextoImpresion(sinHoraTiquete)).toContain(`Salida: 2026-07-31 ${formatHora(1246)}`);
  });

  it('no incluye "¡Buen Viaje!" en el texto ESC/POS', () => {
    const txt = ticketATextoImpresion(ticketBase);
    expect(txt).not.toContain('Buen Viaje');
    expect(txt).not.toContain('BUEN VIAJE');
  });

  it('usa el CUFE mock (CUFE_MOCK) cuando el ticket no trae cufe', () => {
    const sinCufe = { ...ticketBase, cufe: undefined, cufe: undefined };
    const payload = construirPayloadDian(sinCufe, { id_orides: 1 });
    expect(payload.cufe).toBe(CUFE_MOCK);
  });

  it('imprime el CUFE al final del ticket, después del QR', () => {
    const txt = ticketATextoImpresion(ticketBase);
    const cufeIdx = txt.lastIndexOf('CUFE:');
    const qrIdx = txt.indexOf(String.fromCharCode(0x1d, 0x28, 0x6b));
    expect(cufeIdx).toBeGreaterThan(-1);
    expect(qrIdx).toBeGreaterThan(-1);
    expect(cufeIdx).toBeGreaterThan(qrIdx);
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

describe('manifiestos de despacho', () => {
  const maniBase: ManifiestoDespacho = {
    cod_ruta: 1,
    origen_ruta: 1,
    destino_ruta: 7,
    fecha_ruta: '2026-08-06',
    placa_vehi: 'ETK-728',
    origen: 'BOGOTA',
    destino: 'GIRARDOT',
    hora_ruta: 900,
    vehiculo: { marca: 'CHEVROLET', tipo: 'BUS', modelo: 2023, capacidad: 40 },
    conductores: [{ cedula: '1.023.369.442', nombre: 'MIRQUEZ MENDOZA JUAN DIEGO' }],
    auxiliar: null,
    pasajeros: [
      { puesto: 1, consecutivo_pasajero: 1, nombre: 'GUSTAVO RICO', documento: '79900001', valor: 36000, forma_pago: 'EFECTIVO' },
      { puesto: 2, consecutivo_pasajero: 2, nombre: 'CONSUMIDOR FINAL', documento: null, valor: 36000, forma_pago: 'QR' },
    ],
    totales: { pasajeros: 2, total_venta_cajero: 1080000 },
  };

  it('genera el listado de pasajeros ordenado por silla', () => {
    const txt = manifiestoListadoTexto(maniBase);
    expect(txt.startsWith(ESC_POS.RESET)).toBe(true);
    expect(txt.endsWith(ESC_POS.FEED_6 + ESC_POS.CUT)).toBe(true);
    expect(txt).toContain('MANIFIESTO DE DESPACHO');
    expect(txt).toContain('LISTADO DE PASAJEROS');
    expect(txt).toContain('SILLA  1');
    expect(txt).toContain('GUSTAVO RICO');
    expect(txt).toContain('TOTAL PASAJEROS: 2');
    expect(txt).toContain('TOTAL VENTA CAJERO:');
  });

  it('genera el documento de despacho con datos del vehículo, conductores y auxiliar', () => {
    const conAuxiliar: ManifiestoDespacho = {
      ...maniBase,
      conductores: [
        { cedula: '1.023.369.442', nombre: 'MIRQUEZ MENDOZA JUAN DIEGO' },
        { cedula: '99', nombre: 'CONDUCTOR RELEVO' },
      ],
      auxiliar: { cedula: '1.000.350.227', nombre: 'PENA HERNANDEZ OSCAR CAMILO' },
    };
    const txt = manifiestoTotalesTexto(conAuxiliar);
    expect(txt).toContain('DOCUMENTO DE DESPACHO');
    expect(txt).toContain('PLACA VEHICULO: ETK-728');
    expect(txt).toContain('MARCA: CHEVROLET   TIPO: BUS');
    expect(txt).toContain('CONDUCTOR(ES):');
    expect(txt).toContain('1. MIRQUEZ MENDOZA JUAN DIEGO');
    expect(txt).toContain('2. CONDUCTOR RELEVO');
    expect(txt).toContain('AUXILIAR:');
    expect(txt).toContain('PENA HERNANDEZ OSCAR CAMILO');
    expect(txt).toContain('TOTAL PASAJEROS: 2');
    expect(txt).toContain('TOTAL VENTA CAJERO:');
  });

  it('no incluye conductores ni auxiliar cuando no están registrados', () => {
    const sinPersonal: ManifiestoDespacho = {
      ...maniBase,
      conductores: [],
      auxiliar: null,
    };
    const txt = manifiestoTotalesTexto(sinPersonal);
    expect(txt).toContain('(no registrado)');
  });
});
