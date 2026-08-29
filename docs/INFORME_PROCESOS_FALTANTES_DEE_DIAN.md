# INFORME TÉCNICO — Procesos faltantes para el envío de Documentos Equivalentes Electrónicos (DEE) a la DIAN

## 1. Objetivo y alcance
Diagnosticar, a partir del código actual del repositorio `rutas`, los procesos (software, datos y operativos) que aún no existen para comenzar a enviar a la DIAN los tiquetes de transporte como **Documento Equivalente Electrónico (DEE), Tipo de Documento 21** ("Tiquete de Transporte de Pasajeros"), según el Anexo Técnico de Facturación Electrónica vigente.

## 2. Marco normativo DIAN aplicable (resumen)
- **Resolución 000042 de 2020** y actualizaciones: Facturación Electrónica y Documentos Electrónicos Equivalentes.
- El tiquete de transporte intermunicipal de pasajeros se emite como **Documento Equivalente Electrónico, Tipo 21**, versión de estructura `1.0`.
- El identificador fiscal del DEE es el **CUDE** (no CUFE; el CUFE es para Factura de Venta). Lo calcula el proveedor tecnológico / Core firmador.
- Requiere **Resolución de Facturación DIAN** vigente (prefijo, rango, consecutivo, vigencia) por emisor/agencia.
- Requiere **habilitación** del emisor ante la DIAN (clave técnica, Software PIN, certificado de firma) y ambiente de *Habilitación* antes de producción.
- Transporte de pasajeros intermunicipal: **exento de IVA** (base gravable = 0, valor impuesto = 0) — ya reflejado en el payload actual.

## 3. Arquitectura actual detectada
| Componente | Dónde | Rol en la emisión DEE |
|---|---|---|
| Frontend PWA (React) | **este repo** `src/` | Construye el payload, llama al Core, imprime el tiquete con CUDE+QR |
| API TravelSoft | `travelsoft.backend.lan:8005` (`/api/v1`) — **externa** | Transaccional: venta (`/ventas/tiquete`), `resoluciones`, `planillas` |
| Core DIAN (FE) | `dian.sactel.net:8008` (`/dian/v1`) — **externo** | Recibe `/tiquete-transporte/emitir`, firma, devuelve CUDE/QR |
| Proxy Apache | `.env.lan` indica `ProxyPass /dian/v1 -> :8008` | Enruta el tráfico DIAN |
| `docs/backend` | este repo | ⚠️ Backend de **ejemplo obsoleto** (`transporte_intermunicipal`, MySQL aparte). **No es** el backend productivo; no debe confundirse. |

**Conclusión:** el código que SÍ vive en este repo es el frontend + migraciones. Los endpoints del Core DIAN y la persistencia deben especificarse aquí y ejecutarse en el backend externo.

## 4. Estado actual (lo que YA existe)
- `src/services/dianService.ts`: cliente axios a `/dian/v1`, `POST /tiquete-transporte/emitir`, `DianResponse {success, cufe, qr_code_url, qr_dian, numero_factura}`.
- `src/services/ticketFiscalService.ts::construirPayloadDian`: arma un `TiqueteTransporteDTO` Tipo 21 razonablemente completo (emisor, adquirente, `detallesServicioTransporte`, `lineasDetalle`, `totales`, `informacionRepresentacionGrafica`).
- `src/hooks/useTicketFiscal.ts::emitirConDian`: emite con *fallback* tolerante (si el Core cae, imprime sin CUDE).
- `src/services/tiqueteService.ts`: **duplicado** de `dianService` apuntando a `/api/v1` (TravelSoft) — inconsistente.
- `src/components/tickets/GenerarTicket.tsx`: usa un payload **viejo** (campos en minúscula, sin `tipoDocumento:21`) — desalineado.
- Migraciones: `resoluciones` (003) y `planillas` (esquema `flota9`) existen; `tiquetes.hash_cufe` solo en `script-inicial.sql` (esquema no productivo).
- ⚠️ `src/lib/thermalPrinter.ts` genera un **CUDE aleatorio/falso** (`generateCUDE()` con `Math.random`) y usa `verify.transveloz.com` — riesgo de cumplimiento; debe reemplazarse por el CUDE real devuelto por el Core.

