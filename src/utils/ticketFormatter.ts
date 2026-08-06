// Códigos de control ESC/POS básicos (Hexadecimal / Decimal)
const ESC = '\x1b';
const GS = '\x1d';

export const ESC_POS = {
  RESET: `${ESC}@`,
  ALIGN_LEFT: `${ESC}a\x00`,
  ALIGN_CENTER: `${ESC}a\x01`,
  ALIGN_RIGHT: `${ESC}a\x02`,
  BOLD_ON: `${ESC}E\x01`,
  BOLD_OFF: `${ESC}E\x00`,
  DOUBLE_SIZE: `${GS}!\x11`, // Texto grande para el número de tiquete
  NORMAL_SIZE: `${GS}!\x00`,
  FEED_6: `${ESC}d\x06`,     // Avanza 6 líneas al terminar el tiquete
  CUT: `${GS}V\x01`,         // Corte parcial de papel
};

interface TicketData {
  empresa: string;
  // Datos de la empresa en el encabezado
  nit?: string;
  direccion?: string;
  telefono?: string;
  web?: string;
  regimen?: string;
  consecutivo: string;
  fecha: string;
  hora: string;
  origen: string;
  destino: string;
  pasajero: string;
  valor: number;
  asiento: string;
  // Compra de varias sillas en un mismo tiquete
  asientos?: string[];
  cantidad?: number;
  total?: number;
  fechaVenta?: string;
  municipio?: string;
  documento?: string;
  placa?: string;
  tipoVehi?: string;
  marcaVehi?: string;
  tipoServicio?: string;
  formaPago?: string;
  // Nueva sección del tiquete: agencia / operación / tipo de venta y transporte / elaboró
  agencia?: string;
  operacion?: string | number;
  tipoVenta?: string;
  tipoTransporte?: string;
  elaboro?: string;
  // Campos DIAN (facturación electrónica de tiquetes de transporte)
  resolucion?: string;
  numeroFactura?: string;
  cufe?: string;
  qr?: string;
  // Mensaje de pie de página configurable desde parametros.mensaje_tiquete
  mensaje?: string;
}

/**
 * Genera el bloque ESC/POS del código QR (estándar Epson GS ( k).
 * errorCorrection: 48=L, 49=M, 50=Q, 51=H (DIAN recomienda nivel alto).
 */
export function qrEscPos(data: string, moduleSize = 6, errorCorrection = 51): string {
  const bytes = encodarEscPos(data);
  const storeLen = bytes.length + 3;
  let cmd = '';
  cmd += `${GS}(k${String.fromCharCode(4, 0)}1A${String.fromCharCode(50, 0)}`; // Modelo 2
  cmd += `${GS}(k${String.fromCharCode(3, 0)}1C${String.fromCharCode(moduleSize)}`; // Tamaño del módulo
  cmd += `${GS}(k${String.fromCharCode(3, 0)}1E${String.fromCharCode(errorCorrection)}`; // Nivel de corrección
  cmd += `${GS}(k${String.fromCharCode(storeLen & 0xff, (storeLen >> 8) & 0xff)}1P`; // Guardar datos
  for (let i = 0; i < bytes.length; i++) {
    cmd += String.fromCharCode(bytes[i]);
  }
  cmd += `${GS}(k${String.fromCharCode(3, 0)}1Q${String.fromCharCode(48)}`; // Imprimir QR
  return cmd;
}

/**
 * Normaliza solo el texto imprimible (tildes/¡¿) sin tocar los bytes de
 * control ESC/POS. Los bytes altos del QR (GS ( k) deben pasar intactos.
 */
export function normalizarImpresion(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/¡/g, '!')
    .replace(/¿/g, '?');
}

/**
 * Parte un texto en varias líneas de a lo sumo `width` caracteres respetando
 * espacios (útiles para la dirección en tiquetes de 58mm/32 caracteres).
 */
export function wordWrap(texto: string, width = 32): string[] {
  const palabras = (texto || '').split(/\s+/).filter(Boolean);
  const lineas: string[] = [];
  let linea = '';
  for (const palabra of palabras) {
    const salto = linea ? `${linea} ${palabra}` : palabra;
    if (salto.length > width && linea) {
      lineas.push(linea);
      linea = palabra;
    } else {
      linea = salto;
    }
  }
  if (linea) lineas.push(linea);
  return lineas;
}

