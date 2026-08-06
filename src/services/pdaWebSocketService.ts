// ─────────────────────────────────────────────────────────────────────────────
// IMPRESIÓN EN LA PDA VÍA SERVICIO LOCAL WEBSOCKET (sin diálogos)
// ─────────────────────────────────────────────────────────────────────────────
// En la PDA Sunmi corre una app/servicio Android ligera que abre un servidor
// WebSocket en `ws://127.0.0.1:8080`. Ese servicio recibe el ticket, decodifica
// el base64 y llama al SDK de Sunmi (AIDL/SUNMIOS) para imprimir directo en la
// impresora integrada, SIN abrir selectores ni ventanas.
//
// Protocolo (JSON):
//   Send:  { action: "PRINT", data: "<base64 del ESC/POS>", copies: 1 }
//   Reply: { code: 0 | 1, message?: string }   (0 = ok)
// ─────────────────────────────────────────────────────────────────────────────

import { encodarEscPos } from '@/utils/ticketFormatter';

const URL_PDA = 'ws://127.0.0.1:8080';
const CONNECT_TIMEOUT = 2000;
export const PDA_WS_LABEL = 'PDA (WebSocket local)';

let socket: WebSocket | null = null;
let disponibleCache: boolean | null = null;

/** Convierte un Uint8Array a base64 (por lotes para no desbordar la pila). */
function bytesABase64(bytes: Uint8Array): string {
  const CHUNK = 0x4000;
  let bin = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

/** Establece conexión al servidor WebSocket local de la PDA. */
function conectar(timeoutMs = CONNECT_TIMEOUT): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof WebSocket === 'undefined') { resolve(false); return; }
    if (socket && socket.readyState === WebSocket.OPEN) { resolve(true); return; }

    let ws: WebSocket | null = null;
    let zanjado = false;
    const terminar = (ok: boolean) => {
      if (zanjado) return;
      zanjado = true;
      clearTimeout(timer);
      if (!ok) { try { ws?.close(); } catch { /* ignore */ } }
      resolve(ok);
    };
    const timer = setTimeout(() => terminar(false), timeoutMs);
    try {
      ws = new WebSocket(URL_PDA);
      ws.onopen = () => { socket = ws; terminar(true); };
      ws.onerror = () => terminar(false);
      ws.onclose = () => {
        if (socket === ws) socket = null;
        disponibleCache = null;
      };
    } catch {
      terminar(false);
    }
  });
}

/** Sonda el servicio PDA (resultado cacheado por sesión). */
export async function servicioPdaDisponible(): Promise<boolean> {
  if (disponibleCache !== null) return disponibleCache;
  disponibleCache = await conectar();
  return disponibleCache;
}

/** Borra la caché de disponibilidad del servicio PDA. */
export function reiniciarCachePda(): void {
  disponibleCache = null;
}

export interface ResultadoPdaWs {
  ok: true;
  dispositivo: string;
}

/**
 * Imprime un ticket ESC/POS (texto) por el servicio WebSocket local de la PDA.
 * Lanza un Error si el servicio no está disponible en la PDA.
 */
export async function imprimirPdaWs(texto: string): Promise<ResultadoPdaWs> {
  const conectado = await conectar();
  if (!conectado || !socket || socket.readyState !== WebSocket.OPEN) {
    disponibleCache = false;
    throw new Error(
      'Servicio de impresión local no disponible. Instale la app "PDA Print Service" en el equipo.'
    );
  }
  disponibleCache = true;
  const b64 = bytesABase64(encodarEscPos(texto));
  socket.send(JSON.stringify({ action: 'PRINT', data: b64, copies: 1 }));
  return { ok: true, dispositivo: PDA_WS_LABEL };
}

/** Ticket de prueba por el servicio WS local (botón "Test Impresora"). */
export async function imprimirTestPdaWs(): Promise<ResultadoPdaWs> {
  const ticketPrueba =
    '\x1b\x40' +
    '\x1b\x61\x01PRUEBA DE IMPRESIÓN\n' +
    '\x1b\x61\x00---------------------------\n' +
    'FLOTA SAN VICENTE S.A.\n' +
    'PDA WebSocket OK\n' +
    'fecha: ' + new Date().toLocaleString('es-CO') + '\n' +
    '\n\n\n';
  return imprimirPdaWs(ticketPrueba);
}