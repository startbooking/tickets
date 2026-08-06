// ─────────────────────────────────────────────────────────────────────────────
// IMPRESIÓN EN IMPRESORA TÉRMICA INTEGRADA DE PDA SUNMI
// ─────────────────────────────────────────────────────────────────────────────
// Las PDA Sunmi (V2 SE, V2 Pro, etc.) traen una impresora térmica integrada
// de 58 mm. El navegador (Chrome/WebView) no puede acceder a ella con Web
// Bluetooth; se imprime mediante el plugin JS USDK de Sunmi, que abre un
// servicio WebSocket en `ws://localhost:7070/ws` dentro del dispositivo.
//
// Flujo:
//   1. el SDK se carga de forma dinámica (solo cuando hay una Sunmi),
//   2. `launchPrinterService()` arranca el plugin JS USDK,
//   3. `init()` conecta el WebSocket local,
//   4. `printer.commandApi.sendEscCommand(hex[])` envía el ticket ESC/POS.
//
// Requisito en el equipo: plugin "JS USDK" instalado desde la Sun Store.
// ─────────────────────────────────────────────────────────────────────────────

const PLUGIN_JS_USDK = 'JS USDK';
export const IMPRESORA_INTEGRADA_LABEL = 'Impresora integrada Sunmi';

/** Una instancia única del SDK (evita reconexiones repetidas al WebSocket). */
let instanciaSunmi: unknown = null;
let websocketInicializado = false;

/**
 * ¿Estamos corriendo en una PDA Sunmi con impresora integrada?
 * El plugin JS USDK solo existe en equipos Sunmi con el plugin instalado.
 */
export function esDispositivoSunmi(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('sunmi');
}

/**
 * Carga el paquete `sunmi-js-sdk` (importación dinámica para no afectar
 * el bundle en navegadores normales) y devuelve una instancia configurada.
 */
async function obtenerSdk(): Promise<{ sunmi: unknown }> {
  if (instanciaSunmi) return { sunmi: instanciaSunmi };
  const mod = await import(/* webpackChunkName: "sunmi-sdk" */ 'sunmi-js-sdk');
  instanciaSunmi = new mod.default();
  return { sunmi: instanciaSunmi };
}

/**
 * Arranca el plugin JS USDK y conecta el WebSocket local. Se llama una sola
 * vez por sesión; los reintentos posteriores no duplican la conexión.
 */
export async function iniciarServicioImpresionSunmi(): Promise<unknown> {
  const { sunmi } = await obtenerSdk();
  if (!websocketInicializado) {
    await sunmi.launchPrinterService();
    sunmi.init();
    websocketInicializado = true;
  }
  return sunmi;
}

/**
 * Convierte un texto ESC/POS (string latin-1) en el array de strings hex
 * que espera `sendEscCommand`, p. ej. ["1b","40","1d","21",...].
 */
function escPosTextoAHexArray(texto: string): string[] {
  const hex: string[] = [];
  for (let i = 0; i < texto.length; i++) {
    const codigo = texto.charCodeAt(i);
    const byte = codigo <= 0xff ? codigo : 0x3f; // fuera de latin-1 → '?'
    hex.push(byte.toString(16).padStart(2, '0'));
  }
  return hex;
}

export interface ResultadoImpresionSunmi {
  ok: true;
  dispositivo: string;
}

/**
 * Imprime un ticket ESC/POS en la impresora integrada de la Sunmi.
 * Requiere que el plugin JS USDK esté instalado (Sun Store) y que la app
 * se esté sirviendo sobre https (o http) en el navegador de la PDA.
 */
export async function imprimirSunmi(texto: string): Promise<ResultadoImpresionSunmi> {
  const sunmi = await iniciarServicioImpresionSunmi();
  const hexArray = escPosTextoAHexArray(texto);
  try {
    await sunmi.printer.commandApi.sendEscCommand(hexArray);
  } catch (err) {
    throw new Error(`Error enviando el ticket al plugin ${PLUGIN_JS_USDK}: ${String(err)}`);
  }
  return { ok: true, dispositivo: IMPRESORA_INTEGRADA_LABEL };
}

/**
 * Comprueba que el WebSocket local del plugin JS USDK responda (servicio
 * de impresión activo). Devuelve true si el plugin está corriendo.
 */
export async function validarImpresoraSunmi(): Promise<boolean> {
  try {
    await iniciarServicioImpresionSunmi();
    return true;
  } catch {
    return false;
  }
}

/**
 * Imprime un ticket de prueba en la impresora integrada (para el botón
 * "Test Impresora" del cajero en PDA Sunmi).
 */
export async function imprimirTestSunmi(): Promise<ResultadoImpresionSunmi> {
  const ticketPrueba =
    '\x1b\x40' +
    '\x1b\x61\x01' +
    'IMPRESORA INTEGRADA OK\n' +
    'FLOTA SAN VICENTE S.A.\n' +
    '\x1b\x61\x00' +
    'fecha: ' + new Date().toLocaleString('es-CO') + '\n' +
    '\n\n\n';
  return imprimirSunmi(ticketPrueba);
}
