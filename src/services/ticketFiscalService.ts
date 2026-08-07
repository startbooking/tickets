/**
 * ticketFiscalService
 *
 * Lógica de impresión e emisión fiscal COMPARTIDA entre el CajeroDashboard
 * (taquilla fija) y el SateliteDashboard (agencia satélite / móvil).
 *
 * Antes de esta refactorización, `imprimirTiquete`, `construirPayloadDian` y el
 * flujo de emisión DIAN estaban duplicados — casi idénticos — en ambos panels.
 * Este módulo expone funciones puras (sin efectos secundarios) que ambos
 * consumen; el hook `useTicketFiscal` (ver ../hooks/useTicketFiscal.ts) envuelve
 * estas funciones con los efectos secundarios (auth, USB, BLE, RawBT, print).
 */

import { generateTicketTXT } from '@/utils/ticketFormatter';
import { ESC_POS, normalizarImpresion } from '@/utils/ticketFormatter';
import { formatHora, splitNombreCompleto } from '@/services/travelsoftService';
import type { TicketVenta, TurnoSateliteVenta, ManifiestoDespacho } from '@/services/travelsoftService';
import type { TiqueteTransporteDTO } from '@/types';

// ─── Constantes fiscales operativas ───────────────────────────────────────────

/** NIT emisor registrado en la DIAN para Flota San Vicente S.A. */
export const EMPRESA_NIT = '860.022.105-1';
/** Razón social impresa en el encabezado del tiquete. */
export const EMPRESA_NOMBRE = 'FLOTA SAN VICENTE S.A.';
/** Dirección de la empresa (encabezado del tiquete). */
export const EMPRESA_DIRECCION = 'Calle 24 A No. 44-35, Quinta Paredes, Bogotá D.C.';
/** Teléfono PBX de contacto (encabezado del tiquete). */
export const EMPRESA_TELEFONO = '(601) 368 2390';
/** Página web de la empresa (encabezado del tiquete). */
export const EMPRESA_WEB = 'www.flotasanvicente.co';
/** Correo institucional de la empresa (encabezado y párrafo de contacto). */
export const EMPRESA_EMAIL = 'fsv@flotasanvicente.co';
/** Tipo de régimen de la empresa de transporte (encabezado del tiquete). */
export const EMPRESA_REGIMEN = 'Regimen Comun';
/** Documento usado como marcador cuando el pasajero no provee identificación. */
export const DOCUMENTO_CONSUMIDOR = '222222222222';
/** Tipo de documento DIAN que representa a un "Consumidor Final". */
export const TIPO_DOC_CONSUMIDOR = '14';
/** Tipo de documento DIAN para personas con identificación real. */
export const TIPO_DOC_PERSONA = '13';
/** CUFE mock para pruebas offline (el Core DIAN otorga el real en producción). */
export const CUFE_MOCK = '7CBC8F46A05C96A491A61565DD8648FEEA35C834';

/**
 * Contexto fiscal operativo: datos del usuario autenticado necesarios para
 * construir el payload DIAN. Se inyecta explícitamente para que las funciones
 * puras sigan siendo testeables sin depender del AuthContext.
 */
export interface FiscalContext {
  id_orides?: number | null;
  id?: number | null;
  rol?: string | null;
  empresaToken?: string;
}

/**
 * Construye el JSON estructurado para la homologación electrónica ante la DIAN.
 * Reúne los datos del viaje, del pasajero y los de la resolución local (que el
 * backend ya asoció a la venta) para que el Core emita CUFE + QR.
 */
