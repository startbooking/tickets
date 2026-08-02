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
- (ninguno — Core DIAN expuesto pero sin emitir CUFE todavía; impresión física validada tras fix de USB 2026-08-01)

### Blocked (emisión CUFE real)
- ~~Core DIAN caído~~ → **RESUELTO 2026-08-01**: `backend.sactel.lan` no resolvía (el wildcard `*.sactel.lan` de /etc/hosts no aplica). Se agregó `127.0.0.1 backend.sactel.lan` a `/etc/hosts` y vhost Apache `backend.sactel.lan.conf` → proxy `127.0.0.1:8008` (SACTel Cloud FE Engine, `/var/www/backend.lan/dian-fe`). Script idempotente: `/tmp/opencode/levantar_backend_dian.sh`. Verificado: `GET /api/v1/empresas` → 200; `POST /api/v1/tiquete-transporte/emitir` con token → 422 (validación de esquema, auth OK).
- **Falta configurar el Core para emitir CUFE** (BD `facturacore_db`): `api_keys` id=6 valida el token (`sk_live_7777777…`, empresa_id=6 NIT `777777777` "OTRA EMPRESA TEST", ambiente 2=pruebas, 1100 folios, 0 consumidos) pero **`resoluciones` está vacía** y **`certificados_digitales` está vacío** → `_obtener_empresa_y_resolucion` y `_firmar_y_enviar` fallarían (400). Además `DIAN_SOFTWARE_ID`/`DIAN_SOFTWARE_PASSWORD` están comentados en `dian-fe/.env`.

## Next Move
1. Confirmar físicamente que el feed del tiquete corregido es de ~6 líneas (se imprimió el ticket corregido: 604 bytes).
2. Probar emisión real CUFE/QR: insertar resolución `TIQUETE_TRANSPORTE` para empresa 6 en `facturacore_db`, cargar certificado digital activo/vigente, configurar `DIAN_SOFTWARE_ID`/pin de habilitación y disparar `POST /tiquete-transporte/emitir`.
3. (A largo plazo) Introducir los datos reales de la resolución DIAN tras las pruebas.
4. ~~Revisar `git status` y decidir commit~~ → **Hecho 2026-08-01**: commit `3860d35` (18 archivos, 2949 inserciones). Verificación previa: `tsc --noEmit` 0 errores, `npm run build` OK, `lint` solo 1 warning preexistente.

## Mock resoluciones DIAN (2026-08-01)
Resoluciones de prueba en BD `travelSoft.resoluciones` para las agencias operativas (con cajeros):
`id 5` BOGOTA `18764000000001` FSV (consec 4) · `id 6` TOCAIMA `...02` TCM · `id 7` LA MESA `...03` LMA · `id 8` IBAGUE `...04` IBA · `id 9` GIRARDOT `...05` GRD · `id 10` MOSQUERA `...06` MSQ · `id 11` PTO BERRIO `...07` PTB · `id 12` PTO BOYACA `...08` PBA · `id 13` APULO `...09` APL · `id 14` ANAPOIMA `...10` ANP · `id 15` HONDA `...11` HDA · `id 16` HOSPICIO `...12` HSP. Rango 1–1.000.000, vigencia 2026-01-01→2027-12-31, activas, notas "Resolución de prueba (mock DIAN)". La venta de un tiquete usa la resolución activa de la agencia del cajero.
**Verificación impresión (flujo completo)**: login cajero `79.404.593` → venta ruta 1 (BOGOTA→ZIPACON, EQQ-031, puesto 1, doc 79900002, $14.000) → `numero_factura=FSV3`, `resolucion_numero=18764000000001` → ESC/POS 481 bytes → `POST /impresion/ticket` → **HTTP 200, impresora TMU, 481 bytes** (sin CUFE/QR: el Core aún no emite).
Notas: (a) `POST /ventas/tiquete` devuelve `id_planilla: 0` (bug menor: `cursor.lastrowid` se pierde tras `SELECT LAST_INSERT_ID()`; la fila sí se inserta, ej. `45470144`); (b) hubo venta concurrente de otro usuario (`80.799.518-2`, FSV4, planilla `45470145`) — el entorno está en uso.

