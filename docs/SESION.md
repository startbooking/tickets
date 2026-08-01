# SESIÓN — Resoluciones DIAN + Emisión fiscal + Impresión térmica (2026-07-31)

Archivo de estado de la sesión para retomar el trabajo más adelante. Actualizado 2026-07-31.

## Objective
- CRUD de resoluciones de facturación DIAN por agencia (backend + frontend).
- Integrar emisión DIAN (CUFE/QR) en la venta de tiquetes.
- Resolución mock activa con impresión física en la Epson USB (cola CUPS `TMU`).

## Important Details
- NIT emisor: **860.022.105-1** (Flota San Vicente S.A.); empresa impresa: `FLOTA SAN VICENTE S.A.`
- Resolución mock en BD (`id_resolucion=5`, agencia 1=BOGOTA): `18764000000001`, prefijo `FSV`, rango 1–1.000.000, `consecutivo_actual=1`, vigencia 2026-01-01→2027-12-31, activa, notas "Resolución de prueba (mock DIAN)".
- Tiquete de prueba vendido en BD: `planillas.id_planilla=45470142` (ruta 2, puesto 2, doc 79900001, valor 34000, EFECTIVO, BOGOTA→TOCAIMA, placa DMW-900, fecha 2026-07-31 20:46). Respuesta DIAN: `consecutivo_factura=1`, `numero_factura="FSV1"`, `resolucion_numero="18764000000001"`, `nit_emisor="860022105-1"`.
- CRUD resoluciones: activar una desactiva las demás de la agencia; `SUPERADMIN` opera cualquier agencia vía query `?agencia=` (GET/DELETE) o `id_orides` en body (POST/PUT); demás roles solo su agencia.
- **CORRECCIÓN CRÍTICA ESC/POS (esta sesión)**: los constantes `ESC_POS` enviaban el dígito ASCII como byte de parámetro. `FEED_6` era `\x1bd6` → n=`0x36` = **54 líneas** (avance más largo que el propio tiquete). Corregido a bytes binarios:
  - `FEED_6 = \x1bd\x06` (6 líneas)
  - `DOUBLE_SIZE = \x1d!\x11` (2x2) — antes `\x1d!11` = n 0x31 (ancho 4x, alto 1x + byte extra)
  - `ALIGN_LEFT/CENTER/RIGHT = \x1ba\x00/\x01/\x02` — antes ASCII (49/50 fuera de rango)
  - `BOLD_ON/OFF = \x1bE\x01/\x00`
  - `CUT = \x1dV\x01` (equivalente al anterior `\x1dV1`=49, válido en spec)
- Pipeline byte a byte verificado: ticket 604 chars → **604 bytes**; bloque QR `GS ( k` (modelo 2, módulo 6, corrección H=51) intacto. `ESC_POS` solo se usa en `ticketFormatter.ts`.
- Formato ticket ESC/POS (58mm): `NIT:`, `Res.:`, `Factura:`, `IVA EXCLUIDO - SERVICIO DE TRANSPORTE PUBLICO (ART. 462 E.T.)`, `CUFE:`, QR `GS ( k` antes de `!Buen Viaje!`, `FEED_6`, `CUT`.
- Impresora: Epson TM-T88IV/TMU, USB `04b8:0202`; endpoint `POST /api/v1/impresion/ticket` (CUPS `lp -d TMU -o raw`, fallback pyusb). `GET /api/v1/impresion/estado` OK.
- **Auth backend travelsoft** (importante para pruebas): login en `POST /api/v1/auth/login` con body `{cedula_usuario, password}` (**el campo se llama `password`, no `clave_usuario`**) → el token está en `data.token` (no `access_token`). JWT HS256, secret `travelsoft-dev-secret-change-me`, payload `sub`/`rol`/`id_orides`.
- Usuario de prueba: `79.404.593` / `4593` (CAJERO, `id_orides=1`, activo). Otro activo: `1.013.590.488`/`0488`. Token guardado en `/tmp/opencode/token.txt`.
- Frontend `.env.local`: `VITE_TICKETS_BACKEND_URL=http://travelsoft.backend.lan/api/v1`, `VITE_BACKEND_DIAN_URL=http://backend.sactel.lan/api/v1`, `VITE_EMPRESA_TOKEN=sk_live_777777777_a47704d40beaae58eb8f88eeab7439ebd164e2f3b3273e31`.
- Core DIAN (`backend.sactel.lan`) probado **caído en runtime** (HTTP 000). Endpoint: `POST /api/v1/tiquete-transporte/emitir`.

