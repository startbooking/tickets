# Resumen de sesión — Impresión en PDA Sunmi (proyecto tickets SACTel / Flota San Vicente)

Fecha: 2026-08-06. Todo en español.

## Objetivo
Configurar la impresión del tiquete en la impresora térmica **integrada** de la PDA
**Sunmi V2 SE** (Android 12 Go / SUNMI OS, impresora 58 mm).

## Estado del proyecto
- Frontend React/Vite + TS: `/var/www/sactel.lan/rutas`
- Backend FastAPI: `/var/www/backend.lan/travelsoft` (puerto 8005) — provider alguna.
- Git remote: `https://github.com/startbooking/tickets.git`, rama `main`. **Sincronizado** (push hecho, HEAD = `b76e720`).
- Comunicación/código en **español**.

## Hallazgo técnico crucial (impresora integrada)
- La impresora integrada **"InnerPrinter"** es un dispositivo **Bluetooth Clásico SPP**
  (UUID `00001101-0000-1000-8000-00805F9B34FB`), NO BLE.
- **Web Bluetooth (`navigator.bluetooth`) NO alcanza SPP** → por eso falla con
  `Failed to execute 'requestDevice' on 'Bluetooth'`.
- Vías que SÍ funcionan desde web en navegador:
  1. **RawBT** (app, package `ru.a402d.rawbtprinter`) vía intent `rawbt://base64,…`. Play Store: https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter
  2. **Plugin JS USDK** (Sun Store) → WebSocket `ws://localhost:7070/ws`, imprime directo a la integrada.

## Cadena de impresión actual
`useTicketFiscal.imprimirConRespalado`:
- En Android: **Servicio WS local (app "PDA Print Service") → Integrada (JS USDK) → USB (servidor CUPS/pyusb) → RawBT (SPP/InnerPrinter) → window.print()**
- En escritorio: USB → Web Bluetooth → window.print()
- Resultados (`ImpresionResultado`): `'pda' | 'sunmi' | 'usb' | 'ble' | 'rawbt' | 'print' | 'error'`

## Impresión local WebSocket (concepto "app ligera en la PDA") [NUEVO]
- Una app Android (`pda-websocket-printer/`) abre un WebSocket en `ws://127.0.0.1:8091`
  y, al recibir `{action:"PRINT", data:"<base64 ESC/POS>"}`, imprime directo a la integrada
  por Bluetooth SPP "InnerPrinter" — sin diálogos, sin RawBT, sin plugin JS USDK.
  (El escritorio usa el mini-servicio Python `desktop-print-service/` en `ws://127.0.0.1:8090`.)
- Lado web: `src/services/pdaWebSocketService.ts` (cliente WS), se integra como PRIMERA
  opción en la cadena de impresión (Android y escritorio).
- Proyecto Android: `pda-websocket-printer/` (Kotlin, Foreground Service + WebSocketServer
  + `PrinterDriver` SPP), con README de build/instalación.
- Requisito operativo: instalar el APK en la PDA e iniciar el servicio (permisos Bluetooth).
- Puertos de impresión: escritorio 8090, PDA Android 8091. El 8080 queda libre.

## Archivos modificados/creados
- `src/services/pdaWebSocketService.ts`: cliente WebSocket local (puerto 8090 escritorio / 8091 PDA).
- `desktop-print-service/`: mini-servicio Python de impresión local del escritorio (puerto 8090).
- `pda-websocket-printer/`: proyecto Android (Kotlin) del "PDA Print Service".
- `src/services/sunmiPrinter.ts`: integración plugin JS USDK. Sonda real al WebSocket 7070
  (sondear a ws no depende del userAgent), cache de disponibilidad, `imprimirSunmi`,
  `validarImpresoraSunmi`, `imprimirTestSunmi`, `integradaSunmiDisponible`,
  `reiniciarCacheSunmi`, `MENSAJE_PLUGIN_AUSENTE`.
- `src/utils/ticketFormatter.ts`: `imprimirRawBtEscPos()`, `imprimirTestRawBt()`.
- `src/hooks/useTicketFiscal.ts`: cadena de impresión reordenada (móvil→RawBT).
- `src/pages/cajero/CajeroDashboard.tsx`: botón "Test Impresora" para Android moderno
  (integra → RawBT), label impresora.
- `rawbt_pda.txt`: notas técnicas de impresión RawBT/InnerPrinter.
- `src/services/ticketFiscalService.ts`: tipo `ImpresionResultado` con `'sunmi'`.
- `package.json`/`package-lock.json`: añadidos `sunmi-js-sdk` (1.0.53) y `@testing-library/dom` (10.4.1).