## Fix impresión "tiquetes no salen" (2026-08-01, 10:00–10:07)
**Síntoma**: la API devuelve 200 (job en cola CUPS) pero la impresora no imprime. `lpstat -t`: "la impresora TMU está inactiva"; jobs TMU-24/25/26 retenidos ("held for 300 seconds").
**Causa raíz**: el dispositivo USB quedó **atascado** (endpoint bulk OUT estancado / estado xhci corrupto). `/var/log/cups/error_log`: `usb.core.USBError: [Errno 2] Entity not found` en `dev.set_configuration()` (línea 32 del backend antiguo) → job falla y CUPS lo retiene. En `dmesg`: `Trying to add endpoint 0x1 without dropping it` + errores de enumeración ("Maybe the USB cable is bad?") en `usb 1-1` (09:55–09:56, justo al imprimir). Confirmado por test directo pyusb como root: `set_configuration` → NOT_FOUND, `write` → EIO.
**Solución aplicada**:
1. **Reset USB físico-lógico** del dispositivo (`/sys/bus/usb/devices/1-2`): toggle `authorized` 0→1 y luego `dev.reset()` (pyusb, root). El device pasó de `Driver=[none]` a `Driver=usblp` y volvió a responder: `write OK` (2 bytes init, luego 481 bytes del tiquete FSV3). Se cancelaron los jobs atascados.
2. **Hardening `/usr/lib/cups/backend/tmu`** (reescrito, root:root 755): `set_configuration()` tolerante (try/except, se continúa si ya está configurado); si la escritura falla → **`dev.reset()` + reintento automático**; `release_interface`+`dispose_resources` siempre (el backend viejo no hacía dispose, contribuyendo a corromper xhci). Contrato CUPS intacto (archivo en `argv[6]` cuando hay 7 args, o stdin).
3. **`app/services/printer.py`** (fallback pyusb): `set_configuration()` con try/except y reintento tras `dev.reset()` en caso de error de escritura; guard de `dev is None`.
4. **Reinicio** `systemctl restart travelsoft.service`.
**Verificación**: `lp -d TMU -o raw ticket_verificacion.txt` → TMU-27 y TMU-28 (vía API) "exited with no errors" / "Job completed", cola vacía. Impresión física OK. Nota: `/dev/usb/lp0` NO se crea (interfaz vendor-specific 0xFF, usblp no la gestiona; usar siempre el backend pyusb).

## Panel Agencia Satélite (2026-08-02) — PENDIENTE DE COMMIT
Flujo completo de la agencia satélite (PDA / móvil) verificado end-to-end contra `travelsoft.backend.lan`:
- **Backend** (en `/var/www/backend.lan/travelsoft`, no es repo git):
  - `_tipo_agencia(id_orides)`: "principal" si es origen/destino de alguna ruta; si no, "satelite".
  - `GET /dashboard/satelite` (403 si la agencia no es satélite): rutas con `intermedio_ruta = agencia` + tramos (→agencia y →destino final) con tarifa vía `_tarifa_valor`.
  - `GET /ventas/satelite/sillas?cod_ruta=&fecha=`: croquis (capacidad del vehículo), ocupadas desde `planillas`.
  - `POST /ventas/satelite/tiquete`: valida origen=titular de la ruta y destino=agencia satélite o destino final; reusa `_persistir_venta` (resolución DIAN activa de la agencia → `numero_factura`).
  - `POST /llegadas/reportar` ampliado: `fecha_llegada`, `hora`, `conductor` (→`conduce_ruta`), `novedad` (→`novedad_llegada`), `estado_sitio` (EN_PARQUEADERO/EN_SITIO) → `rutas.estado_sitio`/`fecha_llegada`/`novedad_llegada`; `_get_ruta_intermedio` para satélites.
