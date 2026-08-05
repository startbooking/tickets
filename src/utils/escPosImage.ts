/**
 * escPosImage
 *
 * Utilidad para convertir una imagen (JPEG/PNG) a comandos ESC/POS
 * (GS v 0) para impresoras térmicas. Se usa para imprimir el logo
 * del tiquete en impresoras que no soportan gráficos vía window.print.
 */

const GS = '\x1d';
const ESC = '\x1b';

/** Ancho máximo en píxeles para impresoras térmicas de 58 mm (80 mm = 576 px). */
const MAX_ANCHO_IMPRESOR = 384;

/**
 * Carga una imagen desde una URL y la devuelve como HTMLImageElement.
 */
function cargarImagen(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Convierte una imagen a un bitmap 1-bit (blanco/negro) usando
 * umbral simple (threshold dithering) y devuelve los bytes en formato
 * ESC/POS GS v 0 (raster format 0, 8 dots).
 *
 * El ancho se ajusta a MAX_ANCHO_IMPRESOR (384 px) manteniendo la proporción.
 *
 * @param url    URL pública de la imagen (ej: "/images/logo_tiquete.jpg").
 * @param anchoMax Ancho objetivo en píxeles (default 384 para impresoras 58 mm).
 * @returns String ESC/POS con los comandos de impresión de bitmap.
 */
export async function imagenAEscPos(
  url: string,
  anchoMax: number = MAX_ANCHO_IMPRESOR
): Promise<string> {
  const img = await cargarImagen(url);

  // Calcular dimensiones manteniendo proporción
  let w = img.width;
  let h = img.height;
  if (w > anchoMax) {
    const ratio = anchoMax / w;
    w = anchoMax;
    h = Math.round(h * ratio);
  }

  // Dibujar en canvas y convertir a gris
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // Convertir a bitmap 1-bit: cada píxel es 1 bit (0=negro, 1=blanco en formato raster)
  // El ancho en bytes es ceil(w / 8)
  const anchoBytes = Math.ceil(w / 8);

  // Construir los datos de bitmap
  const bitmapData = new Uint8Array(anchoBytes * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x);
      const pixelIdx = idx * 4;
      // Convertir a gris: promedio simple
      const gris = (data[pixelIdx] + data[pixelIdx + 1] + data[pixelIdx + 2]) / 3;
      // Umbral: 128 es el punto medio (0-255)
      // En ESC/POS raster: 1 = blanco, 0 = negro
      if (gris < 128) {
        // Negro: setear el bit a 0 (que significa 0 en el byte, pero necesitamos
        // que el bit esté "encendido" en posición. En formato raster:
        // bit=1 significa negro, bit=0 significa blanco
        const byteIdx = Math.floor(x / 8);
        const bitIdx = 7 - (x % 8);
        bitmapData[y * anchoBytes + byteIdx] |= (1 << bitIdx);
      }
    }
  }

  // Generar comando GS v 0 (Format: GS v 0 m xL xH yL yH [data])
  // m = 0 (8-dot single-density)
  const cmd = GS + 'v' + String.fromCharCode(48) + String.fromCharCode(0) +
    String.fromCharCode(anchoBytes & 0xff) + String.fromCharCode((anchoBytes >> 8) & 0xff) +
    String.fromCharCode(h & 0xff) + String.fromCharCode((h >> 8) & 0xff);

  // Concatenar los bytes del bitmap como string
  let bitmapStr = '';
  for (let i = 0; i < bitmapData.length; i++) {
    bitmapStr += String.fromCharCode(bitmapData[i]);
  }

  // Seleccionar modo de impresión de bitmap y volver a texto
  const reset = ESC + '!' + String.fromCharCode(0); // Tamaño normal
  return cmd + bitmapStr + ' ' + reset; // Espacio después del bitmap
}

/**
 * Versión memoizada: carga el logo una sola vez y reutiliza el bitmap
 * generado en memoria. Ideal para múltiples impresiones durante la partida.
 */
let logoCache: string | null = null;

export async function obtenerLogoEscPos(
  url: string = '/images/logo_tiquete.jpg',
  anchoMax: number = MAX_ANCHO_IMPRESOR
): Promise<string> {
  if (logoCache === null) {
    logoCache = await imagenAEscPos(url, anchoMax);
  }
  return logoCache;
}

/** Invalida la caché del logo (forzar recarga en siguiente llamada). */
export function limpiarCacheLogo(): void {
  logoCache = null;
}
