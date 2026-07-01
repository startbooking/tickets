// ============================================
// THERMAL PRINTER SERVICE - ESC/POS Commands
// Para impresoras Epson TM-U (TMU220, TMU295, etc.)
// ============================================

import { Ticket, Empresa, EnvioDinero } from '@/types';
import QRCode from 'qrcode';

// Información de la empresa (configurable)
export const EMPRESA_CONFIG: Empresa & { 
  direccion: string; 
  telefono: string; 
  correo: string; 
  regimen: string;
} = {
  id: 1,
  nit: '800.123.456-7',
  razonSocial: 'TRANSPORTES VELOZ S.A.',
  direccion: 'Terminal de Transportes de Bogotá - Módulo 3',
  telefono: '(601) 123-4567',
  correo: 'facturacion@transveloz.com',
  regimen: 'Responsable de IVA',
  activo: true,
};

// ESC/POS Command Constants
const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;

// Helper to convert string to Uint8Array
function textToBytes(text: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(text);
}

// ESC/POS Command Builders
export const ESCPOSCommands = {
  // Initialize printer
  init: new Uint8Array([ESC, 0x40]),
  
  // Text alignment
  alignLeft: new Uint8Array([ESC, 0x61, 0x00]),
  alignCenter: new Uint8Array([ESC, 0x61, 0x01]),
  alignRight: new Uint8Array([ESC, 0x61, 0x02]),
  
  // Text formatting
  boldOn: new Uint8Array([ESC, 0x45, 0x01]),
  boldOff: new Uint8Array([ESC, 0x45, 0x00]),
  doubleHeight: new Uint8Array([GS, 0x21, 0x01]),
  doubleWidth: new Uint8Array([GS, 0x21, 0x10]),
  doubleSize: new Uint8Array([GS, 0x21, 0x11]),
  normalSize: new Uint8Array([GS, 0x21, 0x00]),
  underlineOn: new Uint8Array([ESC, 0x2D, 0x01]),
  underlineOff: new Uint8Array([ESC, 0x2D, 0x00]),
  
  // Line feeds
  lineFeed: new Uint8Array([LF]),
  feedLines: (n: number) => new Uint8Array([ESC, 0x64, n]),
  
  // Paper cut
  fullCut: new Uint8Array([GS, 0x56, 0x00]),
  partialCut: new Uint8Array([GS, 0x56, 0x01]),
  
  // Cash drawer
  openDrawer: new Uint8Array([ESC, 0x70, 0x00, 0x19, 0xFA]),
  
  // Line separator
  separator: textToBytes('================================'),
  dottedSeparator: textToBytes('--------------------------------'),
  
  // QR Code Commands (GS ( k)
  // Function 165: Set QR model
  qrModel: new Uint8Array([GS, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]), // Model 2
  // Function 167: Set QR size (1-16)
  qrSize: (size: number) => new Uint8Array([GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, size]),
  // Function 169: Set QR error correction (48=L, 49=M, 50=Q, 51=H)
  qrErrorCorrection: new Uint8Array([GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31]), // M level
  // Function 180: Store QR data
  qrStoreData: (data: string) => {
    const dataBytes = textToBytes(data);
    const len = dataBytes.length + 3;
    const pL = len % 256;
    const pH = Math.floor(len / 256);
    const header = new Uint8Array([GS, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30]);
    const result = new Uint8Array(header.length + dataBytes.length);
    result.set(header, 0);
    result.set(dataBytes, header.length);
    return result;
  },
  // Function 181: Print QR code
  qrPrint: new Uint8Array([GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]),
};

// Generate CUDE (Código Único de Documento Electrónico) - Mock
function generateCUDE(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let cude = '';
  for (let i = 0; i < 64; i++) {
    cude += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return cude;
}

// Format currency
function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-CO')}`;
}

// Format date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Format time
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

// Build invoice data for a ticket
export interface InvoiceData {
  empresa: typeof EMPRESA_CONFIG;
  ticket: Ticket;
  numeroFactura: string;
  fechaEmision: Date;
  valorNeto: number;
  tasaTerminal: number;
  total: number;
  cude: string;
  rangoAutorizacion: string;
}

export function buildInvoiceData(ticket: Ticket): InvoiceData {
  const tasaTerminal = 5000;
  const valorNeto = ticket.valorPagado;
  const total = valorNeto + tasaTerminal;
  
  return {
    empresa: EMPRESA_CONFIG,
    ticket,
    numeroFactura: `TPE-${ticket.id.toString().padStart(5, '0')}`,
    fechaEmision: new Date(),
    valorNeto,
    tasaTerminal,
    total,
    cude: generateCUDE(),
    rangoAutorizacion: 'Autorización DIAN No. 187600000001 del 01/01/2026. Prefijo TPE del 1 al 100.000.',
  };
}

