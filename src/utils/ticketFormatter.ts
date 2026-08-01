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
  consecutivo: string;
  fecha: string;
  hora: string;
  origen: string;
  destino: string;
  pasajero: string;
  valor: number;
  asiento: string;
  documento?: string;
  placa?: string;
  formaPago?: string;
  // Campos DIAN (facturación electrónica de tiquetes de transporte)
  nit?: string;
  resolucion?: string;
  numeroFactura?: string;
  cufe?: string;
  qr?: string;
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

export function generateTicketTXT(data: TicketData): string {
  let t = "";
  
  t += ESC_POS.RESET;
  t += ESC_POS.ALIGN_CENTER;
  t += ESC_POS.BOLD_ON;
  t += normalizarImpresion(`${data.empresa}\n`);
  t += ESC_POS.DOUBLE_SIZE;
  t += normalizarImpresion(`TIQUETE: ${data.consecutivo}\n`);
  t += ESC_POS.NORMAL_SIZE;
  t += ESC_POS.BOLD_OFF;
  t += "--------------------------------\n"; // 32 caracteres (estándar 58mm)
  
  t += ESC_POS.ALIGN_LEFT;
  t += normalizarImpresion(`Fecha: ${data.fecha}   Hora: ${data.hora}\n`);
  t += normalizarImpresion(`Origen:  ${data.origen.toUpperCase()}\n`);
  t += normalizarImpresion(`Destino: ${data.destino.toUpperCase()}\n`);
  t += normalizarImpresion(`Asiento: ${data.asiento}\n`);
  t += data.placa ? normalizarImpresion(`Vehiculo: ${data.placa.toUpperCase()}\n`) : '';
  t += normalizarImpresion(`Pasajero: ${data.pasajero}\n`);
  t += data.documento ? normalizarImpresion(`Documento: ${data.documento}\n`) : '';
  t += "--------------------------------\n";
  
  t += ESC_POS.ALIGN_RIGHT;
  t += ESC_POS.BOLD_ON;
  t += normalizarImpresion(`TOTAL: $${data.valor.toLocaleString('es-CO')}\n`);
  t += ESC_POS.BOLD_OFF;
  t += data.formaPago ? normalizarImpresion(`Pago: ${data.formaPago}\n`) : '';
  
  // ─── Bloque DIAN (resolución, numeración, IVA excluido y CUFE/QR) ───
  t += "--------------------------------\n";
  t += ESC_POS.ALIGN_LEFT;
  if (data.nit) t += normalizarImpresion(`NIT: ${data.nit}\n`);
  if (data.resolucion) t += normalizarImpresion(`Res.: ${data.resolucion}\n`);
  if (data.numeroFactura) t += normalizarImpresion(`Factura: ${data.numeroFactura}\n`);
  t += "IVA EXCLUIDO - SERVICIO DE\n";
  t += "TRANSPORTE PUBLICO (ART. 462 E.T.)\n";
  if (data.cufe) t += normalizarImpresion(`CUFE: ${data.cufe}\n`);
  
  t += ESC_POS.ALIGN_CENTER;
  t += "¡Buen Viaje!\n".replace('¡', '!');
  if (data.qr) t += `${qrEscPos(data.qr)}\n`;
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