export function construirPayloadDian(t: TicketVenta, ctx: FiscalContext = {}): TiqueteTransporteDTO {
  const partes = splitNombreCompleto(t.pasajero.nombre);
  const token = ctx.empresaToken ?? import.meta.env.VITE_EMPRESA_TOKEN;
  const esConsumidor = t.pasajero.documento === DOCUMENTO_CONSUMIDOR;

const cantidad = t.cantidad || t.puestos?.length || 1;
  const unitario = t.valor ?? 0;
  const sillas = (t.sillas?.length ? t.sillas : t.puestos?.length ? t.puestos : null) ?? [t.puesto];
  const rowCount = sillas.length;

  // Separación NIT + DV, p. ej. 860.022.105-1 -> nit 860022105, dv 1
  const nitLimpio = (t.nit_emisor || EMPRESA_NIT).replace(/[^0-9]/g, '');
  const dv = nitLimpio.slice(-1);
  const nit = nitLimpio.slice(0, -1);

  const numeroFactura = t.numero_factura || '';
  const prefijo = numeroFactura.replace(/[0-9]/g, '') || undefined;
  const numeroConsecutivo = Number(numeroFactura.replace(/[^0-9]/g, '')) || undefined;
  const municipio = t.municipio || t.origen || '';
  const ori = t.origen || '';
  const des = t.destino || '';
  const agencia = t.origen || t.municipio || '';
  const tipoVenta =
    t.fecha_venta ? (t.fecha_venta.split(' ')[0] === t.fecha_ruta ? 'PARA HOY' : 'RESERVA') : 'PARA HOY';
  const cufe = t.cufe || CUFE_MOCK;
  const horaSalida = t.hora_ruta != null ? formatHora(t.hora_ruta) : (t.hora_tiquete || '');
  const qrData =
    `Numpool=${numeroFactura}&Fec=${t.fecha_ruta}&Hora=${horaSalida}&ValFac=${(unitario * rowCount).toFixed(2)}` +
    `&ValIva=0.00&ValOtroIm=0.00&ValTotal=${(unitario * rowCount).toFixed(2)}&NitFac=${nit}` +
    `&DocAdq=${t.pasajero.documento}&CUFE=${cufe}`;

  return {
    tipoDocumento: '21',
    descripcionTipoDocumento: 'Documento Equivalente Electrónico Tiquete de Transporte de Pasajeros',
    versionEstructura: '1.0',
    ambiente: '1',
    prefijo,
    numeroConsecutivo,
    cude: cufe,
    cufe,
    fechaEmision: t.fecha_ruta,
    horaEmision: horaSalida + '-05:00',
    divisa: 'COP',
    formaPago: formaPagoDian(t.forma_pago),
    medioPago: '48',
    emisor: {
      nit,
      dv,
      razonSocial: EMPRESA_NOMBRE,
      nombreComercial: 'FLOTA SAN VICENTE',
      tipoOrganizacion: '1',
      regimenTributario: '48',
      responsabilidadFiscal: 'O-13;O-15;O-47',
      direccion: {
        municipioNombre: agencia || municipio,
        direccion: EMPRESA_DIRECCION,
      },
      contacto: {
        telefono: EMPRESA_TELEFONO,
        email: EMPRESA_EMAIL,
      },
    },
    adquirente: {
      tipoIdentificacion: esConsumidor ? TIPO_DOC_CONSUMIDOR : TIPO_DOC_PERSONA,
      numeroIdentificacion: t.pasajero.documento,
      nombres: partes.nombres,
      apellidos: partes.apellidos,
      direccion: { municipioNombre: municipio },
      contacto: {
        telefono: t.pasajero.telefono || '+5700000000000',
        email: t.pasajero.correo || 'tickets@sactel.net',
      },
    },
    detallesServicioTransporte: {
      modoTransporte: 'Terrestre',
      tipoServicio: 'Pasajeros Intermunicipal',
      origen: { nombre: ori },
      destino: { nombre: des },
      vehiculo: {
        placa: t.placa_vehi || '',
        numeroInterno: t.numero_operacion != null ? String(t.numero_operacion) : String(t.id_planilla ?? ''),
        empresaAfiliada: EMPRESA_NOMBRE,
        nitEmpresaAfiliada: nit,
      },
      viaje: {
        fechaSalida: t.fecha_ruta,
        horaSalida,
        puestos: sillas.join(','),
        numeroPuestos: rowCount,
      },
    },
    lineasDetalle: sillas.map((asiento, idx) => ({
      numeroLinea: idx + 1,
      codigoProducto: 'SERV-TRP-PAS',
      descripcion: `Tiquete de transporte terrestre intermunicipal ${ori} - ${des} (silla ${asiento})`,
      cantidad: 1,
      unidadMedida: '94',
      valorUnitario: unitario,
      descuento: 0,
      subtotal: unitario,
      impuestos: [],
      totalLinea: unitario,
    })),
    totales: {
      lineasTotal: unitario * rowCount,
      subtotalBruto: unitario * rowCount,
      totalDescuentos: 0,
      totalCargos: 0,
      totalImpuestos: 0,
      totalPagar: unitario * rowCount,
    },
    informacionRepresentacionGrafica: {
      qrData,
      urlValidacionDian: cufe
        ? `https://catalogo-vp-fe.dian.gov.co/document/searchqr?documentkey=${cufe}`
        : undefined,
    },
    // Metadata operativa (no fiscal) para el Core SACTel.
    datos_emisor: { token_empresa: token, id_agencia: Number(ctx.id_orides) || undefined },
    datos_viaje: {
      id_interno_viaje: t.id_planilla,
      origen: ori,
      destino: des,
      placa_vehiculo: t.placa_vehi || '',
      numero_asiento: sillas[0],
      valor_tiquete: unitario,
    },
    agencia,
    numero_operacion: t.numero_operacion ?? t.id_planilla,
    tipo_venta: tipoVenta,
    tipo_transporte: 'Terrestre',
    elaborado: t.cajero_nombre || t.cajero,
  };
}

