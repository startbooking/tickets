/**
 * ticketFiscalService
 *
 * Lógica de impresión e emisión fiscal COMPARTIDA entre el CajeroDashboard
 * (taquilla fija) y el SateliteDashboard (agencia satélite / móvil).
 *
 * Antes de esta refactorización, `imprimirTiquete`, `construirPayloadDian` y el
 * flujo de emisión DIAN estaban duplicados — casi idénticos — en ambos panels.
 * Este módulo expone funciones puras (sin efectos secundarios) que ambos
 * consumen; el hook `useTicketFiscal` (ver ../hooks/useTicketFiscal.ts) envuelve
 * estas funciones con los efectos secundarios (auth, USB, BLE, RawBT, print).
 */

import { generateTicketTXT } from '@/utils/ticketFormatter';
import { formatHora, splitNombreCompleto } from '@/services/travelsoftService';
import type { TicketVenta, TurnoSateliteVenta } from '@/services/travelsoftService';
import type { TiqueteTransporteDTO } from '@/types';

// ─── Constantes fiscales operativas ───────────────────────────────────────────

/** NIT emisor registrado en la DIAN para Flota San Vicente S.A. */
export const EMPRESA_NIT = '860.022.105-1';
/** Razón social impresa en el encabezado del tiquete. */
export const EMPRESA_NOMBRE = 'FLOTA SAN VICENTE S.A.';
/** Documento usado como marcador cuando el pasajero no provee identificación. */
export const DOCUMENTO_CONSUMIDOR = '222222222222';
/** Tipo de documento DIAN que representa a un "Consumidor Final". */
export const TIPO_DOC_CONSUMIDOR = '14';
/** Tipo de documento DIAN para personas con identificación real. */
export const TIPO_DOC_PERSONA = '13';

/**
 * Contexto fiscal operativo: datos del usuario autenticado necesarios para
 * construir el payload DIAN. Se inyecta explícitamente para que las funciones
 * puras sigan siendo testeables sin depender del AuthContext.
 */
export interface FiscalContext {
  id_orides?: number | null;
  id?: number | null;
  rol?: string | null;
  empresaToken?: string;
}

/**
 * Construye el JSON estructurado para la homologación electrónica ante la DIAN.
 * Reúne los datos del viaje, del pasajero y los de la resolución local (que el
 * backend ya asoció a la venta) para que el Core emita CUFE + QR.
 */
export function construirPayloadDian(t: TicketVenta, ctx: FiscalContext = {}): TiqueteTransporteDTO {
  const partes = splitNombreCompleto(t.pasajero.nombre);
  const token = ctx.empresaToken ?? import.meta.env.VITE_EMPRESA_TOKEN;
  const esConsumidor = t.pasajero.documento === DOCUMENTO_CONSUMIDOR;
  return {
    operacion: 'Emision_Tiquete_Transporte',
    fecha_emision: t.fecha_ruta,
    hora_emision: t.hora_tiquete || formatHora(t.hora_ruta),
    datos_emisor: {
      token_empresa: token,
      id_agencia: Number(ctx.id_orides) || undefined,
    },
    datos_viaje: {
      id_interno_viaje: t.id_planilla,
      origen: t.origen || '',
      destino: t.destino || '',
      placa_vehiculo: t.placa_vehi || '',
      numero_asiento: t.puesto,
      valor_tiquete: t.valor ?? 0,
    },
    datos_pasajero: {
      tipo_documento: esConsumidor ? TIPO_DOC_CONSUMIDOR : TIPO_DOC_PERSONA,
      numero_documento: t.pasajero.documento,
      nombres: partes.nombres,
      apellidos: partes.apellidos,
      email_notificacion: t.pasajero.correo || 'tickets@sactel.net',
    },
    numero_asiento: String(t.puesto),
    placa_vehiculo: t.placa_vehi || '',
    total: t.valor ?? 0,
    forma_pago: t.forma_pago,
    numero_factura: t.numero_factura,
    impuestos: [
      {
        codigo: '01',
        porcentaje: 0,
        base_imponible: t.valor ?? 0,
        valor_impuesto: 0,
      },
    ],
  };
}

/**
 * Genera el texto ESC/POS listo para imprimir a partir de un tiquete recién vendido.
 * El tiquete ya contiene la numeración de la resolución local; si la DIAN autorizó,
 * incluye cufe + QR.
 */
export function ticketATextoImpresion(t: TicketVenta): string {
  return generateTicketTXT({
    empresa: EMPRESA_NOMBRE,
    consecutivo: String(t.consecutivo_pasajero),
    fecha: t.fecha_ruta,
    hora: t.hora_tiquete || formatHora(t.hora_ruta),
    origen: t.origen || '',
    destino: t.destino || '',
    pasajero: t.pasajero.nombre,
    documento: t.pasajero.documento,
    asiento: String(t.puesto),
    valor: t.valor ?? 0,
    placa: t.placa_vehi || undefined,
    formaPago: t.forma_pago,
    nit: t.nit_emisor || EMPRESA_NIT,
    resolucion: t.resolucion_numero,
    numeroFactura: t.numero_factura,
    cufe: t.cufe,
    qr: t.qr_dian || t.qr_code_url,
  });
}

/**
 * Genera el texto ESC/POS para REIMPRIMIR un ticket ya persistido en el turno
 * de la agencia satélite (TurnoSateliteVenta). Los campos provienen del resumen
 * local guardado en localStorage, por lo que se pasan tal cual.
 */
export function ventaATextoImpresion(v: TurnoSateliteVenta): string {
  return generateTicketTXT({
    empresa: EMPRESA_NOMBRE,
    consecutivo: String(v.consecutivo),
    fecha: v.fecha_ruta,
    hora: v.hora,
    origen: v.origen,
    destino: v.destino,
    pasajero: v.pasajero,
    documento: v.documento || '',
    asiento: String(v.asiento),
    valor: v.valor,
    placa: v.placa || undefined,
    formaPago: v.forma_pago,
    nit: v.nit_emisor || EMPRESA_NIT,
    resolucion: v.resolucion_numero,
    numeroFactura: v.numero_factura,
    cufe: v.cufe,
    qr: v.qr_dian,
  });
}

/** Resultado de una operación de impresión. */
export type ImpresionResultado = 'usb' | 'ble' | 'rawbt' | 'print' | 'error';
