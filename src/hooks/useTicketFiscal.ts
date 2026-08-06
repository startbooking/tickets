/**
 * useTicketFiscal
 *
 * Hook compartido entre CajeroDashboard y SateliteDashboard que unifica:
 *  - Construcción del payload DIAN (CUFE/QR).
 *  - Emisión fiscal con fallback tolerante (Core DIAN caído → imprime sin CUFE).
 *  - Impilación del tiquete con cadena de respaldo:
 *      Sunmi integrada (PDA) → USB (pyusb/servidor) → Bluetooth directo (Web Bluetooth) → RawBT (Android) → window.print.
 *
 *  Los componentes ya no duplican ni `imprimirTiquete` ni `construirPayloadDian`.
 */

import { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { travelsoftService } from '@/services/travelsoftService';
import { dianService } from '@/services/dianService';
import {
  imprimirRawBtEscPos,
  isAndroidDevice,
  imprimirBleEscPos,
  soportaBluetoothEscPos,
} from '@/utils/ticketFormatter';
import {
  imprimirPdaWs,
  servicioPdaDisponible,
} from '@/services/pdaWebSocketService';
import {
  esDispositivoSunmi,
  imprimirSunmi,
  integradaSunmiDisponible,
} from '@/services/sunmiPrinter';
import {
  construirPayloadDian,
  ticketATextoImpresion,
  ventaATextoImpresion,
  type FiscalContext,
  type ImpresionResultado,
} from '@/services/ticketFiscalService';
import { obtenerLogoEscPos } from '@/utils/escPosImage';
import type { TicketVenta, TurnoSateliteVenta } from '@/services/travelsoftService';
import type { TiqueteTransporteDTO } from '@/types';

export type { ImpresionResultado };

export interface UseTicketFiscalResult {
  /** Emite CUFE/QR ante la DIAN. Si falla, devuelve el ticket sin campos fiscales. */
  emitirConDian: (
    t: TicketVenta,
    onAdvertencia?: (msg: string) => void
  ) => Promise<TicketVenta>;
  /** Imprime un tiquete recién vendido (USB → BLE → RawBT → print). */
  imprimirTicket: (t: TicketVenta) => Promise<ImpresionResultado>;
  /** Reimprime un ticket persistido en el turno satélite. */
  reimprimirVenta: (v: TurnoSateliteVenta) => Promise<ImpresionResultado>;
  /** Construye el payload DIAN para testing o uso externo. */
  construirPayload: (t: TicketVenta) => TiqueteTransporteDTO;
  /** ¿El móvil puede imprimir por Bluetooth directamente? */
  puedeImprimirBle: boolean;
  /** Genera el texto ESC/POS de un ticket (reutilizable por tests). */
  ticketATexto: (t: TicketVenta) => string;
  ventaATexto: (v: TurnoSateliteVenta) => string;
}

/**
 * Cadena de respaldo de impresión unificada.
 *
 * En Android (PDA):
 *   0) Servicio local WebSocket (App "PDA Print Service") — imprime directo a
 *      la integrada vía AIDL/SUNMIOS, sin diálogos.
 *   1) Impresora integrada Sunmi (plugin JS USDK) — impresora térmica 58 mm.
 *   2) USB (servidor CUPS / pyusb) — impresión silenciosa.
 *   3) RawBT (intent) — SPP/Bluetooth clásico (InnerPrinter).
 *   4) window.print() — último recurso.
 *
 * En escritorio (no Android):
 *   1) USB.
 *   2) Web Bluetooth directo.
 *   3) window.print().
 *
 * Cada salto se registra en el resultado para que el UI muestre el medio usado.
 */
async function imprimirConRespalado(
  texto: string,
  onResultado?: (r: ImpresionResultado) => void,
  logoEscPos?: string
): Promise<ImpresionResultado> {
  const textoFinal = logoEscPos ? logoEscPos + texto : texto;

  // 0. Servicio WebSocket local de la PDA (sin diálogos, prioridad en Android).
  if (isAndroidDevice() && (await servicioPdaDisponible())) {
    try {
      await imprimirPdaWs(textoFinal);
      onResultado?.('pda');
      return 'pda';
    } catch (err) {
      console.warn('Impresión por servicio local WS falló:', err);
    }
  }

  // 1. Impresora integrada de la PDA Sunmi (plugin JS USDK).
  //    En PDA Android se intenta esta vía de forma prioritaria (una vez por
  //    sesión se sonda el servicio y el resultado se cachea, para no retrasar
  //    los tickets siguientes en equipos donde no está disponible).
  if (esDispositivoSunmi() || isAndroidDevice()) {
    try {
      if (await integradaSunmiDisponible()) {
        await imprimirSunmi(textoFinal);
        onResultado?.('sunmi');
        return 'sunmi';
      }
    } catch (err) {
      // El plugin no está instalado o el servicio no arrancó; seguimos con la cadena.
      console.error('Impresión en impresora integrada Sunmi falló:', err);
    }
  }

  // 2. USB (backend)
  try {
    await travelsoftService.imprimirTicketEscPos(textoFinal);
    onResultado?.('usb');
    return 'usb';
  } catch (err) {
    console.error('Impresión USB falló:', err);
  }

  // 3. Android → RawBT (SPP/Bluetooth clásico, incl. InnerPrinter de Sunmi).
  //    Va ANTES que Web Bluetooth porque los SPP no son alcanzables por BLE.
  if (isAndroidDevice()) {
    imprimirRawBtEscPos(textoFinal);
    onResultado?.('rawbt');
    return 'rawbt';
  }

  // 4. Web Bluetooth directo (escritorio Chromium)
  if (soportaBluetoothEscPos()) {
    try {
      await imprimirBleEscPos(textoFinal);
      onResultado?.('ble');
      return 'ble';
    } catch (err) {
      // El usuario canceló el selector o no hay dispositivo emparejado.
      console.warn('Impresión BLE falló:', err);
    }
  }

  // 5. Navegador
  window.print();
  onResultado?.('print');
  return 'print';
}

export function useTicketFiscal(): UseTicketFiscalResult {
  const { user } = useAuth();

  const ctx = useMemo<FiscalContext>(
    () => ({
      id_orides: user?.id_orides,
      id: user?.id,
      rol: user?.rol,
    }),
    [user?.id_orides, user?.id, user?.rol]
  );

  // ── Emisión DIAN con fallback ────────────────────────────────────────────────
  const emitirConDian = useCallback(
    async (t: TicketVenta, onAdvertencia?: (msg: string) => void): Promise<TicketVenta> => {
      let ticketFinal: TicketVenta = t;
      try {
        const resultado = await dianService.emitirTiqueteTransporte(construirPayloadDian(t, ctx), {
          'x-user-id': user?.id || 0,
          'x-user-role': user?.rol || 'CAJERO',
        });
        const data = resultado?.data || resultado;
        if (resultado && (resultado.success || data?.cufe)) {
          ticketFinal = {
            ...t,
            cufe: data?.cufe || t.cufe,
            qr_dian: data?.qr_dian || data?.qr_code_url || t.qr_dian,
            numero_factura: data?.numero_factura || t.numero_factura,
          };
        } else {
          onAdvertencia?.(resultado?.message || 'La DIAN no autorizó el tiquete; se imprime sin CUFE.');
        }
      } catch (err) {
        console.error('Core DIAN no disponible:', err);
        onAdvertencia?.('El Core DIAN no respondió; el tiquete se imprime sin CUFE.');
      }
      return ticketFinal;
    },
    [ctx, user?.id, user?.rol]
  );

  // ── Impresión de un ticket recién vendido ────────────────────────────────────
  const imprimirTicket = useCallback(
    async (t: TicketVenta) => {
      const logo = await obtenerLogoEscPos();
      return imprimirConRespalado(ticketATextoImpresion(t), undefined, logo);
    },
    []
  );

  // ── Reimpresión de un ticket del turno satélite ──────────────────────────────
  const reimprimirVenta = useCallback(
    async (v: TurnoSateliteVenta) => {
      const logo = await obtenerLogoEscPos();
      return imprimirConRespalado(ventaATextoImpresion(v), undefined, logo);
    },
    []
  );

  const construirPayload = useCallback(
    (t: TicketVenta) => construirPayloadDian(t, ctx),
    [ctx]
  );

  return {
    emitirConDian,
    imprimirTicket,
    reimprimirVenta,
    construirPayload,
    puedeImprimirBle: soportaBluetoothEscPos(),
    ticketATexto: ticketATextoImpresion,
    ventaATexto: ventaATextoImpresion,
  };
}
