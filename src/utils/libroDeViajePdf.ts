import { jsPDF } from "jspdf";

export interface PasajeroLibro {
  nombre: string;
  documento: string;
  asiento: number | null;
  tiquete: string;
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
}

export function generarLibroDeViaje(d: LibroViajeDatos) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = 48;

  // ─── Encabezado ───────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("LIBRO DE RUTA", pageW / 2, y, { align: "center" });
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("SACTel Tickets — TravelSoft", pageW / 2, y, { align: "center" });
  y += 10;
  doc.setDrawColor(200);
  doc.line(margin, y, pageW - margin, y);
  y += 26;

  // ─── Datos del viaje ─────────────────────────────────────────
  const campos: [string, string][] = [
    ["Código de Viaje:", d.codigoViaje],
    ["Fecha:", d.fecha],
    ["Hora de Salida:", d.horaSalida],
    ["Ruta:", d.ruta],
    ["Destino:", d.destino],
    ["Vehículo:", d.vehiculo],
    ["Placa:", d.placa ?? "—"],
    ["Conductor:", d.conductor ?? "—"],
    ["Cajero:", d.cajero ?? "—"],
  ];

  doc.setFontSize(11);
  for (const [etiqueta, valor] of campos) {
    doc.setFont("helvetica", "bold");
    doc.text(etiqueta, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(valor, margin + 130, y);
    y += 20;
  }

  y += 10;
  doc.setDrawColor(200);
  doc.line(margin, y, pageW - margin, y);
  y += 24;

  // ─── Manifiesto de pasajeros ─────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Manifiesto de Pasajeros", margin, y);
  y += 16;

  const colAsiento = margin;
  const colNombre = margin + 60;
  const colDoc = margin + 250;
  const colTiquete = margin + 400;

  doc.setFontSize(9);
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 10, pageW - margin * 2, 18, "F");
  doc.setFont("helvetica", "bold");
  doc.text("SILLA", colAsiento, y);
  doc.text("PASAJERO", colNombre, y);
  doc.text("DOCUMENTO", colDoc, y);
  doc.text("TIQUETE", colTiquete, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  if (d.pasajeros.length === 0) {
    doc.setTextColor(120);
    doc.text("Sin pasajeros registrados para este viaje.", margin, y);
    doc.setTextColor(0);
    y += 14;
  } else {
    for (const p of d.pasajeros) {
      if (y > pageH - 80) {
        doc.addPage();
        y = 48;
      }
      doc.text(String(p.asiento ?? "—"), colAsiento, y);
      doc.text(p.nombre, colNombre, y);
      doc.text(p.documento, colDoc, y);
      doc.text(p.tiquete, colTiquete, y);
      y += 16;
    }
  }

  // ─── Pie ─────────────────────────────────────────────────────
  y = pageH - 60;
  doc.setDrawColor(200);
  doc.line(margin, y - 14, pageW - margin, y - 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(
    `Generado el ${new Date().toLocaleString("es-CO")}`,
    margin,
    y
  );
  doc.text(
    "Firma del conductor: ________________________",
    pageW - margin - 260,
    y
  );
  doc.setTextColor(0);

  doc.save(`Libro de Ruta - ${d.codigoViaje}.pdf`);
}