export function generateTicketTXT(data: TicketData): string {
  let t = "";
  
  t += ESC_POS.RESET;
  t += ESC_POS.ALIGN_CENTER;
  t += ESC_POS.BOLD_ON;
  t += normalizarImpresion(`${data.empresa}\n`);
  t += ESC_POS.BOLD_OFF;
  if (data.nit) t += normalizarImpresion(`NIT: ${data.nit}\n`);
  if (data.direccion) {
    for (const linea of wordWrap(data.direccion)) t += normalizarImpresion(`${linea}\n`);
  }
  if (data.telefono) t += normalizarImpresion(`Tel: ${data.telefono}\n`);
  if (data.web) t += normalizarImpresion(`Web: ${data.web}\n`);
  if (data.regimen) t += normalizarImpresion(`Regimen: ${data.regimen.toUpperCase()}\n`);
  t += ESC_POS.DOUBLE_SIZE;
  t += normalizarImpresion(`TIQUETE: ${data.consecutivo}\n`);
  t += ESC_POS.NORMAL_SIZE;
  t += "--------------------------------\n"; // 32 caracteres (estándar 58mm)
  
  t += ESC_POS.ALIGN_LEFT;
  t += normalizarImpresion(`Salida: ${data.fecha} ${data.hora}\n`);
  if (data.fechaVenta) t += normalizarImpresion(`Venta: ${data.fechaVenta}\n`);
  t += normalizarImpresion(`Origen:  ${data.origen.toUpperCase()}\n`);
  t += normalizarImpresion(`Destino: ${data.destino.toUpperCase()}\n`);
  if (data.municipio) t += normalizarImpresion(`Municipio: ${data.municipio.toUpperCase()}\n`);
  if (data.placa) t += normalizarImpresion(`Vehiculo: ${data.placa.toUpperCase()}\n`);
  const tipoVehi = [data.tipoVehi, data.marcaVehi].filter(Boolean).join(' ');
  if (tipoVehi) t += normalizarImpresion(`Tipo Veh.: ${tipoVehi.toUpperCase()}\n`);
  t += normalizarImpresion(`Tipo de servicio (básico/premium/etc): ${(data.tipoServicio || '').toUpperCase()}\n`);
  if (data.asientos && data.asientos.length) {
    t += normalizarImpresion(`Sillas: ${data.asientos.join(', ')}\n`);
  } else {
    t += normalizarImpresion(`Silla: ${data.asiento}\n`);
  }
  t += normalizarImpresion(`Pasajero: ${data.pasajero.toUpperCase()}\n`);
  t += data.documento ? normalizarImpresion(`Documento: ${data.documento}\n`) : '';
  // ─── Nueva sección del tiquete ───
  t += "--------------------------------\n";
  t += ESC_POS.ALIGN_LEFT;
  if (data.agencia) t += normalizarImpresion(`Agencia: ${data.agencia.toUpperCase()}\n`);
  if (data.operacion != null && data.operacion !== '') t += normalizarImpresion(`N° Operación: ${data.operacion}\n`);
  if (data.tipoVenta) t += normalizarImpresion(`Tipo venta: ${data.tipoVenta.toUpperCase()}\n`);
  if (data.tipoTransporte) t += normalizarImpresion(`Tipo transporte: ${data.tipoTransporte.toUpperCase()}\n`);
  if (data.elaboro) t += normalizarImpresion(`Elaboro: ${data.elaboro.toUpperCase()}\n`);
  t += "--------------------------------\n";
  
  t += ESC_POS.ALIGN_RIGHT;
  t += ESC_POS.BOLD_ON;
  if (data.cantidad && data.cantidad > 1) {
    t += normalizarImpresion(`Cantidad: ${data.cantidad}\n`);
    t += normalizarImpresion(`Valor: $${data.valor.toLocaleString('es-CO')}\n`);
  }
  t += normalizarImpresion(`TOTAL: $${(data.total ?? data.valor).toLocaleString('es-CO')}\n`);
  t += ESC_POS.BOLD_OFF;
  t += data.formaPago ? normalizarImpresion(`Pago: ${data.formaPago}\n`) : '';
  
  // ─── Bloque DIAN (resolución, numeración, IVA excluido) ───
  t += "--------------------------------\n";
  t += ESC_POS.ALIGN_LEFT;
  if (data.resolucion) t += normalizarImpresion(`Res.: ${data.resolucion}\n`);
  if (data.numeroFactura) t += normalizarImpresion(`Factura: ${data.numeroFactura}\n`);
  t += "IVA EXCLUIDO - SERVICIO DE\n";
  t += "TRANSPORTE PUBLICO (ART. 462 E.T.)\n";

  // ─── Mensaje configurable desde parametros.mensaje_tiquete (sin fallback "¡Buen Viaje!") ───
  if (data.mensaje) t += normalizarImpresion(`${data.mensaje}\n`);
  // ─── Pie legal SUPERTRANSPORTE ───
  t += ESC_POS.ALIGN_CENTER;
  for (const linea of wordWrap("VIGILADO SUPERTRANSPORTE, impreso por Software propio Flota San Vicente S.A., para términos y condiciones del viaje visita www.flotasanvicente.co/terminos")) {
    t += normalizarImpresion(`${linea}\n`);
  }
  t += "\n\n"; // Dos líneas en blanco antes del QR del CUFE
  if (data.qr) t += `${qrEscPos(data.qr)}\n`;
  // ─── CUFE al final del tiquete (después del QR) ───
  if (data.cufe) t += normalizarImpresion(`CUFE: ${data.cufe}\n`);
  t += ESC_POS.FEED_6; // Avance de 6 líneas después del tiquete
  t += ESC_POS.CUT;    // Corte

  return t;
}

