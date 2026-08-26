import { jsPDF } from "jspdf";
import { EMPRESA_NIT, EMPRESA_NOMBRE } from "@/services/ticketFiscalService";

export interface PasajeroLibro {
  nombre: string;
  documento: string;
  asiento: number | null;
  tiquete: string;
  valor?: number | null;
  destino?: string | null;
}

export interface LibroViajeDatos {
  codigoViaje: string;
  fecha: string;
  horaSalida: string;
  ruta: string;
  destino: string;
  vehiculo: string;
  placa?: string;
  conductor?: string;
  cajero?: string;
  pasajeros: PasajeroLibro[];
  // Campos del informe de despacho (opcionales para no romper llamadas previas).
  empresaNombre?: string;
  nit?: string;
  logo?: string | null;
  agencia?: string | null;
  planilla?: number | null;
  numeroVehiculo?: string | number | null;
  licencia?: string | null;
  celularConductor?: string | null;
  deudaProducidos?: number | null;
  rutaNro?: number | null;
  desdeHasta?: string;
  agente?: string;
  totalValor?: number;
}

const pesos = (n?: number | null): string =>
  "$" + (n ?? 0).toLocaleString("es-CO");

/** Carga el logo de la empresa (public/images/logo_tiquete.jpg) como dataURL base64. */
export async function cargarLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch("/images/logo_tiquete.jpg");
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(typeof fr.result === "string" ? fr.result : null);
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function generarLibroDeViaje(d: LibroViajeDatos) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = 48;

  // ─── Encabezado: logo + empresa + NIT + agencia ──────────────
  if (d.logo) {
    try {
      doc.addImage(d.logo, "JPEG", margin, y - 34, 64, 46);
    } catch {
      /* logo no disponible */
    }
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(d.empresaNombre ?? EMPRESA_NOMBRE, margin + 78, y - 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`NIT: ${d.nit ?? EMPRESA_NIT}`, margin + 78, y - 8);
  if (d.agencia) doc.text(`Agencia: ${d.agencia}`, margin + 78, y + 4);

  // ─── Título ───────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("LIBRO DE RUTA", pageW / 2, y, { align: "center" });
  y += 18;
  doc.setDrawColor(200);
  doc.line(margin, y, pageW - margin, y);
  y += 24;

  // ─── Datos del despacho ───────────────────────────────────────
  const datos: [string, string][] = [
    ["Agencia (Ubicación):", d.agencia ?? "—"],
    ["Planilla Nro:", d.planilla != null ? String(d.planilla) : "—"],
    ["Nro Vehículo:", d.numeroVehiculo != null ? String(d.numeroVehiculo) : "—"],
    ["Placa:", d.placa ?? "—"],
    ["Ruta Nro:", d.rutaNro != null ? String(d.rutaNro) : "—"],
    ["Desde → Hasta:", d.desdeHasta ?? d.ruta],
    ["Fecha:", d.fecha],
    ["Hora:", d.horaSalida],
    ["Conductor:", d.conductor ?? "—"],
    ["Licencia Nro:", d.licencia ?? "—"],
    ["Celular Conductor:", d.celularConductor ?? "—"],
    ["Deuda Producidos:", d.deudaProducidos != null ? pesos(d.deudaProducidos) : "—"],
    ["Agente:", d.agente ?? d.cajero ?? "—"],
  ];
  doc.setFontSize(10);
  for (const [etiqueta, valor] of datos) {
    doc.setFont("helvetica", "bold");
    doc.text(etiqueta, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(valor, margin + 140, y);
    y += 18;
  }

  y += 8;
  doc.setDrawColor(200);
  doc.line(margin, y, pageW - margin, y);
  y += 22;

  // ─── Manifiesto de pasajeros (sillas ocupadas) ───────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Manifiesto de Pasajeros (Sillas Ocupadas)", margin, y);
  y += 16;

  const colSilla = margin;
  const colPas = margin + 50;
  const colDoc = margin + 250;
  const colDest = margin + 400;
  const colVal = pageW - margin;

  doc.setFontSize(9);
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 10, pageW - margin * 2, 18, "F");
  doc.setFont("helvetica", "bold");
  doc.text("SILLA", colSilla, y);
  doc.text("PASAJERO", colPas, y);
  doc.text("DOCUMENTO", colDoc, y);
  doc.text("DESTINO", colDest, y);
  doc.text("VALOR", colVal, y, { align: "right" });
  y += 14;

  doc.setFont("helvetica", "normal");
  if (d.pasajeros.length === 0) {
    doc.setTextColor(120);
    doc.text("Sin pasajeros registrados para este viaje.", margin, y);
    doc.setTextColor(0);
    y += 14;
  } else {
    for (const p of d.pasajeros) {
      if (y > pageH - 90) {
        doc.addPage();
        y = 48;
      }
      doc.text(String(p.asiento ?? "—"), colSilla, y);
      doc.text(p.nombre, colPas, y);
      doc.text(p.documento, colDoc, y);
      doc.text(p.destino ?? d.destino ?? "—", colDest, y);
      doc.text(p.valor != null ? pesos(p.valor) : "—", colVal, y, { align: "right" });
      y += 15;
    }
  }

  // ─── Total ────────────────────────────────────────────────────
  y += 6;
  doc.setDrawColor(200);
  doc.line(margin, y, pageW - margin, y);
  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL VALOR SILLAS OCUPADAS:", margin, y);
  doc.text(pesos(d.totalValor ?? 0), colVal, y, { align: "right" });

  // ─── Pie ──────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  const horaImpresion = new Date().toLocaleString("es-CO");
  doc.text(`Despachado a las: ${horaImpresion}`, margin, pageH - 50);
  doc.text(
    "Firma del conductor: ________________________",
    pageW - margin - 260,
    pageH - 50
  );
  doc.setTextColor(0);

  // Imprime directo a la impresora local (abre el PDF y dispara el diálogo de
  // impresión del navegador, que apunta a la impresora del equipo).
  doc.autoPrint();
  const blobUrl = doc.output("bloburl");
  const ventana = window.open(blobUrl, "_blank");
  if (!ventana) {
    // Bloqueador de pop-ups: soltar la URL para que el usuario la abra manualmente.
    window.open(blobUrl, "_blank");
  }
}
