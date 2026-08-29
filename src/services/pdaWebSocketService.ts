// ─────────────────────────────────────────────────────────────────────────────
// IMPRESIÓN VÍA SERVICIO LOCAL WEBSOCKET (sin diálogos)
// ─────────────────────────────────────────────────────────────────────────────
// La impresión local se delega a un mini-servicio WS en 127.0.0.1 que escribe
// los bytes en la impresora del equipo SIN abrir selectores ni ventanas:
//   - En la PDA Sunmi: la app Android "PDA Print Service" (pda-websocket-printer)
//     escucha en el puerto 8091 e imprime en la integrada (InnerPrinter).
//   - En el escritorio: el mini-servicio Python "desktop-print-service"
//     escucha en el puerto 8090 e imprime con win32print a la impresora local.
// El puerto 8080 queda libre para el servidor web/desarrollo.
//
// Protocolo (JSON):
//   Send:  { action: "PRINT", data: "<base64 del ESC/POS>", copies: 1 }
//   Reply: { code: 0 | 1, message?: string }   (0 = ok)
// ─────────────────────────────────────────────────────────────────────────────

import { encodarEscPos, isAndroidDevice } from '@/utils/ticketFormatter';

/**
 * Mini-servicio del escritorio (desktop-print-service/print_service.py).
 * Se resuelve contra el MISMO host que sirve la app (no contra 127.0.0.1),
 * porque el navegador del cajero puede correr en otra máquina de la LAN y ahí
 * 127.0.0.1 apuntaría a su propio PC, no al servidor con la impresora Bluetooth.
 */
const WS_PROTO = (typeof location !== 'undefined' && location.protocol === 'https:') ? 'wss' : 'ws';
const URL_DESKTOP_WS =
  typeof location !== 'undefined'
    ? `${WS_PROTO}://${location.hostname}:8090`
    : 'ws://127.0.0.1:8090';
/** App Android de la PDA (pda-websocket-printer/PrintService.kt). */
const URL_PDA_WS = 'ws://127.0.0.1:8091';
const CONNECT_TIMEOUT = 2000;
/** Etiqueta del servicio WS local en una PDA Android (app "PDA Print Service"). */
export const PDA_WS_LABEL = 'PDA (WebSocket local)';
/** Etiqueta del mini-servicio de impresión del escritorio (desktop-print-service). */
export const DESKTOP_WS_LABEL = 'Servicio local (WebSocket)';

/** URL del mini-servicio local según el dispositivo. */
export function getLocalWsUrl(): string {
  return isAndroidDevice() ? URL_PDA_WS : URL_DESKTOP_WS;
}

/** Etiqueta según el dispositivo actual. */
export function getLocalWsLabel(): string {
  return isAndroidDevice() ? PDA_WS_LABEL : DESKTOP_WS_LABEL;
}

let socket: WebSocket | null = null;
let disponibleCache: boolean | null = null;
// En escritorio un primer sondeo fallido NO bloquea la sesión: se reintenta
// tras este TTL para que, si el mini-servicio arranca después, la impresión
// local (requisito: imprimir en la impresora del equipo) se recupere.
let cacheNegativoHasta: number = 0;
const TTL_NEGATIVO_MS = 15000;

/** Convierte un Uint8Array a base64 (por lotes para no desbordar la pila). */
function bytesABase64(bytes: Uint8Array): string {
  const CHUNK = 0x4000;
  let bin = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

/** URL alternativas (127.0.0.1 <-> localhost) por si el navegador bloquea una. */
function urlAlternativas(): string[] {
  const u = getLocalWsUrl();
  const alt = u.includes('127.0.0.1') ? u.replace('127.0.0.1', 'localhost') : u.replace('localhost', '127.0.0.1');
  return alt === u ? [u] : [u, alt];
}

/** Establece conexión al servidor WebSocket local (prueba 127.0.0.1 y localhost). */
function conectar(timeoutMs = CONNECT_TIMEOUT): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof WebSocket === 'undefined') { resolve(false); return; }
    if (socket && socket.readyState === WebSocket.OPEN) { resolve(true); return; }

    const urls = urlAlternativas();
    let idx = 0;
    let zanjado = false;
    const intentar = () => {
      if (idx >= urls.length) { resolve(false); return; }
      const url = urls[idx++];
      let ws: WebSocket | null = null;
      const terminar = (ok: boolean) => {
        if (zanjado) return;
        zanjado = true;
        clearTimeout(timer);
        if (!ok) { try { ws?.close(); } catch { /* ignore */ } if (idx < urls.length) intentar(); else resolve(false); }
        else { socket = ws; resolve(true); }
      };
      const timer = setTimeout(() => terminar(false), timeoutMs);
      try {
        ws = new WebSocket(url);
        ws.onopen = () => terminar(true);
        ws.onerror = () => terminar(false);
        ws.onclose = () => {
          if (socket === ws) socket = null;
          disponibleCache = null;
          if (!zanjado) terminar(false);
        };
      } catch {
        terminar(false);
      }
    };
    intentar();
  });
}