/** Mapea la forma de pago interna (EFECTIVO/TARJETA/QR) al código DIAN de forma de pago. */
function formaPagoDian(forma?: string): string {
  const f = (forma || '').toUpperCase();
  if (f === 'TARJETA') return '2';
  if (f === 'QR') return '2';
  return '1';
}

/**
 * Genera el texto ESC/POS listo para imprimir a partir de un tiquete recién vendido.
 * El tiquete ya contiene la numeración de la resolución local; si la DIAN autorizó,
 * incluye cufe + QR.
 */
export function ticketATextoImpresion(t: TicketVenta): string {
  const sillas = (t.sillas?.length ? t.sillas : t.puestos?.length ? t.puestos : null) ?? [t.puesto];
  return generateTicketTXT({
    empresa: EMPRESA_NOMBRE,
    nit: EMPRESA_NIT,
    direccion: EMPRESA_DIRECCION,
    telefono: EMPRESA_TELEFONO,
    web: EMPRESA_WEB,
    regimen: EMPRESA_REGIMEN,
    consecutivo: String(t.consecutivo_pasajero),
    fecha: t.fecha_ruta,
    hora: t.hora_ruta != null ? formatHora(t.hora_ruta) : (t.hora_tiquete || ''),
    fechaVenta: t.fecha_venta,
    origen: t.origen || '',
    destino: t.destino || '',
    municipio: t.municipio || undefined,
    pasajero: t.pasajero.nombre,
    documento: t.pasajero.documento,
    asiento: String(t.puesto),
    asientos: sillas.map(String),
    cantidad: t.cantidad,
    valor: t.valor ?? 0,
    total: t.total,
    placa: t.placa_vehi || undefined,
    tipoVehi: t.tipo_vehi || undefined,
    marcaVehi: t.marca_vehi || undefined,
    tipoServicio: t.tipo_servicio || undefined,
    formaPago: t.forma_pago,
    resolucion: t.resolucion_numero,
    numeroFactura: t.numero_factura,
    cufe: t.cufe,
    qr: t.qr_dian || t.qr_code_url,
    agencia: (t.origen || t.municipio || '').trim() || undefined,
    operacion: t.numero_operacion ?? t.id_planilla,
    tipoVenta:
      t.fecha_venta ? (t.fecha_venta.split(' ')[0] === t.fecha_ruta ? 'PARA HOY' : 'RESERVA') : undefined,
    tipoTransporte: 'Terrestre',
    elaboro: t.cajero_nombre || t.cajero || undefined,
    mensaje: t.mensaje || undefined,
  });
}

