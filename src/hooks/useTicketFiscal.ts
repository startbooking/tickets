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
  /** Anula el Documento Equivalente Electrónico ante la DIAN (evento de anulación). */
  anularConDian: (idPlanilla: number, motivo: string) => Promise<{ ok: boolean; cudeAnulacion?: string; message?: string }>;
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
        const cude = data?.cude || data?.cufe;
        if (resultado && (resultado.success || cude)) {
          ticketFinal = {
            ...t,
            cude,
            cufe: cude || t.cufe,
            qr_dian: data?.qr_dian || data?.qr_code_url || t.qr_dian,
            numero_factura: data?.numero_factura || t.numero_factura,
          };
          // (b) Persistencia best-effort del documento fiscal en el Core SACTel.
          // No bloquea la impresión: si falla, se reintenta vía cola local (F7).
          dianService
            .guardarDocumento({
              id_planilla: t.id_planilla,
              tipo_documento: '21',
              numero_factura: ticketFinal.numero_factura ?? null,
              cude: cude ?? null,
              qr_data: ticketFinal.qr_dian ?? null,
              url_validacion: (data as { url_validacion?: string } | undefined)?.url_validacion ?? null,
              estado: 'AUTORIZADO',
              id_resolucion: (t as { id_resolucion?: number | null })?.id_resolucion ?? null,
              id_orides: ctx.id_orides ?? null,
              total: ticketFinal.total ?? (ticketFinal.valor ?? 0),
              total_impuestos: 0,
              forma_pago: ticketFinal.forma_pago,
              medio_pago: '48',
              respuesta_dian: data ?? null,
            })
            .catch((e) => console.warn('No se pudo persistir el documento DIAN:', e));
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

  // ── Anulación del DEE ante la DIAN ──────────────────────────────────────────
  const anularConDian = useCallback(
    async (idPlanilla: number, motivo: string) => {
      const res = await dianService.anularDocumento(idPlanilla, motivo);
      const data = res?.data || res;
      const cudeAnulacion = (data as { cude_anulacion?: string } | undefined)?.cude_anulacion
        || (data as { cude?: string } | undefined)?.cude;
      return {
        ok: Boolean(res?.success || cudeAnulacion),
        cudeAnulacion,
        message: res?.message,
      };
    },
    []
  );

  return {
    emitirConDian,
    imprimirTicket,
    imprimirTexto,
    reimprimirVenta,
    construirPayload,
    anularConDian,
    puedeImprimirBle: soportaBluetoothEscPos(),
    ticketATexto: ticketATextoImpresion,
    ventaATexto: ventaATextoImpresion,
  };
}