/** Sonda el servicio local (positivo cacheado por sesión; negativo con TTL). */
export async function servicioPdaDisponible(): Promise<boolean> {
  if (disponibleCache === true) return true;
  if (disponibleCache === false && Date.now() < cacheNegativoHasta) return false;
  disponibleCache = await conectar();
  if (disponibleCache === false) cacheNegativoHasta = Date.now() + TTL_NEGATIVO_MS;
  return disponibleCache;
}

/** Borra la caché de disponibilidad del servicio local (fuerza re-sondeo). */
export function reiniciarCachePda(): void {
  disponibleCache = null;
  cacheNegativoHasta = 0;
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
  const url = getLocalWsUrl();
  const b64 = bytesABase64(encodarEscPos(texto));
  // Conexión propia por impresión: así leemos la RESPUESTA del servicio y
  // propagamos el error real (p. ej. "win32print" no disponible) en vez de
  // creer que imprimió cuando el servicio falla localmente.
  return await new Promise<ResultadoPdaWs>((resolve, reject) => {
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch (e) {
      disponibleCache = false;
      cacheNegativoHasta = Date.now() + TTL_NEGATIVO_MS;
      reject(new Error('No se pudo conectar al servicio local (' + url + '): ' + (e as Error).message));
      return;
    }
    let terminado = false;
    const finalizar = (ok: boolean, err?: string) => {
      if (terminado) return;
      terminado = true;
      clearTimeout(timer);
      try { ws.close(); } catch { /* ignore */ }
      if (ok) resolve({ ok: true, dispositivo: getLocalWsLabel() });
      else { disponibleCache = false; cacheNegativoHasta = Date.now() + TTL_NEGATIVO_MS; reject(new Error(err || 'Error de impresión local.')); }
    };
    const timer = setTimeout(
      () => finalizar(false, 'Tiempo de espera agotado conectando al servicio local (' + url + '). ¿Está corriendo el mini-servicio en este PC?'),
      CONNECT_TIMEOUT + 4000
    );
    ws.onopen = () => { ws.send(JSON.stringify({ action: 'PRINT', data: b64, copies: 1 })); };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(String(ev.data));
        if (msg && msg.code === 0) finalizar(true);
        else finalizar(false, msg?.message || 'El servicio local devolvió un error al imprimir.');
      } catch {
        finalizar(false, 'Respuesta inválida del servicio local de impresión.');
      }
    };
    ws.onerror = () => finalizar(false, 'No se pudo conectar al servicio local (' + url + '). Active el mini-servicio en este PC (desktop-print-service).');
    ws.onclose = () => { if (!terminado) finalizar(false, 'El servicio local cerró la conexión antes de responder.'); };
  });
}

/** Ticket de prueba por el servicio WS local (botón "Test Impresora"). */
export async function imprimirTestPdaWs(): Promise<ResultadoPdaWs> {
  const ticketPrueba =
    '\x1b\x40' +
    '\x1b\x61\x01PRUEBA DE IMPRESIÓN\n' +
    '\x1b\x61\x00---------------------------\n' +
    'FLOTA SAN VICENTE S.A.\n' +
    'Print Service WS OK\n' +
    'fecha: ' + new Date().toLocaleString('es-CO') + '\n' +
    '\n\n\n';
  return imprimirPdaWs(ticketPrueba);
}

/**
 * Fallback 100% LOCAL: abre el dialogo de impresion del navegador y manda el
 * ticket a la impresora PREDETERMINADA DEL SISTEMA (la del equipo), sin pasar
 * por la red ni por el servicio WS. Limpia los comandos ESC/POS para que el
 * texto se lea como un recibo. Util cuando el mini-servicio no esta disponible.
 */
export function imprimirTicketHtml(textoEscPos: string): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const limpio = textoEscPos
    // eslint-disable-next-line no-control-regex
    .replace(/[\u001b\u001d][\u0000-\u007f]?/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html =
    '<!doctype html><html><head><meta charset="utf-8"><title>Ticket</title><style>' +
    '@page{margin:4mm;}body{margin:0;font-family:"Courier New",monospace;font-size:12px;}' +
    'pre{margin:0;white-space:pre-wrap;word-break:break-word;}</style></head>' +
    '<body><pre>' + escapeHtml(limpio) + '</pre></body></html>';
  const frame = document.createElement('iframe');
  frame.setAttribute('style', 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;');
  document.body.appendChild(frame);
  const doc = frame.contentWindow?.document;
  if (!doc) { window.print(); return; }
  doc.open();
  doc.write(html);
  doc.close();
  const w = frame.contentWindow;
  if (!w) { frame.remove(); return; }
  w.focus();
  setTimeout(() => {
    w.print();
    setTimeout(() => frame.remove(), 800);
  }, 300);
}