/**
 * Genera el texto ESC/POS para REIMPRIMIR un ticket ya persistido en el turno
 * de la agencia satélite (TurnoSateliteVenta). Los campos provienen del resumen
 * local guardado en localStorage, por lo que se pasan tal cual.
 */
export function ventaATextoImpresion(v: TurnoSateliteVenta): string {
  return generateTicketTXT({
    empresa: EMPRESA_NOMBRE,
    nit: EMPRESA_NIT,
    direccion: EMPRESA_DIRECCION,
    telefono: EMPRESA_TELEFONO,
    web: EMPRESA_WEB,
    regimen: EMPRESA_REGIMEN,
    consecutivo: String(v.consecutivo),
    fecha: v.fecha_ruta,
    hora: v.hora,
    fechaVenta: [v.fecha_ruta, v.hora].filter(Boolean).join(' ') || undefined,
    origen: v.origen,
    destino: v.destino,
    pasajero: v.pasajero,
    documento: v.documento || '',
    asiento: String(v.asiento),
    valor: v.valor,
    placa: v.placa || undefined,
    formaPago: v.forma_pago,
    resolucion: v.resolucion_numero,
    numeroFactura: v.numero_factura,
    cufe: v.cufe,
    qr: v.qr_dian,
    mensaje: v.mensaje || undefined,
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Manifiesto de despacho
// Genera 2 documentos ESC/POS:
//   A. LISTADO DE PASAJEROS ordenado por número de silla.
//   B. DOCUMENTO DE DESPACHO: total de pasajeros, datos del vehículo,
//      conductores, auxiliar, origen/destino y total de la venta del cajero.
// ────────────────────────────────────────────────────────────────────────────

/** Dato mínimo requerido para imprimir la cabecera común de los manifiestos. */
export interface ManifiestoCabecera {
  placa_vehi?: string | null;
  origen?: string | null;
  destino?: string | null;
  hora_ruta?: number | null;
  hora_despacho?: string | null;
  cod_ruta?: number | null;
  fecha_ruta?: string | null;
}

function manifiestoEncabezado(m: ManifiestoCabecera): string {
  let t = ESC_POS.RESET;
  t += ESC_POS.ALIGN_CENTER;
  t += ESC_POS.BOLD_ON;
  t += normalizarImpresion(`${EMPRESA_NOMBRE}\n`);
  t += ESC_POS.BOLD_OFF;
  t += normalizarImpresion(`NIT: ${EMPRESA_NIT}\n`);
  t += ESC_POS.DOUBLE_SIZE;
  t += normalizarImpresion('MANIFIESTO DE DESPACHO\n');
  t += ESC_POS.NORMAL_SIZE;
  t += normalizarImpresion(`${separadorDoble()}\n`);
  t += ESC_POS.ALIGN_LEFT;
  if (m.cod_ruta) t += normalizarImpresion(`Ruta: ${m.cod_ruta}\n`);
  if (m.fecha_ruta) t += normalizarImpresion(`Fecha: ${m.fecha_ruta}\n`);
  if (m.hora_ruta != null) t += normalizarImpresion(`Hora Ruta: ${formatHora(m.hora_ruta)}\n`);
  if (m.hora_despacho) t += normalizarImpresion(`Hora Despacho: ${m.hora_despacho}\n`);
  t += normalizarImpresion(`Origen: ${m.origen || '-'}\n`);
  t += normalizarImpresion(`Destino: ${m.destino || '-'}\n`);
  return t;
}

function separadorDoble(): string {
  return '════════════════════════════';
}

/**
 * Documento A — Listado de pasajeros ordenado por número de silla.
 */
export function manifiestoListadoTexto(m: ManifiestoDespacho): string {
  let t = manifiestoEncabezado(m);
  t += ESC_POS.ALIGN_LEFT;
  t += normalizarImpresion('────────────────────────────\n');
  t += ESC_POS.ALIGN_CENTER;
  t += ESC_POS.BOLD_ON;
  t += normalizarImpresion('LISTADO DE PASAJEROS\n');
  t += ESC_POS.BOLD_OFF;
  t += ESC_POS.ALIGN_LEFT;
  t += normalizarImpresion(`${separadorDoble()}\n`);
  for (const p of m.pasajeros) {
    const silla = p.puesto != null ? String(p.puesto).padStart(2, ' ') : '--';
    const nombre = (p.nombre || '').trim() || 'SIN NOMBRE';
    const valor = p.valor != null ? `$${(p.valor).toLocaleString('es-CO')}` : '$0';
    const pago = p.forma_pago || '';
    t += normalizarImpresion(`SILLA ${silla}   ${nombre}\n`);
    t += normalizarImpresion(`   ${valor} ${pago}\n`);
  }
  t += normalizarImpresion(`${separadorDoble()}\n`);
  t += ESC_POS.ALIGN_CENTER;
  t += ESC_POS.BOLD_ON;
  t += normalizarImpresion(`TOTAL PASAJEROS: ${m.totales.pasajeros}\n`);
  t += ESC_POS.BOLD_OFF;
  t += ESC_POS.ALIGN_LEFT;
  t += ESC_POS.BOLD_ON;
  t += normalizarImpresion(`TOTAL VENTA CAJERO: $${m.totales.total_venta_cajero.toLocaleString('es-CO')}\n`);
  t += ESC_POS.BOLD_OFF;
  t += ESC_POS.FEED_6;
  t += ESC_POS.CUT;
  return t;
}

/**
 * Documento B — Documento de despacho: total de pasajeros, datos del vehículo,
 * conductores, auxiliar, origen/destino y total de la venta del cajero.
 */
export function manifiestoTotalesTexto(m: ManifiestoDespacho): string {
  let t = manifiestoEncabezado(m);
  t += ESC_POS.ALIGN_LEFT;
  t += normalizarImpresion(`${separadorDoble()}\n`);
  t += ESC_POS.BOLD_ON;
  t += ESC_POS.ALIGN_CENTER;
  t += normalizarImpresion('DOCUMENTO DE DESPACHO\n');
  t += ESC_POS.BOLD_OFF;
  t += ESC_POS.ALIGN_LEFT;

  // Vehículo
  t += normalizarImpresion(`PLACA VEHICULO: ${m.placa_vehi || '-'}\n`);
  const marca = m.vehiculo?.marca || '-';
  const tipo = m.vehiculo?.tipo || '-';
  const modelo = m.vehiculo?.modelo || '-';
  t += normalizarImpresion(`MARCA: ${marca}   TIPO: ${tipo}\n`);
  t += normalizarImpresion(`MODELO: ${modelo}`);
  if (m.vehiculo?.capacidad) t += normalizarImpresion(`   CAPACIDAD: ${m.vehiculo.capacidad}`);
  t += normalizarImpresion('\n');

  // Conductores
  t += normalizarImpresion('CONDUCTOR(ES):\n');
  if (m.conductores.length) {
    m.conductores.forEach((c, i) => {
      t += normalizarImpresion(`  ${i + 1}. ${c.nombre || c.cedula || '-'}\n`);
    });
  } else {
    t += normalizarImpresion('  (no registrado)\n');
  }

  // Auxiliar
  t += normalizarImpresion('AUXILIAR:\n');
  t += normalizarImpresion(`  ${m.auxiliar?.nombre || m.auxiliar?.cedula || '(no registrado)'}\n`);

  // Origen/Destino ya impresos en cabecera; totales
  t += ESC_POS.BOLD_ON;
  t += normalizarImpresion(`${separadorDoble()}\n`);
  t += normalizarImpresion(`TOTAL PASAJEROS: ${m.totales.pasajeros}\n`);
  t += normalizarImpresion(`TOTAL VENTA CAJERO: $${m.totales.total_venta_cajero.toLocaleString('es-CO')}\n`);
  t += ESC_POS.BOLD_OFF;
  t += normalizarImpresion(`${separadorDoble()}\n`);
  t += ESC_POS.FEED_6;
  t += ESC_POS.CUT;
  return t;
}

/** Resultado de una operación de impresión. */
export type ImpresionResultado = 'pda' | 'sunmi' | 'usb' | 'ble' | 'rawbt' | 'print' | 'error';
