# Configuración del móvil Android — Impresión directa de tiquetes (ESC/POS)

Guía de referencia (`android-printing.config.json`) para operar la impresión de
tiquetes del panel de Agencia Satélite desde un teléfono/tablet Android.

## 1. Requisitos del dispositivo

| Ítem | Requisito |
|------|-----------|
| OS | Android 8.0+ (para Web Bluetooth estable) |
| Navegador | **Chrome** o **Chromium** (no iOS Safari; allí usar RawBT) |
| Bluetooth | BLE 4.0+ |
| Permisos | Bluetooth, Bluetooth admin, Localización (necesario para escaneo BLE en Android) |
| Red | Conectado a la LAN de SACTel (`192.168.40.0/24`) |

## 2. Emparejar la impresora térmica BLE

1. Enciende la impresora ESC/POS (ej. MP-T80, KPT-280, TM-T20III-BLE).
2. Pon la impresora en modo emparejamiento (suele ser `MODE` + `POWER`).
3. En el móvil: **Ajustes → Bluetooth → Buscar dispositivos** → empareja con la
   impresora (aparece como `Printer-XXXX` o similar). Confirma el código PIN
   (`0000`/`1234` según el fabricante).

> No es necesario emparejar desde ajustes si la PWA abre el selector de Web
> Bluetooth directamente, pero emparejar con antelicipación acelera el flujo y
> evita diálogos repetidos.

## 3. Acceder a la PWA

- URL directa (sin DNS `.lan`): **`http://192.168.40.2`**
  - Vhost Apache: `tickets.sactel.lan` con `ServerAlias 192.168.40.2 192.168.40.3`,
    `DocumentRoot /var/www/sactel.lan/rutas/dist`.
- La PWA funciona sobre HTTP, pero **la instalación “de verdad” (ícono en
  pantalla principal + Service Worker offline) requiere HTTPS o localhost**,
  porque Web Bluetooth y el registro del SW sólo se permiten en contextos
  seguros. En HTTP la app funciona como web normal.

> Para habilitar HTTPS local: montar un vhost SSL con certificado interno y
> agregar `192.168.40.2 tickets.sactel.lan` en los hosts del móvil
> (o usar `dns-sd`/`mDNS`).

## 4. Cadena de respaldo de impresión (unificada)

`useTicketFiscal` (`src/hooks/useTicketFiscal.ts`) intenta en orden:

1. **USB (servidor)** — `POST /api/v1/impresion/ticket` → CUPS cola `TMU`.
   Impresión silenciosa. **No disponible directamente desde el móvil** (el
   backend la ejecuta en el servidor donde está conectada la impresora USB).
2. **Bluetooth directo (Web Bluetooth)** — `imprimirBleEscPos` en
   `src/utils/ticketFormatter.ts`. UUIDs: servicio `0xFFE0`, característica
   `0xFFE1`, MTU 20 bytes (se envía en trozos de 20). **Ruta preferida en
   móvil Android con Chrome**.
3. **RawBT (intent)** — si Android no soporta/expone Web Bluetooth, se abre el
   `intent://base64,...#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`
   (app RawBT debe estar instalada y la impresora emparejada como Bluetooth clásico).
4. **window.print()** — último recurso: diálogo del navegador.

### Detectar el medio usado

`imprimirTicket` / `reimprimirVenta` devuelven `'usb' | 'ble' | 'rawbt' | 'print' | 'error'`,
para que el UI muestre al usuario el canal de salida empleado.

## 5. Variables de entorno (build de producción)

| Variable | Valor | Comentario |
|----------|-------|-----------|
| `VITE_TICKETS_BACKEND_URL` | `/api/v1` | Mismo origen (proxy Apache) |
| `VITE_BACKEND_DIAN_URL` | `http://backend.sactel.lan/api/v1` | Core fiscal |
| `VITE_EMPRESA_TOKEN` | `sk_live_…` | Token de la empresa en facturacore_db |
| `VITE_DIAN_ENVIRONMENT` | `test` | Ambiente de la DIAN |

## 6. Verificación rápida

1. Login cajero satélite: `{ cedula_usuario: "99999", password: "quipile2026" }`.
2. Inicia turno → vende un tiquete (elige silla + tramo).
3. Al generar, el primer medio disponible imprime:
   - En móvil con BLE: aparece el selector de impresora → la tiqueta imprime en 1-2 s.
   - Si BLE falla: RawBT abre → imprimirBT → vuelve a la PWA.
4. `GET /impresion/estado` → confirma la impresora del servidor.

## 7. Solución de problemas BLE

| Síntoma | Causa | Solución |
|---------|-------|----------|
| “Web Bluetooth no disponible” | iOS o Chrome sin flag | Usar Android + Chrome, o activar `chrome://flags/#enable-web-bluetooth-seconds-permission` (Chrome < 100) |
| El selector no muestra la impresora | No emparejada / Bluetooth off | Emparejar primero desde Ajustes y volver a autorizar |
| Trozo de 20 bytes falla | Impresora requiere `writeValue` (no `WithoutResponse`) | El código reintenta con `writeValue` si `writeValueWithoutResponse` falla |
| Nada imprime (USB) | CUPS `TMU` inactiva | Ver script de reset USB en `docs/SESION.md` (fix “tiquetes no salen”) |