## Work State
### Completed
- Backend: CRUD resoluciones en `travel.py` (`GET/POST /api/v1/resoluciones/agencia`, `PUT/DELETE /api/v1/resoluciones/agencia/{id}`) + helpers `_agencia_objetivo`/`_rol_usuario`/`_validar_fecha_opt`; `ResolucionCreate/Update` con `id_orides` opcional.
- Backend verificado end-to-end (crear/listar/`_get_resolucion_activa`/eliminar, incl. SUPERADMIN en agencia 2); servicio `travelsoft` activo.
- Frontend: `tsc --noEmit` 0 errores, `npm run build` OK. ESLint: solo 1 warning preexistente `react-refresh/only-export-components` en `AuthContext.tsx:105` (exporta hook + componente) — no introducido por esta sesión.
- `travelsoftService.ts`: interfaces `Resolucion`/`ResolucionInput`/`TicketVenta` + CRUD resoluciones + `imprimirTicketEscPos`.
- `ticketFormatter.ts`: `normalizarImpresion`, `qrEscPos`, `generateTicketTXT`, **constantes ESC_POS corregidas a bytes binarios**.
- `CajeroDashboard.tsx`: `construirPayloadDian` (TiqueteTransporteDTO), emisión vía `dianService.emitirTiqueteTransporte` con fallback (Core DIAN caído → toast warning + imprime sin CUFE), `imprimirTiquete` con campos DIAN.
- Vistas: `ResolutionsManagementView.tsx` (SuperAdmin, selector agencia), `LocalResolutionsView.tsx` (agencia propia, alerta sin resolución activa), `ResolucionFormDialog.tsx`.
- **Impresión física DIAN validada**: QR escanea correctamente (CUFE sintético `7CBC8F46A05C96A491A61565DD8648FEEA35C834`). Primera impresión 606 bytes (feed bug), después de corregir ESC_POS reimpreso **604 bytes con feed de 6 líneas** (HTTP 200 cola TMU) — pendiente confirmación humana del feed corregido.

### Active
- (ninguno — pendiente de validación humana de la impresión con feed corregido)

### Active
- (ninguno — Core DIAN expuesto pero sin emitir CUFE todavía)

### Blocked (emisión CUFE real)
- ~~Core DIAN caído~~ → **RESUELTO 2026-08-01**: `backend.sactel.lan` no resolvía (el wildcard `*.sactel.lan` de /etc/hosts no aplica). Se agregó `127.0.0.1 backend.sactel.lan` a `/etc/hosts` y vhost Apache `backend.sactel.lan.conf` → proxy `127.0.0.1:8008` (SACTel Cloud FE Engine, `/var/www/backend.lan/dian-fe`). Script idempotente: `/tmp/opencode/levantar_backend_dian.sh`. Verificado: `GET /api/v1/empresas` → 200; `POST /api/v1/tiquete-transporte/emitir` con token → 422 (validación de esquema, auth OK).
- **Falta configurar el Core para emitir CUFE** (BD `facturacore_db`): `api_keys` id=6 valida el token (`sk_live_7777777…`, empresa_id=6 NIT `777777777` "OTRA EMPRESA TEST", ambiente 2=pruebas, 1100 folios, 0 consumidos) pero **`resoluciones` está vacía** y **`certificados_digitales` está vacío** → `_obtener_empresa_y_resolucion` y `_firmar_y_enviar` fallarían (400). Además `DIAN_SOFTWARE_ID`/`DIAN_SOFTWARE_PASSWORD` están comentados en `dian-fe/.env`.

## Next Move
1. Confirmar físicamente que el feed del tiquete corregido es de ~6 líneas (se imprimió el ticket corregido: 604 bytes).
2. Probar emisión real CUFE/QR: insertar resolución `TIQUETE_TRANSPORTE` para empresa 6 en `facturacore_db`, cargar certificado digital activo/vigente, configurar `DIAN_SOFTWARE_ID`/pin de habilitación y disparar `POST /tiquete-transporte/emitir`.
3. (A largo plazo) Introducir los datos reales de la resolución DIAN tras las pruebas.
4. ~~Revisar `git status` y decidir commit~~ → **Hecho 2026-08-01**: commit `3860d35` (18 archivos, 2949 inserciones). Verificación previa: `tsc --noEmit` 0 errores, `npm run build` OK, `lint` solo 1 warning preexistente.

## Relevant Files
- `/var/www/backend.lan/travelsoft/app/api/printer.py` + `app/api/travel.py` (`GET/POST /resoluciones/agencia`, `PUT/DELETE /resoluciones/agencia/{id}`, `_get_resolucion_activa`, `_agencia_objetivo`, `_rol_usuario`, `_agencia_usuario`).
- `/var/www/backend.lan/travelsoft/app/services/printer.py`: CUPS cola TMU → pyusb; `_normalizar_texto` sin NFD, encoding latin-1 byte-fiel.
- `/var/www/backend.lan/travelsoft/app/schemas/travel_schema.py`: `LoginRequest` (**campo `password`**), `TicketPrintRequest`, `ResolucionCreate/Update`.
- `/var/www/sactel.lan/rutas/src/utils/ticketFormatter.ts`: `generateTicketTXT` + `qrEscPos` + `normalizarImpresion` + **ESC_POS corregido**.
- `/var/www/sactel.lan/rutas/src/pages/cajero/CajeroDashboard.tsx`: integración DIAN + impresión.
- `/var/www/sactel.lan/rutas/src/services/dianService.ts` (`emitirTiqueteTransporte`) y `src/services/travelsoftService.ts`.
- `/var/www/sactel.lan/rutas/src/pages/admin/views/ResolutionsManagementView.tsx`, `src/pages/admin/agencia-views/LocalResolutionsView.tsx`, `src/components/resoluciones/ResolucionFormDialog.tsx`.
- Herramientas de prueba: `/tmp/opencode/gen_ticket.mjs`, `/tmp/opencode/ticketFormatter.cjs` (bundled), `/tmp/opencode/ticket.txt` (bug) y `ticket2.txt` (corregido), `/tmp/opencode/token.txt`.
