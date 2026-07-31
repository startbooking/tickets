// Códigos de control ESC/POS básicos (Hexadecimal / Decimal)
const ESC = '\x1b';
const GS = '\x1d';

export const ESC_POS = {
  RESET: `${ESC}@`,
  ALIGN_LEFT: `${ESC}a0`,
  ALIGN_CENTER: `${ESC}a1`,
  ALIGN_RIGHT: `${ESC}a2`,
  BOLD_ON: `${ESC}E1`,
  BOLD_OFF: `${ESC}E0`,
  DOUBLE_SIZE: `${GS}!11`, // Texto grande para el número de tiquete
  NORMAL_SIZE: `${GS}!00`,
  CUT: `${ESC}d2${GS}V1`,  // Avanza 2 líneas y corta (si la impresora tiene autocutter)
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
}

export function generateTicketTXT(data: TicketData): string {
  let t = "";
  
  t += ESC_POS.RESET;
  t += ESC_POS.ALIGN_CENTER;
  t += ESC_POS.BOLD_ON;
  t += `${data.empresa}\n`;
  t += ESC_POS.DOUBLE_SIZE;
  t += `TIQUETE: ${data.consecutivo}\n`;
  t += ESC_POS.NORMAL_SIZE;
  t += ESC_POS.BOLD_OFF;
  t += "--------------------------------\n"; // 32 caracteres (estándar 58mm)
  
  t += ESC_POS.ALIGN_LEFT;
  t += `Fecha: ${data.fecha}   Hora: ${data.hora}\n`;
  t += `Origen:  ${data.origen.toUpperCase()}\n`;
  t += `Destino: ${data.destino.toUpperCase()}\n`;
  t += `Asiento: ${data.asiento} \n`;
  t += `Pasajero: ${data.pasajero}\n`;
  t += "--------------------------------\n";
  
  t += ESC_POS.ALIGN_RIGHT;
  t += ESC_POS.BOLD_ON;
  t += `TOTAL: $${data.valor.toLocaleString('es-CO')}\n`;
  t += ESC_POS.BOLD_OFF;
  
  t += ESC_POS.ALIGN_CENTER;
  t += "\n¡Buen Viaje!\n\n\n";
  t += ESC_POS.CUT;
  
  return t;
}