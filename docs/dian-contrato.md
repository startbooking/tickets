# Contrato de Integración DIAN — Documento Equivalente Electrónico (DEE)

Este documento es la **especificación técnica** del envío de tiquetes de transporte como
Documento Equivalente Electrónico (Tipo de Documento **21**) a la DIAN, usando el Core SACTel
(`dian.sactel.net` / `/dian/v1`). Complementa `INFORME_PROCESOS_FALTANTES_DEE_DIAN.md`.

> El frontend construye un **JSON interno** (`TiqueteTransporteDTO`); el Core SACTel lo convierte
> al **XML UBL 2.1** del Anexo Técnico DIAN, lo firma y devuelve el **CUDE** + QR. El cliente
> **nunca** genera el CUDE ni la firma.

---

## 1. Endpoints (Core SACTel — `/dian/v1`)

| Método | Ruta | Descripción | Cuerpo | Respuesta |
|---|---|---|---|---|
| POST | `/tiquete-transporte/emitir` | Emite el DEE y devuelve CUDE/QR. | `TiqueteTransporteDTO` | `DianResponse` |
| POST | `/tiquete-transporte/guardar` | Persiste el documento fiscal (tabla `documentos_dian`). | `DocumentoDianPersist` | `DianResponse` |
| GET | `/tiquete-transporte/{id_planilla}` | Consulta el documento persistido. | — | `DianResponse` |
| POST | `/tiquete-transporte/anular` | Anula el DEE (evento de anulación). | `{id_planilla, motivo}` | `DianResponse` (con `cude_anulacion`) |

