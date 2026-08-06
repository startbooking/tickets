// ─────────────────────────────────────────────────────────────────────────────
// IMPRESIÓN EN IMPRESORA TÉRMICA INTEGRADA DE PDA SUNMI
// ─────────────────────────────────────────────────────────────────────────────
// Las PDA Sunmi (V2 SE, V2 Pro, etc.) traen una impresora térmica integrada
// de 58 mm. El navegador (Chrome/WebView) no puede acceder a ella con Web
// Bluetooth; se imprime mediante el plugin JS USDK de Sunmi, que abre un
// servicio WebSocket en `ws://localhost:7070/ws` dentro del dispositivo.
//
// Flujo:
//   1. se detecta el servicio con una SONDA real al WebSocket 7070 (no se
//      depende solo del userAgent, que en algunas ROMs no trae "sunmi"),
//   2. si el servicio no responde, `launchPrinterService()` arranca el plugin
//      JS USDK (deep-link `sunmi://com.sunmi:8888/websdk`),
//   3. `init()` conecta el WebSocket local del SDK,
//   4. `printer.commandApi.sendEscCommand(hex[])` envía el ticket ESC/POS.
//
// Requisito en el equipo: plugin "JS USDK" instalado desde la Sun Store.
// ─────────────────────────────────────────────────────────────────────────────

const PLUGIN_JS_USDK = 'JS USDK';
const URL_WS_LOCAL = 'ws://localhost:7070/ws';

/** Tipo de una instancia del SDK oficial de Sunmi. */
type InstanciaSunmi = InstanceType<typeof import('sunmi-js-sdk')['default']>;

export const IMPRESORA_INTEGRADA_LABEL = 'Impresora integrada Sunmi';

/** Mensaje claro cuando el plugin no está activo (el usuario debe instalarlo). */
export const MENSAJE_PLUGIN_AUSENTE =
  `El plugin ${PLUGIN_JS_USDK} no está activo en esta PDA. ` +
  'Instálelo desde la Sun Store del equipo para imprimir en la impresora integrada.';

/** Una instancia única del SDK (evita reconexiones repetidas al WebSocket). */
let instanciaSunmi: InstanciaSunmi | null = null;
let sdkInicializado = false;

/** Resultado de disponibilidad cacheado para no sondear el puerto en cada venta. */
let cacheDisponible: boolean | null = null;

/**
 * ¿Estamos corriendo en una PDA Sunmi con impresora integrada?
 * Se usa solo como pista de UI; la decisión definitiva la da la sonda
 * `validarImpresoraSunmi()` porque algunos equipos no ponen "sunmi" en el UA.
 */
export function esDispositivoSunmi(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /sunmi/i.test(navigator.userAgent);
}

/**
 * Sonda directa al WebSocket local del plugin JS USDK. No crea el elemento
 * de deep-link ni lanza la app; solo verifica de la conecta. Devuelve true
 * si el servicio de impresión está respondiendo.
 */
export function probarServicioSunmi(timeoutMs = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof WebSocket === 'undefined') {
      resolve(false);
      return;
    }
    let ws: WebSocket | null = null;
    let zanjado = false;
    const terminar = (ok: boolean) => {
      if (zanjado) return;
      zanjado = true;
      clearTimeout(timer);
      try { ws?.close(); } catch { /* ignore */ }
      resolve(ok);
    };
    const timer = setTimeout(() => terminar(false), timeoutMs);
    try {
      ws = new WebSocket(URL_WS_LOCAL);
      ws.onopen = () => terminar(true);
      ws.onerror = () => terminar(false);
      ws.onclose = () => terminar(false);
    } catch {
      terminar(false);
    }
  });
}

/**
 * IMPORTANTE: si la sonda inicial falla, intenta arrancar el plugin JS USDK
 * (deep-link) y vuelve a sondear preparativas. Devuelve true solo si el
 * servicio de impresión realmente responde.
 */
export async function validarImpresoraSunmi(): Promise<boolean> {
  if (await probarServicioSunmi(1500)) return true;
  try {
    const { sunmi } = await obtenerSdk();
    await sunmi.launchPrinterService(); // internamente espera ~3s
    for (let i = 0; i < 10; i++) {
      await delay(300);
      if (await probarServicioSunmi(1000)) return true;
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Disponibilidad cacheada: tras sondear una vez por sesión se guarda el
 * resultado para no retrasar los tickets siguientes en equipos donde la
 * impresora integrada no está disponible.
 */
export async function integradaSunmiDisponible(): Promise<boolean> {
  if (cacheDisponible !== null) return cacheDisponible;
  cacheDisponible = await validarImpresoraSunmi();
  return cacheDisponible;
}

/** Borra la caché de disponibilidad (p. ej. tras instalar el plugin). */
export function reiniciarCacheSunmi(): void {
  cacheDisponible = null;
}

/**
 * Carga el paquete `sunmi-js-sdk` (importación dinámica) y crea una instancia
 * única. El constructor añade el `<a href="sunmi://...">` usado para arrancar
 * el plugin cuando hace falta.
 */
async function obtenerSdk(): Promise<{ sunmi: InstanciaSunmi }> {
  if (instanciaSunmi) return { sunmi: instanciaSunmi };
  const mod = await import(/* webpackChunkName: "sunmi-sdk" */ 'sunmi-js-sdk');
  instanciaSunmi = new mod.default();
  return { sunmi: instanciaSunmi };
}

/** Convierte un texto ESC/POS (string latin-1) a array de strings hex. */
function escPosTextoAHexArray(texto: string): string[] {
  const hex: string[] = [];
  for (let i = 0; i < texto.length; i++) {
    const codigo = texto.charCodeAt(i);
    const byte = codigo <= 0xff ? codigo : 0x3f;
    hex.push(byte.toString(16).padStart(2, '0'));
  }
  return hex;
}

/** Espera hasta que el WebSocket interno del SDK quede abierto. */
async function esperarSocketSdk(sunmi: InstanciaSunmi, timeoutMs = 5000): Promise<boolean> {
  const inicio = Date.now();
  while (Date.now() - inicio < timeoutMs) {
    try {
      const socket = sunmi?.socketManager?.getSocket?.();
      if (socket?.readyState === WebSocket.OPEN) return true;
    } catch { /* ignore */ }
    await delay(150);
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export interface ResultadoImpresionSunmi {
  ok: true;
  dispositivo: string;
}

/**
 * Imprime un ticket ESC/POS en la impresora integrada de la Sunmi.
 * Lanza un Error con mensaje accionable si el plugin JS USDK no está activo.
 */
export async function imprimirSunmi(texto: string): Promise<ResultadoImpresionSunmi> {
  const { sunmi } = await obtenerSdk();
  if (!sdkInicializado) {
    const disponible = await validarImpresoraSunmi();
    if (!disponible) throw new Error(MENSAJE_PLUGIN_AUSENTE);
    sunmi.init();
    sdkInicializado = true;
  }
  if (!(await esperarSocketSdk(sunmi))) {
    throw new Error(MENSAJE_PLUGIN_AUSENTE);
  }
  const hexArray = escPosTextoAHexArray(texto);
  try {
    await sunmi.printer.commandApi.sendEscCommand(hexArray);
  } catch (err) {
    throw new Error(`Error enviando el ticket al plugin ${PLUGIN_JS_USDK}: ${String(err)}`);
  }
  return { ok: true, dispositivo: IMPRESORA_INTEGRADA_LABEL };
}

/**
 * Imprime un ticket de prueba en la impresora integrada (botón
 * "Test Impresora" del cajero en PDA).
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