// Build ESC/POS byte array for the invoice
export function buildInvoiceBytes(data: InvoiceData): Uint8Array {
  const parts: Uint8Array[] = [];
  
  const addCommand = (cmd: Uint8Array) => parts.push(cmd);
  const addText = (text: string) => parts.push(textToBytes(text));
  const addLine = () => addCommand(ESCPOSCommands.lineFeed);
  
  // Initialize
  addCommand(ESCPOSCommands.init);
  
  // === HEADER ===
  addCommand(ESCPOSCommands.alignCenter);
  addCommand(ESCPOSCommands.boldOn);
  addCommand(ESCPOSCommands.doubleSize);
  addText(data.empresa.razonSocial);
  addLine();
  addCommand(ESCPOSCommands.normalSize);
  addCommand(ESCPOSCommands.boldOff);
  
  addText(`NIT: ${data.empresa.nit}`);
  addLine();
  addText(data.empresa.direccion);
  addLine();
  addText(`Tel: ${data.empresa.telefono}`);
  addLine();
  addText(data.empresa.correo);
  addLine();
  addText(`Régimen: ${data.empresa.regimen}`);
  addLine();
  addLine();
  
  // === TITLE ===
  addCommand(ESCPOSCommands.separator);
  addLine();
  addCommand(ESCPOSCommands.boldOn);
  addText('TIQUETE DE TRANSPORTE');
  addLine();
  addText('DE PASAJEROS ELECTRÓNICO');
  addLine();
  addCommand(ESCPOSCommands.boldOff);
  addCommand(ESCPOSCommands.separator);
  addLine();
  addLine();
  
  // === INVOICE INFO ===
  addCommand(ESCPOSCommands.alignLeft);
  addCommand(ESCPOSCommands.boldOn);
  addText(`Número: ${data.numeroFactura}`);
  addLine();
  addCommand(ESCPOSCommands.boldOff);
  addText(`Fecha Emisión: ${formatDate(data.fechaEmision.toISOString())}`);
  addLine();
  addText(`Hora: ${formatTime(data.fechaEmision.toISOString())}`);
  addLine();
  addText(`Fecha Viaje: ${data.ticket.planilla.fechaDespacho}`);
  addLine();
  addText(`Hora Salida: ${data.ticket.planilla.horaProgramada}`);
  addLine();
  addLine();
  
  // === PASSENGER DATA ===
  addCommand(ESCPOSCommands.alignCenter);
  addCommand(ESCPOSCommands.dottedSeparator);
  addLine();
  addCommand(ESCPOSCommands.boldOn);
  addText('DATOS DEL PASAJERO');
  addLine();
  addCommand(ESCPOSCommands.dottedSeparator);
  addLine();
  addCommand(ESCPOSCommands.boldOff);
  addCommand(ESCPOSCommands.alignLeft);
  addLine();
  
  addText(`Nombre: ${data.ticket.pasajero.nombreCompleto}`);
  addLine();
  addText(`Identificación: ${data.ticket.pasajero.numeroDocumento}`);
  addLine();
  if (data.ticket.pasajero.telefono) {
    addText(`Teléfono: ${data.ticket.pasajero.telefono}`);
    addLine();
  }
  addLine();
  
  // === SERVICE DETAILS ===
  addCommand(ESCPOSCommands.alignCenter);
  addCommand(ESCPOSCommands.dottedSeparator);
  addLine();
  addCommand(ESCPOSCommands.boldOn);
  addText('DETALLE DEL SERVICIO');
  addLine();
  addCommand(ESCPOSCommands.dottedSeparator);
  addLine();
  addCommand(ESCPOSCommands.boldOff);
  addCommand(ESCPOSCommands.alignLeft);
  addLine();
  
  addText('Modo: Terrestre Automotor');
  addLine();
  addText(`Origen: ${data.ticket.ruta.municipioOrigen?.nombre || 'N/A'} (${data.ticket.ruta.municipioOrigen?.departamento || ''})`);
  addLine();
  addText(`Destino: ${data.ticket.ruta.municipioDestino?.nombre || 'N/A'} (${data.ticket.ruta.municipioDestino?.departamento || ''})`);
  addLine();
  addText(`Vehículo (Placa): ${data.ticket.planilla.bus.placa}`);
  addLine();
  addText(`Marca/Modelo: ${data.ticket.planilla.bus.marca || ''} ${data.ticket.planilla.bus.modelo || ''}`);
  addLine();
  if (data.ticket.numeroAsiento) {
    addText(`Silla: ${data.ticket.numeroAsiento}`);
    addLine();
  }
  addText('Tipo de Servicio: Intermunicipal');
  addLine();
  addLine();
  
  // === FINANCIAL INFO ===
  addCommand(ESCPOSCommands.alignCenter);
  addCommand(ESCPOSCommands.dottedSeparator);
  addLine();
  addCommand(ESCPOSCommands.boldOn);
  addText('INFORMACIÓN FINANCIERA');
  addLine();
  addCommand(ESCPOSCommands.dottedSeparator);
  addLine();
  addCommand(ESCPOSCommands.boldOff);
  addCommand(ESCPOSCommands.alignLeft);
  addLine();
  
  addText(`Valor Neto Pasaje    ${formatCurrency(data.valorNeto)}`);
  addLine();
  addText(`Tasa Uso Terminal    ${formatCurrency(data.tasaTerminal)}`);
  addLine();
  addCommand(ESCPOSCommands.separator);
  addLine();
  addCommand(ESCPOSCommands.boldOn);
  addCommand(ESCPOSCommands.doubleHeight);
  addText(`TOTAL A PAGAR  ${formatCurrency(data.total)}`);
  addLine();
  addCommand(ESCPOSCommands.normalSize);
  addCommand(ESCPOSCommands.boldOff);
  addCommand(ESCPOSCommands.separator);
  addLine();
  addLine();
  
  // Payment method
  const formaPagoLabels: Record<string, string> = {
    'EFECTIVO': 'Contado (Efectivo)',
    'TARJETA': 'Contado (Tarjeta)',
    'TRANSFERENCIA': 'Contado (Transferencia)',
    'QR': 'Contado (Código QR)',
  };
  addText(`Forma de Pago: ${formaPagoLabels[data.ticket.formaPago] || data.ticket.formaPago}`);
  addLine();
  addLine();
  
  // === DIAN LEGAL INFO ===
  addCommand(ESCPOSCommands.alignCenter);
  addCommand(ESCPOSCommands.dottedSeparator);
  addLine();
  addCommand(ESCPOSCommands.boldOn);
  addText('INFORMACIÓN LEGAL DIAN');
  addLine();
  addCommand(ESCPOSCommands.dottedSeparator);
  addLine();
  addCommand(ESCPOSCommands.boldOff);
  addCommand(ESCPOSCommands.alignLeft);
  addLine();
  
  addText('CUDE:');
  addLine();
  // Split CUDE into chunks for readability
  const cudeChunks = data.cude.match(/.{1,32}/g) || [];
  cudeChunks.forEach(chunk => {
    addText(chunk);
    addLine();
  });
  addLine();
  
  addText('Rango de Numeración:');
  addLine();
  addText(data.rangoAutorizacion);
  addLine();
  addLine();
  
  // === QR CODE ===
  addCommand(ESCPOSCommands.alignCenter);
  addLine();
  addCommand(ESCPOSCommands.boldOn);
  addText('ESCANEA PARA VERIFICAR');
  addLine();
  addCommand(ESCPOSCommands.boldOff);
  addLine();
  
  // Build QR data URL
  const qrData = `https://verify.transveloz.com/ticket/${data.numeroFactura}?cude=${data.cude.substring(0, 16)}`;
  
  // QR Code ESC/POS Commands
  addCommand(ESCPOSCommands.qrModel);
  addCommand(ESCPOSCommands.qrSize(6)); // Size 6 for good readability
  addCommand(ESCPOSCommands.qrErrorCorrection);
  addCommand(ESCPOSCommands.qrStoreData(qrData));
  addCommand(ESCPOSCommands.qrPrint);
  addLine();
  addLine();
  
  // === FOOTER ===
  addCommand(ESCPOSCommands.alignCenter);
  addCommand(ESCPOSCommands.separator);
  addLine();
  addText('¡Gracias por viajar con nosotros!');
  addLine();
  addText('Conserve este tiquete hasta');
  addLine();
  addText('finalizar su viaje');
  addLine();
  addCommand(ESCPOSCommands.separator);
  addLine();
  
  // Feed 5 lines up before cut (more paper feed for clean cut)
  addCommand(ESCPOSCommands.feedLines(8)); // 8 lines total (5 extra + 3 original)
  addCommand(ESCPOSCommands.partialCut);
  
  // Combine all parts
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  
  return result;
}