Cabeceras comunes (cliente frontend, `src/services/dianService.ts`):
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer <VITE_EMPRESA_TOKEN>
x-user-id: <id usuario>
x-user-role: <rol>
```

### DianResponse
```json
{
  "success": true,
  "cude": "A1B2...96",            // CUDE del DEE (Tipo 21)
  "cufe": "A1B2...96",            // alias de compatibilidad
  "qr_dian": "https://catalogo-vp-documentosequivalenteselectronicos.dian.gov.co/document/searchqr?documentkey=...",
  "qr_code_url": "https://...",
  "numero_factura": "FSV-00000123",
  "url_validacion": "https://...",
  "data": { }
}
```

---

## 2. Payload de emisión — `TiqueteTransporteDTO` (Tipo 21)

Construido en `src/services/ticketFiscalService.ts::construirPayloadDian`. Campos mínimos
exigidos por el Anexo Técnico:

```json
{
  "tipoDocumento": "21",
  "descripcionTipoDocumento": "Documento Equivalente Electrónico Tiquete de Transporte de Pasajeros",
  "versionEstructura": "1.0",
  "ambiente": "1",                       // 1=Producción, 2=Habilitación (VITE_DIAN_ENVIRONMENT)
  "prefijo": "FSV",
  "numeroConsecutivo": 123,
  "cude": null,                          // SOLO si ya existe (re-emisión). El Core lo calcula.
  "fechaEmision": "2026-08-29",
  "horaEmision": "14:30-05:00",
  "divisa": "COP",
  "formaPago": "1",                      // 1=Efectivo, 2=Tarjeta/QR
  "medioPago": "48",
  "emisor": {
    "nit": "860022105",
    "dv": "1",
    "razonSocial": "FLOTA SAN VICENTE S.A.",
    "nombreComercial": "FLOTA SAN VICENTE",
    "tipoOrganizacion": "1",
    "regimenTributario": "48",
    "responsabilidadFiscal": "O-13;O-15;O-47",
    "direccion": { "municipioNombre": "BOGOTA", "direccion": "Calle 24 A No. 44-35" },
    "contacto": { "telefono": "(601) 368 2390", "email": "fsv@flotasanvicente.co" }
  },
  "adquirente": {
    "tipoIdentificacion": "13",          // 13=CC, 14=Consumidor final
    "numeroIdentificacion": "12345678",
    "nombres": "PEDRO",
    "apellidos": "PEREZ",
    "direccion": { "municipioNombre": "BOGOTA" },
    "contacto": { "telefono": "+57300...", "email": "p@correo.com" }
  },
  "detallesServicioTransporte": {
    "modoTransporte": "Terrestre",
    "tipoServicio": "Pasajeros Intermunicipal",
    "origen": { "nombre": "BOGOTA" },
    "destino": { "nombre": "MEDELLIN" },
    "vehiculo": {
      "placa": "ABC123",
      "numeroInterno": "10",
      "empresaAfiliada": "FLOTA SAN VICENTE S.A.",
      "nitEmpresaAfiliada": "860022105"
    },
    "viaje": {
      "fechaSalida": "2026-08-29",
      "horaSalida": "14:30",
      "puestos": "12,13",
      "numeroPuestos": 2
    }
  },
  "lineasDetalle": [
    {
      "numeroLinea": 1,
      "codigoProducto": "SERV-TRP-PAS",
      "descripcion": "Tiquete de transporte terrestre intermunicipal BOGOTA - MEDELLIN (silla 12)",
      "cantidad": 1,
      "unidadMedida": "94",
      "valorUnitario": 45000,
      "descuento": 0,
      "subtotal": 45000,
      "impuestos": [],
      "totalLinea": 45000
    }
  ],
  "totales": {
    "lineasTotal": 45000,
    "subtotalBruto": 45000,
    "totalDescuentos": 0,
    "totalCargos": 0,
    "totalImpuestos": 0,
    "totalPagar": 45000
  },
  "informacionRepresentacionGrafica": {
    "qrData": "Numpool=FSV-00000123&Fec=2026-08-29&Hora=14:30&ValFac=45000.00&ValIva=0.00&ValOtroIm=0.00&ValTotal=45000.00&NitFac=860022105&DocAdq=12345678&CUDE=",
    "urlValidacionDian": "https://catalogo-vp-documentosequivalenteselectronicos.dian.gov.co/document/searchqr?documentkey=..."
  },
  "datos_emisor": { "token_empresa": "<VITE_EMPRESA_TOKEN>", "id_agencia": 1 },
  "datos_viaje": { "id_interno_viaje": 990012, "origen": "BOGOTA", "destino": "MEDELLIN", "placa_vehiculo": "ABC123", "numero_asiento": 12, "valor_tiquete": 45000 }
}
```

### Mapeo de campos del negocio → DEE
| Origen (frontend) | Campo DEE |
|---|---|
| `TicketVenta.origen` / `destino` | `detallesServicioTransporte.origen/destino.nombre` |
| `TicketVenta.placa_vehi` | `detallesServicioTransporte.vehiculo.placa` |
| `TicketVenta.puesto` / `puestos` | `detallesServicioTransporte.viaje.puestos` |
| `TicketVenta.valor` | `lineasDetalle[].valorUnitario` / `totales.totalPagar` |
| `TicketVenta.pasajero.documento` | `adquirente.numeroIdentificacion` |
| `TicketVenta.forma_pago` (EFECTIVO/TARJETA/QR) | `formaPago` (1/2) |
| `TicketVenta.numero_factura` | `prefijo` + `numeroConsecutivo` |
| `TicketVenta.nit_emisor` | `emisor.nit` + `emisor.dv` |
| `TicketVenta.cufe` (si existe) | `cude` (re-emisión) |

---

## 3. Persistencia — `documentos_dian` (migración `012-documentos-dian.sql`)

`POST /tiquete-transporte/guardar` espera:
```json
{
  "id_planilla": 990012,
  "tipo_documento": "21",
  "numero_factura": "FSV-00000123",
  "cude": "A1B2...96",
  "qr_data": "Numpool=...&CUDE=...",
  "url_validacion": "https://...",
  "estado": "AUTORIZADO",
  "id_resolucion": 7,
  "id_orides": 1,
  "total": 45000,
  "total_impuestos": 0,
  "forma_pago": "EFECTIVO",
  "medio_pago": "48",
  "respuesta_dian": { }
}
```

---

## 4. Anulación — `POST /tiquete-transporte/anular`
```json
{ "id_planilla": 990012, "motivo": "Error en origen/destino" }
```
Respuesta incluye `cude_anulacion`. El registro `documentos_dian` pasa a
`estado='ANULADO'` con `cude_anulacion`, `motivo_anulacion`, `fecha_anulacion`.
La UI de la lista de tiquetes del `CajeroDashboard` debe invocar
`useTicketFiscal().anularConDian(id_planilla, motivo)` (pendiente de cablear en la vista).

---

## 5. Variables de entorno (`.env.*`)
```
VITE_BACKEND_DIAN_URL=/dian/v1          # lan (ProxyPass Apache -> :8008)
VITE_EMPRESA_TOKEN=sk_live_...          # token del emisor ante el Core SACTel
VITE_DIAN_ENVIRONMENT=test              # test=Habilitación, production=Producción
```

---

## 6. Notas de cumplimiento
- Transporte intermunicipal de pasajeros está **exento de IVA** (`totalImpuestos: 0`).
- El **CUDE** es obligatorio y debe imprimirse en el tiquete físico junto al QR de validación.
- `src/lib/thermalPrinter.ts` genera actualmente un CUDE **aleatorio/falso** (`generateCUDE()`
  con `Math.random`) y usa `verify.transveloz.com` — debe reemplazarse por el CUDE real del Core
  antes de producción (riesgo de cumplimiento).
- La URL de validación de DEE debe confirmarse con el Anexo Técnico / PSO (se asume
  `catalogo-vp-documentosequivalenteselectronicos.dian.gov.co`).

## 7. Ejemplo cURL (emisión)
```bash
curl -X POST https://dian.sactel.net/dian/v1/tiquete-transporte/emitir \
  -H "Authorization: Bearer $VITE_EMPRESA_TOKEN" \
  -H "Content-Type: application/json" \
  -d @tiquete-transporte.json
```