## 5. Matriz de procesos faltantes
| # | Proceso faltante | Capa | Estado | Archivos a tocar |
|---|---|---|---|---|
| F1 | Habilitación DIAN y credenciales (clave técnica, Software PIN, cert. firma, NIT) | Ops/DIAN + Core | ❌ No iniciado | `.env.*` (`VITE_EMPRESA_TOKEN`, `VITE_DIAN_ENVIRONMENT`) |
| F2 | Resolución DIAN vigente por agencia (cargue/validación de rango, prefijo, vigencia, consecutivo) | Backend + Frontend + BD | ⚠️ Tabla existe, falta validación | `migrations/003`, `travelsoftService.getResoluciones` |
| F3 | Unificar cliente de emisión (eliminar duplicado `tiqueteService`) | Frontend | ⚠️ Duplicado | `src/services/tiqueteService.ts`, `dianService.ts` |
| F4 | Corregir payload DEE (CUDE≠CUFE, no enviar mock, QR correcto, campos Anexo) | Frontend | ⚠️ Incorrecto | `ticketFiscalService.construirPayloadDian`, `GenerarTicket.tsx` |
| F5 | Persistir el documento fiscal emitido (tabla `documentos_dian` + endpoint guardar/consultar) | Backend + BD + Frontend | ❌ No existe | migración nueva, `dianService` |
| F6 | Anulación del DEE ante la DIAN (evento/CUDE anulación + bitácora) | Backend + Frontend + BD | ❌ No existe | migración, `dianService.anularDocumento`, UI |
| F7 | Resiliencia/reintentos y cola local (ya hay fallback offline; falta reintento de emisión) | Frontend + Backend | ⚠️ Parcial | `useTicketFiscal`, Core |
| F8 | Validación de respuesta y representación gráfica (CUDE+QR en tiquete físico) | Frontend | ⚠️ Parcial | `ticketATextoImpresion`, `thermalPrinter.ts` |
| F9 | Trazabilidad y reportes (cierre de caja DIAN, bitácora emisión/anulación) | Backend | ❌ No existe | `bitacora_anulaciones`, nuevo reporte |
| F10 | Pruebas en ambiente de Habilitación y paso a Producción | Ops + Frontend | ⚠️ `VITE_DIAN_ENVIRONMENT=test` existe | `.env.*` |

### Detalle de los procesos críticos
**F1 — Habilitación DIAN (Ops).** Obtener/confirmar en el Core: NIT emisor (`860.022.105-1` ya hardcodeado en `EMPRESA_NIT`), clave técnica, Software PIN, certificado de firma, y ambiente *Habilitación* (`VITE_DIAN_ENVIRONMENT=test`) → *Producción*. Sin esto, el Core no puede firmar ni obtener CUDE real.

**F2 — Resolución DIAN por agencia.** `resoluciones` ya tiene rango/prefijo/consecutivo, pero falta: (a) validar vigencia al emitir, (b) bloquear cuando `consecutivo_actual` llegue a `rango_final`, (c) que el Core reciba el `numero_resolucion` y lo refleje en el DEE. El frontend ya trae `resolucion_numero` en `TicketVenta`.

**F3 — Unificar cliente (frontend).** Eliminar `src/services/tiqueteService.ts` (su `ticketsService` apunta a `/api/v1`, no a `/dian/v1`). Dejar único `dianService`. `GenerarTicket.tsx` ya usa `dianService` (correcto).

**F4 — Corregir payload DEE (frontend).** En `construirPayloadDian`:
- Enviar **`cude`**, no `cufe` (DEE Tipo 21). Quitar `cufe: CUFE_MOCK` del payload saliente (el Core lo calcula y lo devuelve).
- No reconstruir `qrData` con CUDE mock; usar el CUDE real devuelto por el Core para el QR.
- Corregir `urlValidacionDian` al host de **Documentos Equivalentes** del Anexo Técnico (hoy usa `catalogo-vp-fe.dian.gov.co` que es de facturas).
- `GenerarTicket.tsx` debe migrar a `construirPayloadDian` (hoy manda esquema viejo sin `tipoDocumento:21`).