// Extended navigator type for Web Serial API
declare global {
  interface Navigator {
    serial?: {
      requestPort(): Promise<SerialPortInstance>;
    };
  }
}

interface SerialPortInstance {
  open(options: { baudRate: number; dataBits: number; stopBits: number; parity: string }): Promise<void>;
  close(): Promise<void>;
  writable?: WritableStream<Uint8Array>;
}

// Web Serial API interface for thermal printer
class ThermalPrinterService {
  private port: SerialPortInstance | null = null;
  private isConnected = false;
  
  // Check if Web Serial API is supported
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }
  
  // Connect to the printer
  async connect(): Promise<boolean> {
    if (!this.isSupported()) {
      console.error('Web Serial API not supported');
      return false;
    }
    
    try {
      // Request port (this requires user gesture)
      if (!navigator.serial) {
        console.error('Web Serial API not available');
        return false;
      }
      this.port = await navigator.serial.requestPort();
      
      // Open the port with typical thermal printer settings
      await this.port.open({
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
      });
      
      this.isConnected = true;
      console.log('Printer connected successfully');
      return true;
    } catch (error) {
      console.error('Failed to connect to printer:', error);
      return false;
    }
  }
  
  // Disconnect from the printer
  async disconnect(): Promise<void> {
    if (this.port) {
      await this.port.close();
      this.port = null;
    }
    
    this.isConnected = false;
  }
  
  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
  
  // Print raw bytes
  async printBytes(data: Uint8Array): Promise<boolean> {
    if (!this.port || !this.isConnected) {
      console.error('Printer not connected');
      return false;
    }
    
    try {
      const writer = this.port.writable?.getWriter();
      if (!writer) {
        console.error('Cannot get writer');
        return false;
      }
      
      await writer.write(data);
      writer.releaseLock();
      
      return true;
    } catch (error) {
      console.error('Failed to print:', error);
      return false;
    }
  }
  
  // Print ticket invoice
  async printInvoice(ticket: Ticket): Promise<boolean> {
    const invoiceData = buildInvoiceData(ticket);
    const invoiceBytes = buildInvoiceBytes(invoiceData);
    return this.printBytes(invoiceBytes);
  }
}

