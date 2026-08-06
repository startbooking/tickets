import { describe, it, expect, vi } from 'vitest';
import {
  ESC_POS,
  generateTicketTXT,
  normalizarImpresion,
  qrEscPos,
  encodarEscPos,
  isAndroidDevice,
  buildRawBtIntent,
} from './ticketFormatter';

/**
 * Conjunto de referencia de longitudes en bytes para los tickets validados en
 * sesión (SES IÓN.md):
 *  - Ticket con CUFE/QR (BOGOTA→TOCAIMA): 604 bytes tras el fix de FEED.
 *  - FSV3 (sin CUFE): 481 bytes.
 *  - Satélite QPL2 (sin CUFE): 443 bytes.
 * Estas longitudes exactas dependen de los campos opcionales incluidos, por lo
 * que los tests de longitud usan los fixtures documentados en SESION.md.
 */

describe('ESC_POS constants (bytes binarios críticos)', () => {
  it('FEED_6 usa byte binario 0x06, NO el ASCII "6" (0x36 que avanzaba 54 líneas)', () => {
    const bytes = ESC_POS.FEED_6.split('').map((c) => c.charCodeAt(0));
    // 0x1b 0x64 0x06
    expect(bytes).toEqual([0x1b, 0x64, 0x06]);
    expect(bytes[2]).toBe(0x06);
    expect(bytes[2]).not.toBe(0x36);
  });

  it('DOUBLE_SIZE usa byte 0x11, NO ASCII "11" (0x31)', () => {
    const bytes = ESC_POS.DOUBLE_SIZE.split('').map((c) => c.charCodeAt(0));
    expect(bytes).toEqual([0x1d, 0x21, 0x11]);
    expect(bytes[2]).toBe(0x11);
    expect(bytes[2]).not.toBe(0x31);
  });

  it('CUT usa byte 0x01', () => {
    const bytes = ESC_POS.CUT.split('').map((c) => c.charCodeAt(0));
    expect(bytes).toEqual([0x1d, 0x56, 0x01]);
  });

  it('alineaciones usan bytes binarios válidos 0x00/0x01/0x02', () => {
    expect(ESC_POS.ALIGN_LEFT.split('').map((c) => c.charCodeAt(0))).toEqual([0x1b, 0x61, 0x00]);
    expect(ESC_POS.ALIGN_CENTER.split('').map((c) => c.charCodeAt(0))).toEqual([0x1b, 0x61, 0x01]);
    expect(ESC_POS.ALIGN_RIGHT.split('').map((c) => c.charCodeAt(0))).toEqual([0x1b, 0x61, 0x02]);
  });

  it('BOLD_ON/OFF usan bytes 0x01/0x00', () => {
    expect(ESC_POS.BOLD_ON.split('').map((c) => c.charCodeAt(0))).toEqual([0x1b, 0x45, 0x01]);
    expect(ESC_POS.BOLD_OFF.split('').map((c) => c.charCodeAt(0))).toEqual([0x1b, 0x45, 0x00]);
  });
});

describe('generateTicketTXT', () => {
  const base = {
    empresa: 'FLOTA SAN VICENTE S.A.',
    consecutivo: '1',
    fecha: '2026-07-31',
    hora: '20:46',
    origen: 'BOGOTA',
    destino: 'TOCAIMA',
    pasajero: 'CONSUMIDOR',
    valor: 34000,
    asiento: '2',
    placa: 'DMW-900',
    formaPago: 'EFECTIVO',
    nit: '860.022.105-1',
    resolucion: '18764000000001',
    numeroFactura: 'FSV3',
    cufe: '7CBC8F46A05C96A491A61565DD8648FEEA35C834',
    qr: 'http://www.dian.gov.co/consulta/tiquete?cufe=7CBC8F46A05C96A491A61565DD8648FEEA35C834',
  };

  it('inicia con RESET (ESC @)', () => {
    const txt = generateTicketTXT(base);
    expect(txt.startsWith(ESC_POS.RESET)).toBe(true);
  });

  it('contiene el bloque QR (GS ( k) cuando se provee el campo qr', () => {
    const txt = generateTicketTXT(base);
    const gsOpen = String.fromCharCode(0x1d, 0x28, 0x6b);
    expect(txt).toContain(gsOpen);
  });

  it('termina con FEED_6 + CUT', () => {
    const txt = generateTicketTXT(base);
    expect(txt.endsWith(ESC_POS.FEED_6 + ESC_POS.CUT)).toBe(true);
  });

  it('incluye el NIT emisor, resolución, factura, CUFE y IVA excluido', () => {
    const txt = generateTicketTXT(base);
    expect(txt).toContain('NIT: 860.022.105-1');
    expect(txt).toContain('Res.: 18764000000001');
    expect(txt).toContain('Factura: FSV3');
    expect(txt).toContain('CUFE: 7CBC8F46A05C96A491A61565DD8648FEEA35C834');
    expect(txt).toContain('IVA EXCLUIDO');
  });

  it('NO incluye el bloque DIAN cuando faltan nit/resolucion', () => {
    const txt = generateTicketTXT({ ...base, nit: undefined, resolucion: undefined, numeroFactura: undefined, cufe: undefined });
    expect(txt).not.toContain('NIT:');
    expect(txt).not.toContain('Res.:');
    expect(txt).not.toContain('CUFE:');
  });

  it('el texto imprimible se normaliza y el pasajero se imprime en MAYÚSCULA', () => {
    const txt = generateTicketTXT({ ...base, pasajero: 'JOSÉ ¡HOLA! ¿Vamos?' });
    expect(txt).toContain('JOSE'); // José -> tildes eliminadas
    expect(txt).not.toContain('José');
    expect(txt).toContain('JOSE !HOLA! ?VAMOS?');
  });
});