/**
 * ¿El dispositivo es Android? (terminales de taquilla con impresora
 * Bluetooth y la app RawBT instalada).
 */
export function isAndroidDevice(): boolean {
  return /Android/i.test(typeof navigator !== 'undefined' ? navigator.userAgent : '');
}

/**
 * Construye el Intent de RawBT para imprimir en silencio por Bluetooth.
 * La app RawBT (ru.a402d.rawbtprinter) recibe el texto ESC/POS en base64,
 * imprime en la impresora emparejada y regresa a la app automáticamente.
 */
export function buildRawBtIntent(escPosText: string): string {
  const base64 = btoa(unescape(encodeURIComponent(escPosText)));
  return `intent://base64,${base64}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
}

/**
 * Convierte el texto ESC/POS a bytes listos para la impresora térmica
 * (codificación latin1 con acentos normalizados, apta para la impresión USB).
 */
export function encodarEscPos(texto: string): Uint8Array {
  const normalizado = texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/¡/g, '!')
    .replace(/¿/g, '?');
  const bytes = new Uint8Array(normalizado.length);
  for (let i = 0; i < normalizado.length; i++) {
    const code = normalizado.charCodeAt(i);
    bytes[i] = code <= 0xff ? code : 0x3f; // '?'
  }
  return bytes;
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPRESIÓN DIRECTA POR BLUETOOTH (Web Bluetooth API)
// ─────────────────────────────────────────────────────────────────────────────
// Las impresoras térmicas ESC/POS BLE exponen typicamente:
//   - Service UUID  : 0xFFE0  (UART-like)
//   - Characteristic: 0xFFE1  (write sin response)
// Soportado en Android Chrome/Chromium (no en iOS Safari; allí se usa RawBT).
// ─────────────────────────────────────────────────────────────────────────────

/** Configuración BLE genérica de impresoras térmicas ESC/POS. */
export const BLE_PRINTER = {
  SERVICE_UUID: 'ffe0',
  CHARACTERISTIC_UUID: 'ffe1',
  /** Tamaño de chunk BLE (bytes por paquete). 20 es el estándar BLE MTU mínimo. */
  chunk_size_bytes: 20,
  /** Fabricantes/aliases para filtrar dispositivos en el selector del navegador. */
  DISPOSITIVO_LABEL: 'Impresora Térmica',
};

export interface BluetoothEscPosResult {
  ok: true;
  dispositivo?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CACHÉ DE IMPRESORA PREDETERMINADA (localStorage)
// ─────────────────────────────────────────────────────────────────────────────
// Después de seleccionar la impresora una vez, la PDA recuerda el dispositivo
// emparejado. En impresiones posteriores se reconecta SIN volver a mostrar el
// selector, usando navigator.bluetooth.getDevices() (Chrome 85+).
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_KEY = 'impresora_ble_predeterminada';

interface ImpresoraBleCache {
  deviceId: string;
  nombre: string;
  fecha: string;
}

export function guardarImpresoraBlePredeterminada(deviceId: string, nombre: string): void {
  try {
    const cache: ImpresoraBleCache = { deviceId, nombre, fecha: new Date().toISOString() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage puede no estar disponible (modo incógnito / almacenamiento bloqueado)
  }
}

export function obtenerImpresoraBlePredeterminada(): ImpresoraBleCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as ImpresoraBleCache;
    return cache?.deviceId ? cache : null;
  } catch {
    return null;
  }
}

export function limpiarImpresoraBlePredeterminada(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}

/** ¿Existe una impresora BLE guardada como predeterminada? */
export function tieneImpresoraBlePredeterminada(): boolean {
  return obtenerImpresoraBlePredeterminada() !== null;
}

/**
 * Conecta a una impresora Bluetooth ya emparejada (sin selector) usando el
 * deviceId guardado. Retorna el dispositivo listo para GATT o null.
 */
async function conectarImpresoraGuardada(): Promise<BluetoothDevice | null> {
  const cache = obtenerImpresoraBlePredeterminada();
  if (!cache || !('getDevices' in navigator.bluetooth!)) return null;
  try {
    const devices = await navigator.bluetooth!.getDevices();
    const dev = devices.find((d) => d.id === cache.deviceId);
    return dev ?? null;
  } catch {
    return null;
  }
}

/**
 * Envía el texto ESC/POS a un dispositivo Bluetooth (GATT + service 0xFFE0).
 * Cierra la conexión al finalizar. Devuelve el nombre del dispositivo.
 */
async function enviarEscPosBle(device: BluetoothDevice, texto: string): Promise<string> {
  if (!device?.gatt) {
    throw new Error('El dispositivo Bluetooth no expone GATT.');
  }
  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(BLE_PRINTER.SERVICE_UUID);
  const characteristic = await service.getCharacteristic(BLE_PRINTER.CHARACTERISTIC_UUID);

  const bytes = encodarEscPos(texto);

  // Algunas impresoras requieren trozos pequeños (<= 20 bytes) por paquete BLE.
  const CHUNK = Number(BLE_PRINTER.chunk_size_bytes) || 20;

  // La mayoría de impresoras térmicas BLE aceptan escritura sin response; si el
  // primer chunk falla (la impr. no soporta withoutResponse), reintentamos con
  // writeValue (con respuesta), que es universalmente aceptado.
  let write: (d: Uint8Array) => Promise<unknown> = async (chunk) => {
    const fn = characteristic.writeValueWithoutResponse?.bind(characteristic)
      ?? characteristic.writeValue.bind(characteristic);
    await fn(chunk);
  };
  const fallback = async (chunk: Uint8Array) => {
    await characteristic.writeValue(chunk);
  };

  let modo: 'withoutResponse' | 'withResponse' = 'withoutResponse';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const chunk = bytes.slice(i, i + CHUNK);
    try {
      await write(chunk);
    } catch (err) {
      if (modo === 'withoutResponse') {
        modo = 'withResponse';
        write = fallback;
        await fallback(chunk);
      } else {
        throw err;
      }
    }
  }

  server.disconnect();
  return device.name ?? BLE_PRINTER.DISPOSITIVO_LABEL;
}

/**
 * Imprime en silencio un texto ESC/POS directamente sobre una impresora Bluetooth.
 * Primero intenta reconectar la impresora predeterminada (guardada en localStorage);
 * si no existe o falla, abre el selector de dispositivos. La impresora elegida se
 * guarda como predeterminada para futuras impresiones.
 * Lanza si Web Bluetooth no está disponible o el usuario rechaza el emparejamiento.
 */
export async function imprimirBleEscPos(texto: string): Promise<BluetoothEscPosResult> {
  if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
    throw new Error('Web Bluetooth no disponible en este navegador/dispositivo.');
  }

  // 1) Intentar con la impresora guardada (sin selector)
  let device: BluetoothDevice | null = null;
  try {
    device = await conectarImpresoraGuardada();
  } catch {
    device = null;
  }

  // 2) Si no hay guardada/falló, abrir el selector
  if (!device) {
    device = await navigator.bluetooth!.requestDevice({
      filters: [{ services: [BLE_PRINTER.SERVICE_UUID] }],
      optionalServices: [BLE_PRINTER.SERVICE_UUID],
    });
  }

  const nombre = await enviarEscPosBle(device, texto);

  // 3) Guardar como predeterminada para la próxima impresión
  if (device.id) {
    guardarImpresoraBlePredeterminada(device.id, nombre);
  }

  return { ok: true, dispositivo: nombre };
}

/**
 * Resultado de la detección de impresora en la PDA.
 */
export interface DeteccionImpresoraResult {
  /** Web Bluetooth disponible en el navegador. */
  bluetoothDisponible: boolean;
  /** El usuario es Android (soporta RawBT). */
  esAndroid: boolean;
  /** La PDA está emparejada con alguna impresora BLE (verificado con conexión). */
  impresoraConectada: boolean;
  /** Nombre del dispositivo emparejado (si aplica). */
  dispositivo?: string;
  /** Mensaje descriptivo para el usuario. */
  mensaje: string;
}

/**
 * Valida si la PDA tiene una impresora local conectada (Bluetooth emparejado).
 * Intenta una conexión BLE de prueba y la cierra inmediatamente.
 */
export async function detectarImpresoraBle(): Promise<DeteccionImpresoraResult> {
  // 1) Verificar Web Bluetooth disponible
  if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
    return {
      bluetoothDisponible: false,
      esAndroid: isAndroidDevice(),
      impresoraConectada: false,
      mensaje: isAndroidDevice()
        ? 'PDA Android detectado. Instale RawBT o use Bluetooth.'
        : 'Web Bluetooth no disponible en este navegador.',
    };
  }

  // 2) Verificar Bluetooth activado (API de disponibilidad)
  try {
    const disponible = await navigator.bluetooth.getAvailability();
    if (!disponible) {
      return {
        bluetoothDisponible: false,
        esAndroid: isAndroidDevice(),
        impresoraConectada: false,
        mensaje: 'Bluetooth desactivado en la PDA. Actívelo e intente nuevamente.',
      };
    }
  } catch {
    // getAvailability lanzó (p. ej. HTTPS requerido); asumimos disponible
  }

  // 3) Intentar solicitar un dispositivo BLE (abre el selector de emparejamiento)
  try {
    const device = await navigator.bluetooth!.requestDevice({
      filters: [{ services: [BLE_PRINTER.SERVICE_UUID] }],
      optionalServices: [BLE_PRINTER.SERVICE_UUID],
    });

    if (!device?.gatt) {
      return {
        bluetoothDisponible: true,
        esAndroid: isAndroidDevice(),
        impresoraConectada: false,
        mensaje: 'Seleccionó un dispositivo que no expone GATT.',
      };
    }

    // Conexión de prueba y cierre inmediato
    const server = await device.gatt.connect();
    server.disconnect();

    // Guardar como predeterminada para no volver a pedir el selector
    if (device.id) {
      guardarImpresoraBlePredeterminada(device.id, device.name ?? BLE_PRINTER.DISPOSITIVO_LABEL);
    }

    return {
      bluetoothDisponible: true,
      esAndroid: isAndroidDevice(),
      impresoraConectada: true,
      dispositivo: device.name ?? BLE_PRINTER.DISPOSITIVO_LABEL,
      mensaje: `Impresora "${device.name ?? 'Térmica'}" guardada como predeterminada.`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      bluetoothDisponible: true,
      esAndroid: isAndroidDevice(),
      impresoraConectada: false,
      mensaje: `No se seleccionó impresora: ${msg}`,
    };
  }
}

/**
 * Imprime un ticket de prueba en la impresora BLE emparejada de la PDA.
 */
export async function imprimirTestBle(): Promise<BluetoothEscPosResult> {
  const ticketPrueba =
    '\x1b\x40' +
    '\x1b\x61\x01PRUEBA DE IMPRESIÓN\n' +
    '\x1b\x61\x00---------------------------\n' +
    'FLOTA SAN VICENTE S.A.\n' +
    'Impresora Bluetooth OK\n' +
    'fecha: ' + new Date().toLocaleString('es-CO') + '\n' +
    '\n\n\n';
  return imprimirBleEscPos(ticketPrueba);
}

/**
 * Indica si el entorno actual puede usar Web Bluetooth para impresión directa.
 */
export function soportaBluetoothEscPos(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}