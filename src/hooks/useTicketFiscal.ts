/**
 * useTicketFiscal
 *
 * Hook compartido entre CajeroDashboard y SateliteDashboard que unifica:
 *  - Construcción del payload DIAN (CUFE/QR).
 *  - Emisión fiscal con fallback tolerante (Core DIAN caído → imprime sin CUFE).
 *  - Impilación del tiquete con cadena de respaldo:
 *      USB (pyusb/servidor) → Bluetooth directo (Web Bluetooth) → RawBT (Android) → window.print.
 *
 * Los componentes ya no duplican ni `imprimirTiquete` ni `construirPayloadDian`.
 */

import { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { travelsoftService } from '@/services/travelsoftService';
import { dianService } from '@/services/dianService';
import {
  buildRawBtIntent,
  isAndroidDevice,
  imprimirBleEscPos,
  soportaBluetoothEscPos,
} from '@/utils/ticketFormatter';
import {
  construirPayloadDian,
  ticketATextoImpresion,
  ventaATextoImpresion,
  type FiscalContext,
  type ImpresionResultado,
} from '@/services/ticketFiscalService';
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
 * 1) USB (servidor CUPS / pyusb) — impresión silenciosa, sin diálogos.
 * 2) Bluetooth directo (Web Bluetooth) — Android, sin app intermedia.
 * 3) RawBT (intent) — Android con app RawBT emparejada.
 * 4) window.print() — navegador de escritorio o último recurso.
 *
 * Cada salto se registra en el resultado para que el UI muestre el medio usado.
 */
async function imprimirConRespaldo(
  texto: string,
  onResultado?: (r: ImpresionResultado) => void
): Promise<ImpresionResultado> {
  // 1. USB (backend)
  try {
    await travelsoftService.imprimirTicketEscPos(texto);
    onResultado?.('usb');
    return 'usb';
  } catch (err) {
    console.error('Impresión USB falló:', err);
  }

  // 2. Bluetooth directo (Android Chromium)
  if (soportaBluetoothEscPos()) {
    try {
      await imprimirBleEscPos(texto);
      onResultado?.('ble');
      return 'ble';
    } catch (err) {
      // El usuario canceló el selector o no hay dispositivo emparejado.
      console.warn('Impresión BLE falló:', err);
    }
  }

  // 3. RawBT (Android con app instalada)
  if (isAndroidDevice()) {
    window.location.href = buildRawBtIntent(texto);
    onResultado?.('rawbt');
    return 'rawbt';
  }

  // 4. Navegador
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
    (t: TicketVenta) => imprimirConRespaldo(ticketATextoImpresion(t)),
    []
  );

  // ── Reimpresión de un ticket del turno satélite ──────────────────────────────
  const reimprimirVenta = useCallback(
    (v: TurnoSateliteVenta) => imprimirConRespaldo(ventaATextoImpresion(v)),
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
