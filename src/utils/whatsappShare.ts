// Template WhatsApp share card — estilo soyllanero.com (colores tierra llaneros)
export interface ShareData {
  title: string;
  empresa?: string;
  ruta?: string;
  origen?: string;
  destino?: string;
  hora?: string;
  asiento?: string;
  precio?: string;
  url?: string;
  qrData?: string;
}

export interface WhatsAppCard {
  html: string;
  link: string;
}

/** Genera el HTML inline de la tarjeta para compartir por WhatsApp.
 *  Inspirado en el ecosistema digital soyllanero.com. */
export function buildWhatsAppCard(data: ShareData): WhatsAppCard {
  const empresa = data.empresa ?? 'Sactel Cloud';
  const titulo = data.title ?? `${empresa} — Viaje Programado`;
  const ruta = data.ruta ?? 'Ruta Llanera';
  const origen = data.origen ?? 'Origen';
  const destino = data.destino ?? 'Destino';
  const hora = data.hora ?? '--:--';
  const asiento = data.asiento ?? '—';
  const precio = data.precio ?? '$0';
  const url = data.url ?? 'https://travelsoft.plus';
  const qr = data.qrData ?? '';

  // Encode QR como data URL si existe
  const qrImg = qr
    ? `<img src="data:image/svg+xml;base64,${btoa(qr)}" width="80" height="80" style="display:block" alt="QR" />`
    : '<div style="width:80px;height:80px;background:#e5e7eb;border-radius:8px"></div>';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titulo}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{margin:0;padding:20px;background:linear-gradient(147deg,#f0f4f2 0%,#e8f0ea 100%);font-family:'Inter',sans-serif;color:#2d2d2d}
  .container{max-width:600px;margin:0 auto}
  .card{background:#fff;border:1px solid #e0e0e0;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.08);overflow:hidden}
  .header{background:linear-gradient(135deg,#2d5a3d 0%,#4a7c59 50%,#6b9c7a 100%);padding:24px;color:#fff;text-align:center}
  .logo{width:64px;height:64px;margin:0 auto 12px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px}
  .header h1{font-size:20px;font-weight:700;margin-bottom:4px}
  .header p{font-size:13px;opacity:0.9}
  .content{padding:24px}
  .section{background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:16px;border:1px solid #eef2f5}
  .section-title{font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#647489;margin-bottom:12px;font-weight:600}
  .route{display:flex;align-items:center;justify-content:space-between}
  .route-point{text-align:center}
  .origin{color:#2d5a3d;font-weight:700;font-size:15px}
  .destino{color:#4a7c59;font-weight:700;font-size:15px}
  .arrow{width:100%;height:2px;background:linear-gradient(90,#2d5a3d,#4a7c59);position:relative}
  .arrow::after{content:'→';position:absolute;right:-8px;top:50%;transform:translateY(-50%);background:#2d5a3d;color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:14px}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}
  .info-item{background:#f0f9f4;border-radius:8px;padding:12px;text-align:center;border-left:3px solid #4a7c59}
  .info-label{font-size:11px;text-transform:uppercase;color:#647489;margin-bottom:4px}
  .info-value{font-size:15px;font-weight:700;color:#2d5a3d}
  .qr-section{display:flex;align-items:center;gap:16px;background:#fff;border:2px dashed #d1e0d8;border-radius:12px;padding:20px}
  .qr-code{background:#f8f9fa;border-radius:8px;padding:8px}
  .qr-text{flex:1}
  .qr-text h3{font-size:16px;font-weight:700;color:#2d5a3d;margin-bottom:4px}
  .qr-text p{font-size:13px;color:#647489}
  .footer{padding:20px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center}
  .footer p{font-size:12px;color:#647489}
  .footer a{color:#2d5a3d;font-weight:600;text-decoration:none}
</style>
</head>
<body>
<div class="container">
  <div class="card">
    <div class="header">
      <div class="logo">🚌</div>
      <h1>${titulo}</h1>
      <p>${empresa}</p>
    </div>
    <div class="content">
      <div class="section">
        <div class="section-title">Trayecto</div>
        <div class="route">
          <div class="route-point">
            <div style="font-size:11px;color:#647489">Origen</div>
            <div class="origin">${origen}</div>
          </div>
          <div class="arrow"></div>
          <div class="route-point">
            <div style="font-size:11px;color:#647489">Destino</div>
            <div class="destino">${destino}</div>
          </div>
        </div>
        <div style="margin-top:16px;font-size:13px;color:#647489">Ruta: <span style="color:#2d5a3d;font-weight:600">${ruta}</span></div>
      </div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Hora</div>
          <div class="info-value">${hora}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Asiento</div>
          <div class="info-value">${asiento}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Precio</div>
          <div class="info-value">${precio}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Estado</div>
          <div class="info-value" style="color:#2d5a3d">Confirmado</div>
        </div>
      </div>
      <div class="qr-section">
        <div class="qr-code">${qrImg}</div>
        <div class="qr-text">
          <h3>Comprobante Digital</h3>
          <p>Escanea el código QR para validar tu viaje en la salida.</p>
        </div>
      </div>
    </div>
    <div class="footer">
      <p>Generado por <a href="${url}">${empresa}</a> • Plataforma de Transporte Llanero</p>
    </div>
  </div>
</div>
</body>
</html>`;

  const link = `https://wa.me/?text=${encodeURIComponent(titulo + ' ' + url)}`;

  return { html, link };
}

/** Copia el HTML de la tarjeta al clipboard. */
export async function copyCardToClipboard(data: ShareData): Promise<void> {
  const { html } = buildWhatsAppCard(data);
  await navigator.clipboard.writeText(html);
}

/**
 * Comparte la tarjeta por WhatsApp (abre wa.me con el texto preformateado).
 * Devuelve el link wa.me listo para abrir.
 */
export function shareCardWhatsApp(data: ShareData): string {
  const { link } = buildWhatsAppCard(data);
  window.open(link, '_blank', 'noopener,noreferrer,width=600,height=800');
  return link;
}