- **Frontend** (sin commit): `src/pages/satelite/SateliteDashboard.tsx` (inicio de turno local en localStorage `sateliteTurno`, reloj PDA, lista de vehículos de hoy con tramos/tarifas, croquis de sillas, datos pasajero con búsqueda, forma de pago, valor manual, emisión DIAN + impresión con fallback, cierre de turno con desglose), ruta `/satelite` en `App.tsx`, `getDashboardPorNivel` → `/satelite` si `tipo_agencia==='satelite'`.
- **`CajeroDashboard.tsx`**: llegadas rediseñadas (tarjetas En Tránsito / Llegados), diálogo `DialogoRegistrarLlegada` con fecha/hora/conductor/novedad/estado del sitio, `SitioBadge`. Sillas del vehículo movidas al paso 3 (pasajero primero).
- **Verificación**: usuario de prueba `99999` / `quipile2026` (ADMIN, QUIPILE id 11, `tipo_agencia=satelite`). Ruta 548 (2026-04-19, BOGOTA→LA VIRGEN, pasa por QUIPILE): dashboard → 4 vehículos; sillas TTO-218 capacidad 24; venta puesto 1 (79900003) sin resolución (sin factura) y puesto 2 (79900004) → **`numero_factura=QPL2`**, `resolucion_numero=18764000000013`. Impresión física OK: 443 bytes cola TMU.
- **Resolución mock nueva**: id 17, agencia 11 (QUIPILE), `18764000000013`, prefijo `QPL`, consec 1, vigencia 2026-01-01→2027-12-31, activa.
- Frontend: `tsc --noEmit` 0 errores, `npm run build` OK, `eslint` 0 errores en archivos tocados. `dist/` reconstruido.
- El login del backend devuelve `tipo_agencia` en `data.user` → AuthContext lo propaga (spread) → el panel satélite se valida con 403→redirección si la cuenta no es satélite.

## Relevant Files
- `/var/www/backend.lan/travelsoft/app/api/printer.py` + `app/api/travel.py` (`GET/POST /resoluciones/agencia`, `PUT/DELETE /resoluciones/agencia/{id}`, `_get_resolucion_activa`, `_agencia_objetivo`, `_rol_usuario`, `_agencia_usuario`).
- `/var/www/backend.lan/travelsoft/app/services/printer.py`: CUPS cola TMU → pyusb; `_normalizar_texto` sin NFD, encoding latin-1 byte-fiel.
- `/var/www/backend.lan/travelsoft/app/schemas/travel_schema.py`: `LoginRequest` (**campo `password`**), `TicketPrintRequest`, `ResolucionCreate/Update`.
- `/var/www/sactel.lan/rutas/src/utils/ticketFormatter.ts`: `generateTicketTXT` + `qrEscPos` + `normalizarImpresion` + **ESC_POS corregido**.
- `/var/www/sactel.lan/rutas/src/pages/cajero/CajeroDashboard.tsx`: integración DIAN + impresión + llegadas con novedad/estado del sitio.
- `/var/www/sactel.lan/rutas/src/pages/satelite/SateliteDashboard.tsx`: panel móvil de agencia satélite (solo venta).
- `/var/www/sactel.lan/rutas/src/services/dianService.ts` (`emitirTiqueteTransporte`) y `src/services/travelsoftService.ts` (tipos y endpoints satélite).
- `/var/www/sactel.lan/rutas/src/pages/admin/views/ResolutionsManagementView.tsx`, `src/pages/admin/agencia-views/LocalResolutionsView.tsx`, `src/components/resoluciones/ResolucionFormDialog.tsx`.
- Herramientas de prueba: `/tmp/opencode/gen_ticket.mjs`, `/tmp/opencode/ticketFormatter.cjs` (bundled), `/tmp/opencode/ticket.txt` (bug) y `ticket2.txt` (corregido), `/tmp/opencode/token.txt`.