**F5 — Persistir documento fiscal (BD + Backend + Frontend).** Migración `migrations/012-documentos-dian.sql`:
```sql
CREATE TABLE documentos_dian (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_planilla INT NOT NULL,
  tipo_documento VARCHAR(3) DEFAULT '21',
  prefijo VARCHAR(10),
  numero_consecutivo BIGINT,
  numero_factura VARCHAR(30),
  cude VARCHAR(96),
  qr_data TEXT,
  url_validacion VARCHAR(512),
  estado ENUM('BORRADOR','AUTORIZADO','RECHAZADO','ANULADO') DEFAULT 'BORRADOR',
  respuesta_dian JSON,
  id_resolucion INT,
  id_orides INT,
  total DECIMAL(12,2),
  total_impuestos DECIMAL(12,2) DEFAULT 0,
  forma_pago VARCHAR(20),
  medio_pago VARCHAR(5),
  cude_anulacion VARCHAR(96),
  motivo_anulacion VARCHAR(255),
  fecha_anulacion DATETIME,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_planilla (id_planilla),
  INDEX idx_estado (estado)
);
```
Backend (Core): `POST /dian/v1/tiquete-transporte/guardar` y `GET /dian/v1/tiquete-transporte/{id_planilla}`. Frontend: `dianService.guardarDocumento()` y tipo `DocumentoDian` en `src/types`.

**F6 — Anulación DEE (Backend + Frontend + BD).** Backend: `POST /dian/v1/tiquete-transporte/anular` (envía evento de anulación al Core → CUDE de anulación). Frontend: `dianService.anularDocumento(id_planilla, motivo)`; actualizar `estado='ANULADO'` y registrar en `bitacora_anulaciones`. Hoy solo existe `anularRuta` (anula la ruta, no el documento fiscal).

**F7 — Resiliencia.** `useTicketFiscal.emitirConDian` ya tiene fallback offline (imprime sin CUDE). Falta: al volver el Core, **reintentar la emisión** de los tiquetes en cola local y luego persistir/imprimir el CUDE. Recomendar cola en `localStorage`/IndexedDB con reintento al reconectar.

**F8 — Representación gráfica.** `ticketATextoImpresion` ya imprime `cufe`/`qr`; ajustar a `cude` y al QR de validación de DEE. Reemplazar `thermalPrinter.ts` (CUDE aleatorio) por el real.

**F9 — Trazabilidad.** Reporte de cierre de caja DIAN (totales autorizados vs anulados) consultando `documentos_dian`.

**F10 — Habilitación vs Producción.** `VITE_DIAN_ENVIRONMENT` ya existe (`test`/`production`); falta usarla para fijar `ambiente` del payload (`1`=producción, `2`=habilitación según Anexo) y validar contra el ambiente correcto del Core.

## 6. Contrato JSON / endpoints (referencia)
Resumen del payload (`TiqueteTransporteDTO`, Tipo 21) ya definido en `src/types/index.ts:266` y construido en `ticketFiscalService.ts`. El entregable **(d)** es `docs/dian-contrato.md` con el JSON completo, mapeo de campos al Anexo Técnico, endpoints y ejemplos cURL.

## 7. Riesgos / dependencias
- El Core DIAN externo debe implementar F5/F6 (no está en este repo).
- `docs/backend` es código de ejemplo; no usarlo como base.
- CUDE y firma **nunca** deben generarse en el cliente.
- La URL de validación de DEE debe confirmarse con el Anexo Técnico / PSO.

## 8. Orden de implementación sugerido (a→d)
1. **(a)** F3 + F4 — unificar cliente y corregir payload CUDE/QR (frontend, este repo).
2. **(b)** F5 — migración `documentos_dian` + servicio de guardado/consulta (migración en repo + spec/endpoint en Core).
3. **(c)** F6 — anulación DEE (migración `estado` + endpoint + UI).
4. **(d)** Documentar contrato JSON/endpoints (`docs/dian-contrato.md`).
5. Previos/paralelos: F1 (habilitación Ops), F2 (validación resolución), F7–F10.

## 9. Conclusión
El frontend tiene ~70% de la lógica DEE; faltan correcciones de contrato (CUDE vs CUFE), la **persistencia** del documento fiscal y la **anulación** ante la DIAN, además de la habilitación operativa. Los items marcados "Backend" deben ejecutarse en el Core DIAN externo usando las specs de este informe.