## Toolchain restaurado (importante)
El repo de HEAD tenía package.json inconsistente con el lockfile (Tailwind 3.4/vite8/TS7 vs
lock Tailwind 3.4, vite 5.4, TS 5.8). ALINEÉ package.json a las versiones del lockfile para
que build/tsc/eslint vuelvan a funcionar:
- tailwindcss 3.4.17, vite 5.4.19, TypeScript 5.8.3, eslint 9.32.0, react 18.3.1, vitest 3.2.4.
- Instalar con `npm install --legacy-peer-deps` (evita conflicto ERESOLVE).
- Verificación: build OK, `tsc --noEmit` OK, eslint OK (2 warnings pre-existentes), 75 tests OK.

## Versión 005 (2026-08-07) — Responsive + manifiesto de despacho + informe cajero
### Cambios frontend
- **Dashboards responsivos**: los 4 dashboards (`CajeroDashboard`, `SuperAdminDashboard`,
  `AgenciaAdminDashboard`, `DespachadorDashboard`) ahora tienen sidebar colapsable en móvil
  con botón hamburguesa, backdrop y drawer deslizante. Altura usa `h-screen-dyn` (100dvh).
- **Fix parpadeo mobile**: se quitó `motion-safe:delay-75` del drawer en los 4 dashboards.
  El delay hacía que el drawer apareciera completo 75ms y luego la animación lo "reiniciara"
  a opacity 0/translateX(-100%), generando un flash visible al abrir. Ahora la animación
  arranca de inmediato desde el estado inicial (`fade-in` + `slide-in-from-left`, sin delay).
- **Informe de cierre de cajero**: `getVentasCajero(fecha)` (GET `/ventas/cajero`) + UI en
  `SubViewCierre`. Nuevo tipo `VentaCajero`.
- **Manifiesto de despacho** (requisito legal de despachador):
  - Backend (TravelSoft): `getManifiestoDespacho(cod_ruta, fecha)` → GET `/despacho/manifiesto`.
  - Nuevos tipos `ManifiestoPasajero`, `ManifiestoDespacho`.
  - Construcción de 2 documentos ESC/POS en `ticketFiscalService.ts`:
    - A) `manifiestoListadoTexto` → listado de pasajeros ordenado por silla.
    - B) `manifiestoTotalesTexto` → documento de despacho (vehículo, conductores, auxiliar, totales).
  - Impresión vía `useTicketFiscal.imprimirTexto(texto)` (nuevo), que reusa la cadena de respaldo
    `imprimirConRespalado`. Botón "Despachar" en `DespachadorDashboard`.
- **APK SACTel WebView**: se renombró la app (`label` = "SACTel Sistema de Tickets on Line")
  y se añadió `android:icon`/`roundIcon`. El APK carga `https://tickets.sactel.cloud` en WebView,
  por lo que NO embebe el dist y no requiere rebuild para los cambios de frontend. Solo se
  reconstruye si cambia el manifest/código Kotlin. Retirado el APK viejo de `dist/`.

### Verificación (versión 005)
- `tsc --noEmit` OK (0 errores), `npm run build` OK, `npm test` (78 tests) OK.
- ZIP generado: `dist/tickets-version-005.zip` (~1.2 MB).
- Despliegue web de referencia: `index-C7PcZwck.js`. El APK en vivo apunta a la web, así que la
  corrección del parpadeo llega a la PDA al subir el dist y recargar la app.

## Build/despliegue
- `npm run build` → `dist/` (PWA/service worker incluido).
- ZIP más reciente: `dist/tickets-version-005.zip` (~1.2 MB). Subir descomprimiendo el
  contenido en la raíz del servidor (`assets/`, `index.html`, `sw.js`), limpiando JS viejos.

## Próximos pasos pendientes
1. **En la PDA**: instalar **RawBT** (Play Store) y, en RawBT, elegir como impresora **InnerPrinter**
   (la Sunmi ya la tiene emparejada). Alternativa: instalar el plugin **JS USB** en la Sun Store.
2. Usar el botón "Test Impresora" del cajero para verificar (imprime direct por RawBT o integrada si hay plugin).
3. Probar venta real y confirmar el tiquete por la integrada.
4. (Sesión) Puedes preguntar si deseas priorizar solo el plugin JS USB (debe estar instalado) y dejar RawBT
   solo como fallback, o el estado actual (intenta JS USB y sino RawBT).

## Notas del git
- Último commit documentado: `d508ccc` (venta multi-silla + lazy-loading dashboards).
- Este commit pendiente incluye: manifiesto de despacho, informe de cajero, dashboards
  responsivos, fix parpadeo drawer, manifest/icono del APK de WebView.