# PDA Print Service (WebSocket local → impresora integrada Sunmi)

App Android ligera que hostea un servidor WebSocket en `ws://127.0.0.1:8080`
y imprime en la **impresora integrada (InnerPrinter)** de la Sunmi V2 SE **sin
abrir diálogos**. La app React de tickets se conecta y envía el ticket como base64.

## Cómo funciona

1. `PrintService` (Foreground Service) arranca un `WebSocketServer` en 127.0.0.1:8080.
2. `PrinterDriver` conecta por **Bluetooth SPP** al dispositivo virtual `InnerPrinter`
   (dirección `00:11:22:33:44:55`, UUID SPP `00001101-...-00805F9B34FB`) y escribe los bytes ESC/POS.
3. La web React envía el ticket por WebSocket (sin ventanas).

## Protocolo

```
→ { "action": "PRINT", "data": "<base64 del ESC/POS>", "copies": 1 }
← { "code": 0, "message": "ok" }
```
- `action` puede ser `PRINT` o `PING` (healthcheck: responde `pong`).
- El base64 es de los bytes ESC/POS generados por la app React (encodarEscPos).

## Cómo construir/instalar el APK

1. Abre esta carpeta en **Android Studio** (File → Open → `rutas/pda-websocket-printer`).
2. Acepta la descarga de dependencias (Gradle + Java-WebSocket).
3. Build → Build Bundle(s)/APK(s) → Build APK(s).
4. Copia el `.apk` a la PDA Sunmi e instálalo (permitir "orígenes desconocidos").
5. Abre la app **PDA Print Service** → pulsa "Iniciar servicio". El manifiesto pide
   permisos de Bluetooth; concédelos (configuración → Apps → permitir).
6. Verifica `ws://127.0.0.1:8080` responde (en la app verá "en línea").

## Notas para producción

- El Android Service usa SPP directo (no depende del plugin JS USDK ni de RawBT).
- Si la dirección virtual `00:11:22:33:44:55` no coincide con tu Sunmi, se busca por
  nombre `InnerPrinter` en los dispositivos emparejados (`PrinterDriver.buscarInnerPrinter`).
- La app web React ya intenta este servicio (prioridad) en la cadena de impresión:
  `src/services/pdaWebSocketService.ts` (puerto 8080, `PDA_WS_LABEL`).

## Estructura

```
app/build.gradle
app/src/main/AndroidManifest.xml
app/src/main/java/com/sactel/pdaprint/MainActivity.kt   → botón Iniciar
app/src/main/java/com/sactel/pdaprint/PrintService.kt   → Foreground Service + WebSocket
app/src/main/java/com/sactel/pdaprint/PrinterDriver.kt  → impresión SPP InnerPrinter
build.gradle
settings.gradle
gradle.properties
```