// Singleton instance
export const ThermalPrinter = new ThermalPrinterService();
export const thermalPrinter = ThermalPrinter; // Alias for backwards compatibility

// Generate printable HTML for fallback/preview
export function generateInvoiceHTML(ticket: Ticket): string {
  const data = buildInvoiceData(ticket);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Tiquete ${data.numeroFactura}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      width: 72mm;
      margin: 4mm;
      line-height: 1.3;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .double { font-size: 16px; font-weight: bold; }
    .separator { border-top: 1px dashed #000; margin: 8px 0; }
    .total { font-size: 14px; font-weight: bold; }
    .small { font-size: 10px; }
    h1 { font-size: 14px; margin: 0; }
    h2 { font-size: 12px; margin: 8px 0 4px; }
    p { margin: 2px 0; }
    .row { display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="center">
    <h1>${data.empresa.razonSocial}</h1>
    <p>NIT: ${data.empresa.nit}</p>
    <p>${data.empresa.direccion}</p>
    <p>Tel: ${data.empresa.telefono}</p>
    <p>${data.empresa.correo}</p>
    <p>Régimen: ${data.empresa.regimen}</p>
  </div>
  
  <div class="separator"></div>
  <div class="center bold">
    <p>TIQUETE DE TRANSPORTE</p>
    <p>DE PASAJEROS ELECTRÓNICO</p>
  </div>
  <div class="separator"></div>
  
  <p class="bold">Número: ${data.numeroFactura}</p>
  <p>Fecha Emisión: ${formatDate(data.fechaEmision.toISOString())}</p>
  <p>Hora: ${formatTime(data.fechaEmision.toISOString())}</p>
  <p>Fecha Viaje: ${data.ticket.planilla.fechaDespacho}</p>
  <p>Hora Salida: ${data.ticket.planilla.horaProgramada}</p>
  
  <div class="separator"></div>
  <h2 class="center">DATOS DEL PASAJERO</h2>
  <div class="separator"></div>
  
  <p>Nombre: ${data.ticket.pasajero.nombreCompleto}</p>
  <p>Identificación: ${data.ticket.pasajero.numeroDocumento}</p>
  ${data.ticket.pasajero.telefono ? `<p>Teléfono: ${data.ticket.pasajero.telefono}</p>` : ''}
  
  <div class="separator"></div>
  <h2 class="center">DETALLE DEL SERVICIO</h2>
  <div class="separator"></div>
  
  <p>Modo: Terrestre Automotor</p>
  <p>Origen: ${data.ticket.ruta.municipioOrigen?.nombre || 'N/A'} (${data.ticket.ruta.municipioOrigen?.departamento || ''})</p>
  <p>Destino: ${data.ticket.ruta.municipioDestino?.nombre || 'N/A'} (${data.ticket.ruta.municipioDestino?.departamento || ''})</p>
  <p>Vehículo (Placa): ${data.ticket.planilla.bus.placa}</p>
  <p>Marca/Modelo: ${data.ticket.planilla.bus.marca || ''} ${data.ticket.planilla.bus.modelo || ''}</p>
  ${data.ticket.numeroAsiento ? `<p>Silla: ${data.ticket.numeroAsiento}</p>` : ''}
  <p>Tipo de Servicio: Intermunicipal</p>
  
  <div class="separator"></div>
  <h2 class="center">INFORMACIÓN FINANCIERA</h2>
  <div class="separator"></div>
  
  <div class="row">
    <span>Valor Neto Pasaje</span>
    <span>${formatCurrency(data.valorNeto)}</span>
  </div>
  <div class="row">
    <span>Tasa Uso Terminal</span>
    <span>${formatCurrency(data.tasaTerminal)}</span>
  </div>
  <div class="separator"></div>
  <div class="row total">
    <span>TOTAL A PAGAR</span>
    <span>${formatCurrency(data.total)}</span>
  </div>
  <div class="separator"></div>
  
  <p>Forma de Pago: ${
    data.ticket.formaPago === 'EFECTIVO' ? 'Contado (Efectivo)' :
    data.ticket.formaPago === 'TARJETA' ? 'Contado (Tarjeta)' :
    data.ticket.formaPago === 'TRANSFERENCIA' ? 'Contado (Transferencia)' :
    'Contado (Código QR)'
  }</p>
  
  <div class="separator"></div>
  <h2 class="center">INFORMACIÓN LEGAL DIAN</h2>
  <div class="separator"></div>
  
  <p class="small">CUDE:</p>
  <p class="small" style="word-break: break-all;">${data.cude}</p>
  <p class="small">Rango de Numeración:</p>
  <p class="small">${data.rangoAutorizacion}</p>
  
  <div class="separator"></div>
  <div class="center">
    <p class="bold">ESCANEA PARA VERIFICAR</p>
    <div id="qrcode" style="margin: 10px auto;"></div>
  </div>
  <div class="separator"></div>
  
  <div class="center">
    <p>¡Gracias por viajar con nosotros!</p>
    <p>Conserve este tiquete hasta</p>
    <p>finalizar su viaje</p>
  </div>
  <div class="separator"></div>
  
  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
  <script>
    QRCode.toCanvas(document.createElement('canvas'), 'https://verify.transveloz.com/ticket/${data.numeroFactura}?cude=${data.cude.substring(0, 16)}', { width: 120 }, function(err, canvas) {
      if (!err) document.getElementById('qrcode').appendChild(canvas);
    });
  </script>
</body>
</html>`;
}

// ============================================
// ENVÍO DE DINERO RECEIPTS
// ============================================

// Format currency for envios
function formatEnvioCurrency(value: number): string {
  return `$${value.toLocaleString('es-CO')}`;
}

// Format date for envios
function formatEnvioDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Format time for envios
function formatEnvioTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

// Build ESC/POS byte array for envio receipt - supports remitente, conductor, and receptor
export function buildEnvioReciboBytes(envio: EnvioDinero, tipo: 'remitente' | 'conductor' | 'receptor'): Uint8Array {
  const parts: Uint8Array[] = [];
  
  const addCommand = (cmd: Uint8Array) => parts.push(cmd);
  const addText = (text: string) => parts.push(textToBytes(text));
  const addLine = () => addCommand(ESCPOSCommands.lineFeed);
  
  // Initialize
  addCommand(ESCPOSCommands.init);
  
  // === HEADER ===
  addCommand(ESCPOSCommands.alignCenter);
  addCommand(ESCPOSCommands.boldOn);
  addCommand(ESCPOSCommands.doubleSize);
  addText(EMPRESA_CONFIG.razonSocial);
  addLine();
  addCommand(ESCPOSCommands.normalSize);
  addCommand(ESCPOSCommands.boldOff);
  
  addText(`NIT: ${EMPRESA_CONFIG.nit}`);
  addLine();
  addText(EMPRESA_CONFIG.direccion);
  addLine();
  addText(`Tel: ${EMPRESA_CONFIG.telefono}`);
  addLine();
  addLine();
  
  // === TITLE ===
  addCommand(ESCPOSCommands.separator);
  addLine();
  addCommand(ESCPOSCommands.boldOn);
  addCommand(ESCPOSCommands.doubleHeight);
  
  if (tipo === 'receptor') {
    addText('RECIBO DE DINERO');
    addLine();
    addCommand(ESCPOSCommands.normalSize);
    addText('(COMPROBANTE ENTREGA)');
  } else {
    addText('RECIBO ENVÍO DE DINERO');
    addLine();
    addCommand(ESCPOSCommands.normalSize);
    addText(tipo === 'conductor' ? '(COPIA CONDUCTOR)' : '(COPIA CLIENTE)');
  }
  addLine();
  addCommand(ESCPOSCommands.boldOff);
  addCommand(ESCPOSCommands.separator);
  addLine();
  addLine();
  
  // === ENVIO INFO ===
  addCommand(ESCPOSCommands.alignLeft);
  addCommand(ESCPOSCommands.boldOn);
  addText(`No. Envío: ${envio.numeroEnvio}`);
  addLine();
  addCommand(ESCPOSCommands.boldOff);
  addText(`Fecha: ${formatEnvioDate(envio.fechaCreacion)}`);
  addLine();
  addText(`Hora: ${formatEnvioTime(envio.fechaCreacion)}`);
  addLine();
  addLine();
  
  // === TRANSPORTE INFO ===
  addCommand(ESCPOSCommands.alignCenter);
  addCommand(ESCPOSCommands.dottedSeparator);
  addLine();
  addCommand(ESCPOSCommands.boldOn);
  addText('DATOS DEL TRANSPORTE');
  addLine();
  addCommand(ESCPOSCommands.dottedSeparator);
  addLine();
  addCommand(ESCPOSCommands.boldOff);
  addCommand(ESCPOSCommands.alignLeft);
  addLine();
  
  addText(`Placa: ${envio.bus.placa}`);
  addLine();
  if (envio.bus.marca || envio.bus.modelo) {
    addText(`Vehículo: ${envio.bus.marca || ''} ${envio.bus.modelo || ''}`);
    addLine();
  }
  addText(`Hora Despacho: ${envio.horaDespacho}`);
  addLine();
  addText(`Conduce: ${envio.conductor.nombreCompleto}`);
  addLine();
  addText(`Lic: ${envio.conductor.licenciaNumero}`);
  addLine();
  addLine();
  
  // === REMITENTE ===
  addCommand(ESCPOSCommands.alignCenter);
  addCommand(ESCPOSCommands.dottedSeparator);
  addLine();
  addCommand(ESCPOSCommands.boldOn);
  addText('DATOS DEL REMITENTE');
  addLine();
  addCommand(ESCPOSCommands.dottedSeparator);
  addLine();
  addCommand(ESCPOSCommands.boldOff);
  addCommand(ESCPOSCommands.alignLeft);
  addLine();
  
  addText(`Nombre: ${envio.remitente.nombreCompleto}`);
  addLine();
  addText(`${envio.remitente.tipoDocumento}: ${envio.remitente.numeroDocumento}`);
  addLine();
  if (envio.remitente.telefono) {
    addText(`Tel: ${envio.remitente.telefono}`);
    addLine();
  }
  addLine();
  
  // === DESTINATARIO ===
  addCommand(ESCPOSCommands.alignCenter);
  addCommand(ESCPOSCommands.dottedSeparator);
  addLine();
  addCommand(ESCPOSCommands.boldOn);
  addText('DATOS DEL DESTINATARIO');
  addLine();
  addCommand(ESCPOSCommands.dottedSeparator);
  addLine();
  addCommand(ESCPOSCommands.boldOff);
  addCommand(ESCPOSCommands.alignLeft);
  addLine();
  
  addText(`Nombre: ${envio.destinatario.nombreCompleto}`);
  addLine();
  addText(`Doc: ${envio.destinatario.numeroDocumento}`);
  addLine();
  if (envio.destinatario.telefono) {
    addText(`Tel: ${envio.destinatario.telefono}`);
    addLine();
  }
  addText(`Ciudad: ${envio.municipioDestino.nombre}`);
  addLine();
  addLine();
  
  // === RECEPTOR (Solo en recibo receptor) ===
  if (tipo === 'receptor' && envio.receptor) {
    addCommand(ESCPOSCommands.alignCenter);
    addCommand(ESCPOSCommands.dottedSeparator);
    addLine();
    addCommand(ESCPOSCommands.boldOn);
    addText('RECIBIDO POR');
    addLine();
    addCommand(ESCPOSCommands.dottedSeparator);
    addLine();
    addCommand(ESCPOSCommands.boldOff);
    addCommand(ESCPOSCommands.alignLeft);
    addLine();
    
    addText(`Nombre: ${envio.receptor.nombreCompleto}`);
    addLine();
    addText(`Doc: ${envio.receptor.numeroDocumento}`);
    addLine();
    if (envio.receptor.telefono) {
      addText(`Tel: ${envio.receptor.telefono}`);
      addLine();
    }
    addText(`Fecha: ${formatEnvioDate(envio.receptor.fechaRecepcion)}`);
    addLine();
    addText(`Hora: ${formatEnvioTime(envio.receptor.fechaRecepcion)}`);
    addLine();
    addLine();
  }
  
  // === INFORMACIÓN FINANCIERA ===
  addCommand(ESCPOSCommands.alignCenter);
  addCommand(ESCPOSCommands.dottedSeparator);
  addLine();
  addCommand(ESCPOSCommands.boldOn);
  addText('DETALLE DEL ENVÍO');
  addLine();
  addCommand(ESCPOSCommands.dottedSeparator);
  addLine();
  addCommand(ESCPOSCommands.boldOff);
  addCommand(ESCPOSCommands.alignLeft);
  addLine();
  
  addText(`Origen: ${envio.municipioOrigen.nombre}`);
  addLine();
  addText(`Destino: ${envio.municipioDestino.nombre}`);
  addLine();
  addLine();
  
  addText(`Monto Enviado   ${formatEnvioCurrency(envio.monto)}`);
  addLine();
  addText(`Comisión (5%)   ${formatEnvioCurrency(envio.comision)}`);
  addLine();
  addCommand(ESCPOSCommands.separator);
  addLine();
  addCommand(ESCPOSCommands.boldOn);
  addCommand(ESCPOSCommands.doubleHeight);
  
  if (tipo === 'receptor') {
    addText(`MONTO RECIBIDO  ${formatEnvioCurrency(envio.monto)}`);
  } else {
    addText(`TOTAL    ${formatEnvioCurrency(envio.montoTotal)}`);
  }
  addLine();
  addCommand(ESCPOSCommands.normalSize);
  addCommand(ESCPOSCommands.boldOff);
  addCommand(ESCPOSCommands.separator);
  addLine();
  addLine();
  
  // === QR CODE ===
  addCommand(ESCPOSCommands.alignCenter);
  addCommand(ESCPOSCommands.boldOn);
  addText('ESCANEA PARA VERIFICAR');
  addLine();
  addCommand(ESCPOSCommands.boldOff);
  addLine();
  
  const qrData = `https://verify.transveloz.com/envio/${envio.numeroEnvio}`;
  addCommand(ESCPOSCommands.qrModel);
  addCommand(ESCPOSCommands.qrSize(6));
  addCommand(ESCPOSCommands.qrErrorCorrection);
  addCommand(ESCPOSCommands.qrStoreData(qrData));
  addCommand(ESCPOSCommands.qrPrint);
  addLine();
  addLine();
  
  // === FIRMA ===
  if (tipo === 'conductor' || tipo === 'receptor') {
    addCommand(ESCPOSCommands.alignCenter);
    addText('_____________________________');
    addLine();
    addText(tipo === 'conductor' ? 'Firma del Conductor' : 'Firma del Receptor');
    addLine();
    addLine();
  }
  
  // === FOOTER ===
  addCommand(ESCPOSCommands.alignCenter);
  addCommand(ESCPOSCommands.separator);
  addLine();
  if (tipo === 'remitente') {
    addText('¡Gracias por su confianza!');
    addLine();
    addText('Conserve este recibo como');
    addLine();
    addText('comprobante del envío');
  } else if (tipo === 'conductor') {
    addText('DOCUMENTO DEL CONDUCTOR');
    addLine();
    addText('Este recibo es responsabilidad');
    addLine();
    addText('del conductor hasta la entrega');
  } else {
    addText('COMPROBANTE DE ENTREGA');
    addLine();
    addText('El dinero ha sido entregado');
    addLine();
    addText('correctamente al receptor');
  }
  addLine();
  addCommand(ESCPOSCommands.separator);
  addLine();
  
  // Feed lines and cut
  addCommand(ESCPOSCommands.feedLines(8));
  addCommand(ESCPOSCommands.partialCut);
  
  // Combine all parts
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  
  return result;
}

// Generate printable HTML for envio receipt
export function generateEnvioReciboHTML(envio: EnvioDinero, tipo: 'remitente' | 'conductor' | 'receptor'): string {
  const getTitleText = () => {
    if (tipo === 'receptor') return 'RECIBO DE DINERO';
    return 'RECIBO ENVÍO DE DINERO';
  };
  
  const getSubtitleText = () => {
    if (tipo === 'receptor') return '(COMPROBANTE ENTREGA)';
    return tipo === 'conductor' ? '(COPIA CONDUCTOR)' : '(COPIA CLIENTE)';
  };
  
  const getFooterText = () => {
    if (tipo === 'remitente') {
      return `
        <p>¡Gracias por su confianza!</p>
        <p>Conserve este recibo como</p>
        <p>comprobante del envío</p>
      `;
    } else if (tipo === 'conductor') {
      return `
        <p>DOCUMENTO DEL CONDUCTOR</p>
        <p>Este recibo es responsabilidad</p>
        <p>del conductor hasta la entrega</p>
      `;
    } else {
      return `
        <p>COMPROBANTE DE ENTREGA</p>
        <p>El dinero ha sido entregado</p>
        <p>correctamente al receptor</p>
      `;
    }
  };
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Recibo Envío ${envio.numeroEnvio} - ${tipo === 'conductor' ? 'Conductor' : tipo === 'receptor' ? 'Receptor' : 'Cliente'}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      width: 72mm;
      margin: 4mm;
      line-height: 1.3;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .double { font-size: 16px; font-weight: bold; }
    .separator { border-top: 1px dashed #000; margin: 8px 0; }
    .total { font-size: 14px; font-weight: bold; }
    .small { font-size: 10px; }
    h1 { font-size: 14px; margin: 0; }
    h2 { font-size: 12px; margin: 8px 0 4px; }
    p { margin: 2px 0; }
    .row { display: flex; justify-content: space-between; }
    .signature { margin-top: 20px; border-top: 1px solid #000; width: 80%; margin-left: auto; margin-right: auto; padding-top: 5px; }
  </style>
</head>
<body>
  <div class="center">
    <h1>${EMPRESA_CONFIG.razonSocial}</h1>
    <p>NIT: ${EMPRESA_CONFIG.nit}</p>
    <p>${EMPRESA_CONFIG.direccion}</p>
    <p>Tel: ${EMPRESA_CONFIG.telefono}</p>
  </div>
  
  <div class="separator"></div>
  <div class="center bold">
    <p class="double">${getTitleText()}</p>
    <p>${getSubtitleText()}</p>
  </div>
  <div class="separator"></div>
  
  <p class="bold">No. Envío: ${envio.numeroEnvio}</p>
  <p>Fecha: ${formatEnvioDate(envio.fechaCreacion)}</p>
  <p>Hora: ${formatEnvioTime(envio.fechaCreacion)}</p>
  
  <div class="separator"></div>
  <h2 class="center">DATOS DEL TRANSPORTE</h2>
  <div class="separator"></div>
  
  <p><strong>Placa:</strong> ${envio.bus.placa}</p>
  ${envio.bus.marca || envio.bus.modelo ? `<p>Vehículo: ${envio.bus.marca || ''} ${envio.bus.modelo || ''}</p>` : ''}
  <p>Hora Despacho: ${envio.horaDespacho}</p>
  <p>Conduce: ${envio.conductor.nombreCompleto}</p>
  <p>Licencia: ${envio.conductor.licenciaNumero}</p>
  
  <div class="separator"></div>
  <h2 class="center">DATOS DEL REMITENTE</h2>
  <div class="separator"></div>
  
  <p>Nombre: ${envio.remitente.nombreCompleto}</p>
  <p>${envio.remitente.tipoDocumento}: ${envio.remitente.numeroDocumento}</p>
  ${envio.remitente.telefono ? `<p>Tel: ${envio.remitente.telefono}</p>` : ''}
  
  <div class="separator"></div>
  <h2 class="center">DATOS DEL DESTINATARIO</h2>
  <div class="separator"></div>
  
  <p>Nombre: ${envio.destinatario.nombreCompleto}</p>
  <p>Doc: ${envio.destinatario.numeroDocumento}</p>
  ${envio.destinatario.telefono ? `<p>Tel: ${envio.destinatario.telefono}</p>` : ''}
  <p>Ciudad: ${envio.municipioDestino.nombre}</p>
  
  ${tipo === 'receptor' && envio.receptor ? `
  <div class="separator"></div>
  <h2 class="center">RECIBIDO POR</h2>
  <div class="separator"></div>
  
  <p><strong>Nombre:</strong> ${envio.receptor.nombreCompleto}</p>
  <p>Doc: ${envio.receptor.numeroDocumento}</p>
  ${envio.receptor.telefono ? `<p>Tel: ${envio.receptor.telefono}</p>` : ''}
  <p>Fecha: ${formatEnvioDate(envio.receptor.fechaRecepcion)}</p>
  <p>Hora: ${formatEnvioTime(envio.receptor.fechaRecepcion)}</p>
  ` : ''}
  
  <div class="separator"></div>
  <h2 class="center">DETALLE DEL ENVÍO</h2>
  <div class="separator"></div>
  
  <p>Origen: ${envio.municipioOrigen.nombre}</p>
  <p>Destino: ${envio.municipioDestino.nombre}</p>
  
  <div class="row">
    <span>Monto Enviado</span>
    <span>${formatEnvioCurrency(envio.monto)}</span>
  </div>
  <div class="row">
    <span>Comisión (5%)</span>
    <span>${formatEnvioCurrency(envio.comision)}</span>
  </div>
  <div class="separator"></div>
  <div class="row total">
    <span>${tipo === 'receptor' ? 'MONTO RECIBIDO' : 'TOTAL'}</span>
    <span>${tipo === 'receptor' ? formatEnvioCurrency(envio.monto) : formatEnvioCurrency(envio.montoTotal)}</span>
  </div>
  <div class="separator"></div>
  
  <div class="center">
    <p class="bold">ESCANEA PARA VERIFICAR</p>
    <div id="qrcode" style="margin: 10px auto;"></div>
  </div>
  
  ${tipo === 'conductor' || tipo === 'receptor' ? `
  <div class="signature center">
    <p>${tipo === 'conductor' ? 'Firma del Conductor' : 'Firma del Receptor'}</p>
  </div>
  ` : ''}
  
  <div class="separator"></div>
  <div class="center">
    ${getFooterText()}
  </div>
  <div class="separator"></div>
  
  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
  <script>
    QRCode.toCanvas(document.createElement('canvas'), 'https://verify.transveloz.com/envio/${envio.numeroEnvio}', { width: 120 }, function(err, canvas) {
      if (!err) document.getElementById('qrcode').appendChild(canvas);
    });
  </script>
</body>
</html>`;
}