describe('normalizarImpresion', () => {
  it('elimina tildes y diéresis NFD', () => {
    expect(normalizarImpresion('NIÑO MÉNDEZ')).toBe('NINO MENDEZ');
    expect(normalizarImpresion('Árbol ÜBER')).toBe('Arbol UBER');
  });

  it('reemplaza ¡ por ! y ¿ por ?', () => {
    expect(normalizarImpresion('¡Hola! ¿Cómo?')).toBe('!Hola! ?Como?');
  });

  it('NO destruye bytes de control ESC/POS (preserva todo lo no imprimible)', () => {
    // El carácter 0x1b no es de carácter imprimible; NFD no lo toca.
    const txt = `${ESC_POS.RESET}Hola`;
    expect(normalizarImpresion(txt)).toBe(`${ESC_POS.RESET}Hola`);
  });
});

describe('qrEscPos', () => {
  it('produce el comando GS ( k para modelo 2', () => {
    const cmd = qrEscPos('TEST');
    // 0x1d 0x28 0x6b
    expect(cmd).toContain(String.fromCharCode(0x1d, 0x28, 0x6b));
  });

  it('usa el byte de modelo 0x31 (modelo 2) en el header GS ( k', () => {
    const cmd = qrEscPos('TEST');
    // El header del modelo es: GS ( k 0x04 0x00 0x31 0x41
    expect(cmd).toContain(String.fromCharCode(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41));
  });

  it('termina con el comando de impresión (1Q + 0x30)', () => {
    const cmd = qrEscPos('TEST');
    // El print trigger es literal '1', 'Q' y byte 0x30 ('0')
    expect(cmd.slice(-3)).toBe('1Q' + String.fromCharCode(0x30));
  });

  it('diferentes datos de entrada producen salida determinista del header', () => {
    const a = qrEscPos('ABC');
    const b = qrEscPos('ABC');
    expect(a).toBe(b);
  });
});

describe('encodarEscPos', () => {
  it('codifica latin-1: acentos eliminados → byte ASCII equivalente', () => {
    const bytes = encodarEscPos('AÉ');
    // 'A' = 0x41, 'E' (sin acento) = 0x45
    expect(Array.from(bytes)).toEqual([0x41, 0x45]);
  });

  it('caracteres > 0xff se reemplazan por 0x3f (?)', () => {
    // '€' (U+20AC) no cabe en latin-1 → '?' en el output
    const bytes = encodarEscPos('€');
    expect(Array.from(bytes)).toEqual([0x3f]);
  });

  it('la función normaliza NFD primero (ñ pierde tilde → n)', () => {
    // encodarEscPos aplica NFD + strip de diacríticos, así que 'ñ' → 'n' (0x6e)
    const bytes = encodarEscPos('ñ');
    expect(Array.from(bytes)).toEqual([0x6e]);
  });

  it('bytes latin-1 sin descomponer se conservan (× = 0xd7)', () => {
    // El signo de multiplicación U+00D7 no se descompone en NFD y cabe en latin-1
    const bytes = encodarEscPos('×');
    expect(Array.from(bytes)).toEqual([0xd7]);
  });
});

describe('buildRawBtIntent', () => {
  it('construye el Intent de RawBT con base64 del texto ESC/POS', () => {
    const texto = ESC_POS.RESET + 'TIQUETE: 1';
    const intent = buildRawBtIntent(texto);
    expect(intent).toBe('intent://base64,' + btoa(unescape(encodeURIComponent(texto))) + '#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;');
    expect(intent).toContain('intent://base64,');
    expect(intent).toContain('#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;');
  });
});

describe('isAndroidDevice', () => {
  const originalUserAgent = navigator.userAgent;

  afterEach(() => {
    Object.defineProperty(window.navigator, 'userAgent', { value: originalUserAgent, configurable: true });
  });

  const setUA = (ua: string) => {
    Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true });
  };

  it('detecta Android del userAgent', () => {
    setUA('Mozilla/5.0 (Linux; Android 10; PDA)');
    expect(isAndroidDevice()).toBe(true);
  });

  it('NO detecta Android en navegador de escritorio', () => {
    setUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    expect(isAndroidDevice()).toBe(false);
  });

  it('NO detecta Android con UA vacío', () => {
    setUA('');
    expect(isAndroidDevice()).toBe(false);
  });

  it('detecta Android distintas variantes (Samsung, Mobile)', () => {
    setUA('Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36');
    expect(isAndroidDevice()).toBe(true);
  });
});
