// ─────────────────────────────────────────────────────────────────────────────
// IMPRESIÓN LOCAL UNIFICADA
// ─────────────────────────────────────────────────────────────────────────────
// Todas las impresoras están CONECTADAS LOCALMENTE al equipo que navega:
//   - USB        → mini-servicio WebSocket del PC (desktop-print-service).
//   - Bluetooth  → RawBT (SPP/InnerPrinter) en PDA Android, Web Bluetooth (BLE)
//                  en escritorio/Chrome.
//   - Integrada  → impresora térmica de la PDA (Sunmi vía plugin JS USDK, o el
//                  servicio WebSocket "PDA Print Service" que la escribe directo).
//
// No hay impresión por red: la impresora siempre está en el equipo del
// cajero/satélite. La detección es AUTOMÁTICA: se elige la mejor impresora
// local disponible y se usa sin que el operador la seleccione manualmente.
//
// Prioridad (todas locales):
//   1) Servicio WebSocket local → USB en PC / integrada en PDA (sin diálogos).
//   2) Impresora integrada Sunmi → plugin JS USDK (PDA).
//   3) Bluetooth                → RawBT (Android) / Web Bluetooth (escritorio).
//   4) Diálogo del navegador    → impresora del sistema (local) como último recurso.
// ─────────────────────────────────────────────────────────────────────────────

import {
  encodarEscPos,
  isAndroidDevice,
  imprimirRawBtEscPos,
  imprimirBleEscPos,
  soportaBluetoothEscPos,
} from '@/utils/ticketFormatter';
import {
  imprimirPdaWs,
  reiniciarCachePda,
  servicioPdaDisponible,
  imprimirTicketHtml,
} from '@/services/pdaWebSocketService';
import {
  esDispositivoSunmi,
  imprimirSunmi,
  integradaSunmiDisponible,
  IMPRESORA_INTEGRADA_LABEL,
} from '@/services/sunmiPrinter';
import type { ImpresionResultado } from '@/services/ticketFiscalService';

/** Métodos de impresión local (sin el estado de error). */
export type MetodoImpresionLocal = Exclude<ImpresionResultado, 'error'>;

export interface EstadoImpresoraLocal {
  metodo: MetodoImpresionLocal;
  etiqueta: string;
}

const ETIQUETAS: Record<MetodoImpresionLocal, string> = {
  pda: isAndroidDevice() ? 'Servicio local (PDA)' : 'Servicio local (PC)',
  sunmi: IMPRESORA_INTEGRADA_LABEL,
  rawbt: 'Bluetooth (RawBT)',
  ble: 'Bluetooth (BLE)',
  usb: 'Impresora USB local',
  print: 'Impresora del sistema',
};

const TEXTO_PRUEBA =
  '\x1b\x40' +
  '\x1b\x61\x01PRUEBA DE IMPRESIÓN\n' +
  '\x1b\x61\x00---------------------------\n' +
  'FLOTA SAN VICENTE S.A.\n' +
  'Impresión local OK\n' +
  'fecha: ' +
  new Date().toLocaleString('es-CO') +
  '\n\n\n';

/**
 * Detecta la mejor impresora local disponible. Devuelve null solo si la
 * detección aún no terminó (no debería ocurrir en la práctica, pues el
 * diálogo del navegador siempre es un respaldo local válido).
 */
export async function detectarImpresoraLocal(): Promise<EstadoImpresoraLocal | null> {
  // 1) Servicio WebSocket local (USB en PC / integrada en PDA).
  if (isAndroidDevice()) reiniciarCachePda();
  if (await servicioPdaDisponible()) {
    return { metodo: 'pda', etiqueta: ETIQUETAS.pda };
  }

  // 2) Impresora integrada de la PDA Sunmi (plugin JS USDK).
  if (esDispositivoSunmi() || isAndroidDevice()) {
    if (await integradaSunmiDisponible()) {
      return { metodo: 'sunmi', etiqueta: ETIQUETAS.sunmi };
    }
  }

  // 3) Bluetooth (Web Bluetooth BLE) SOLO en Android/PDA: en escritorio la
  //    impresora Bluetooth se usa vía el servicio local WebSocket (desktop-print-service,
  //    que habla SPP con BlueZ sin abrir el selector nativo de Chrome). Forzar BLE en
  //    escritorio dispara el diálogo de selección de Chrome y queda la ventana del
  //    navegador abierta, por eso se omite en escritorio.
  if (isAndroidDevice() && soportaBluetoothEscPos()) {
    return { metodo: 'ble', etiqueta: ETIQUETAS.ble };
  }

  // 4) Android sin Web Bluetooth → RawBT (SPP/Bluetooth clásico, InnerPrinter).
  if (isAndroidDevice()) {
    return { metodo: 'rawbt', etiqueta: ETIQUETAS.rawbt };
  }

  // 5) Diálogo del navegador → impresora del sistema (siempre local).
  return { metodo: 'print', etiqueta: ETIQUETAS.print };
}

/**
 * Imprime un texto ESC/POS por la mejor impresora local disponible, con
 * cadena de respaldo local. `onMetodo` reporta el medio efectivamente usado.
 */
export async function imprimirLocal(
  texto: string,
  onMetodo?: (m: MetodoImpresionLocal) => void,
  logoEscPos?: string
): Promise<ImpresionResultado> {
  const textoFinal = logoEscPos ? logoEscPos + texto : texto;

  // 1) Servicio WebSocket local (sin diálogos; prioridad en ambos entornos).
  if (isAndroidDevice()) reiniciarCachePda();
  if (await servicioPdaDisponible()) {
    try {
      await imprimirPdaWs(textoFinal);
      onMetodo?.('pda');
      return 'pda';
    } catch (err) {
      console.warn('Impresión por servicio local WS falló:', err);
    }
  }

  // 2) Impresora integrada Sunmi (plugin JS USDK).
  if (esDispositivoSunmi() || isAndroidDevice()) {
    try {
      if (await integradaSunmiDisponible()) {
        await imprimirSunmi(textoFinal);
        onMetodo?.('sunmi');
        return 'sunmi';
      }
    } catch (err) {
      console.error('Impresión en impresora integrada Sunmi falló:', err);
    }
  }

  // 3) Web Bluetooth directo SOLO en Android/PDA. En escritorio la impresora
  //    Bluetooth se usa vía el servicio local WebSocket (desktop-print-service → SPP),
  //    que no abre el selector nativo de Chrome ni deja ventanas colgadas.
  if (isAndroidDevice() && soportaBluetoothEscPos()) {
    try {
      await imprimirBleEscPos(textoFinal);
      onMetodo?.('ble');
      return 'ble';
    } catch (err) {
      console.warn('Impresión BLE falló:', err);
    }
  }

  // 4) Android sin Web Bluetooth → RawBT (SPP/Bluetooth clásico, InnerPrinter).
  if (isAndroidDevice()) {
    imprimirRawBtEscPos(textoFinal);
    onMetodo?.('rawbt');
    return 'rawbt';
  }

  // 5) Navegador → impresora del sistema del equipo (100% local, sin red).
  imprimirTicketHtml(textoFinal);
  onMetodo?.('print');
  return 'print';
}

/** Imprime un ticket de prueba por la impresora local detectada. */
export async function testImpresionLocal(): Promise<ImpresionResultado> {
  return imprimirLocal(TEXTO_PRUEBA);
}

export { encodarEscPos };
