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
import { soportaBluetoothEscPos } from '@/utils/ticketFormatter';
import {
  construirPayloadDian,
  ticketATextoImpresion,
  ventaATextoImpresion,
  type FiscalContext,
  type ImpresionResultado,
} from '@/services/ticketFiscalService';
import { imprimirLocal } from '@/services/impresoraLocal';
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
  /** Imprime un documento ESC/POS ya formateado (manifiestos, informes, etc.). */
  imprimirTexto: (texto: string) => Promise<ImpresionResultado>;
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
 * Impresión unificada y SIEMPRE local (USB / Bluetooth / integrada en PDA).
 * La lógica de detección y cadena de respaldo vive en `@/services/impresoraLocal`,
 * que elige automáticamente la mejor impresora local disponible.
 */
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
      return imprimirLocal(ticketATextoImpresion(t), undefined, logo);
    },
    []
  );

  // ── Impresión de un documento genérico ya formateado en ESC/POS ─────────────
  const imprimirTexto = useCallback(
    async (texto: string): Promise<ImpresionResultado> => {
      return imprimirLocal(texto);
    },
    []
  );

  // ── Reimpresión de un ticket del turno satélite ──────────────────────────────
  const reimprimirVenta = useCallback(
    async (v: TurnoSateliteVenta) => {
      const logo = await obtenerLogoEscPos();
      return imprimirLocal(ventaATextoImpresion(v), undefined, logo);
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
    imprimirTexto,
    reimprimirVenta,
    construirPayload,
    puedeImprimirBle: soportaBluetoothEscPos(),
    ticketATexto: ticketATextoImpresion,
    ventaATexto: ventaATextoImpresion,
  };
}
