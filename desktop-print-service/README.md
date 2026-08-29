# Desktop Print Service (WebSocket local → impresora térmica del PC)

Mini-servicio multiplataforma de impresión local de alto rendimiento para **escritorio** (Windows y Linux). 

Sustituye el fallback "USB (servidor pyusb/CUPS)" cuando el backend corre en la nube o hosting (sin acceso a la impresora USB local): la app React de tickets/POS se conecta a `ws://127.0.0.1:8090` y este servicio escribe los bytes **ESC/POS (RAW)** directamente a la impresora térmica instalada en el equipo del cajero.

Es la contraparte para escritorio de `pda-websocket-printer/` (app Android para PDAs Sunmi), compartiendo la misma especificidad de protocolo y cliente en React (`src/services/pdaWebSocketService.ts`).

---

## 🚀 Novedades y Mejoras Recientes

- **Filtro de Impresoras Virtuales:** Autodetección inteligente en Windows que descarta automáticamente dispositivos no físicos (*Microsoft Print to PDF, XPS, OneNote, Fax*).
- **Aislamiento por Entorno Virtual (`.venv` en Linux):** Instalador de Linux adaptado a estándares **PEP 668** (compatibilidad garantizada con Ubuntu 24.04+, Debian 12+, Fedora, etc.).
- **Instalación y Manejo de Dependencias Robusto:** Soporte nativo para `pyinstaller` y gestión condicional por plataforma (`sys_platform`) en `requirements.txt`.
- **Ejecución Silenciosa y Autoreinicio:** 
  - **Windows:** Ejecución desacoplada mediante `pythonw` sin ventanas flotantes y enlace en `shell:startup`.
  - **Linux:** Servicio de usuario `systemd` (`desktop-print-service.service`) con política `on-failure` y persistencia `loginctl linger`.
- **Desinstaladores Limpios:** Scripts dedicados (`desinstalar_windows.bat` y `desinstalar_linux.sh`) para remoción total de servicios, accesos directos y carpetas temporales.
- **Impresión Bluetooth SPP (Linux):** Soporte nativo para impresoras térmicas Bluetooth tipo SPP (p. ej. Bixolon SPP-R200III) vía BlueZ D-Bus, sin `root` ni `rfcomm`. Se activa pasando la **MAC** de la impresora como identificador (o dejando un enlace `/dev/rfcomm*` presente). Ver [Impresión Bluetooth SPP](#-impresión-bluetooth-spp-linux).

---

> **Nota de red (bind `0.0.0.0`):** El servicio escucha ahora en **todas las interfaces** (`0.0.0.0:8090`), no solo en `127.0.0.1`. Esto permite que el navegador del cajero, que puede correr en otra máquina de la LAN, alcance el equipo con la impresora Bluetooth. Por seguridad, mantén el puerto `8090` filtrado en el firewall del servidor y no lo expongas a Internet.

---

## 🛠️ Requisitos del Sistema

- **Python:** 3.8 o superior (en Windows marcar *"Add Python to PATH"* durante la instalación).
- **Librerías / Dependencias (`requirements.txt`):**
  - `websockets>=12.0` (Servidor WebSocket ligero y asíncrono)
  - `pywin32>=306` (Exclusivo para Windows: interacción con la API de Spooler `win32print`)
  - `pyinstaller>=6.0.0` (Exclusivo para Windows: empaquetado a ejecutable independiente `.exe`)
- **Solo Linux + Bluetooth SPP:** el helper `bixolon_spp_print.py` usa **D-Bus / GIO** del sistema (BlueZ). Requiere el Python del sistema con `dbus` y `gi` (NO se instala en el `.venv`):
  ```bash
  sudo apt install -y python3-dbus python3-gi
  ```
  El servicio detecta `/usr/bin/python3` automáticamente; si no existe, usa el intérprete con el que arrancó.

---

## 📋 Arquitectura y Backend por SO

| Plataforma | Método / Backend | Descripción / Observaciones |
| :--- | :--- | :--- |
| **Windows** | `win32print` RAW | Spooler directo de Windows. Soporta autodetección por keywords (`TM-`, `XPRINTER`, `TICKET`, etc.) o asignación por `--printer`. |
| **Linux (CUPS)** | `lp -d <cola> -o raw` | Impresión asíncrona mediante colas RAW en el servidor de impresión local CUPS. |
| **Linux (RAW Directo)** | `/dev/usb/lp*` | Fallback cuando CUPS no está instalado. Requiere permisos en grupo: `sudo usermod -aG lp $USER`. |
| **Linux (Bluetooth SPP)** | `bixolon_spp_print.py` (BlueZ D-Bus) | Impresoras térmicas Bluetooth SPP. Se invoca con la **MAC** como identificador (o si existe `/dev/rfcomm*`). No requiere `root` ni `rfcomm`. |
| **Mock (Pruebas)** | `logs/ultimo_ticket.bin` | Vuelco local de bytes en disco sin requerir una impresora física conectada. |

---

## 🔵 Impresión Bluetooth SPP (Linux)

El servicio puede imprimir en impresoras térmicas **Bluetooth SPP** (p. ej. Bixolon SPP-R200III) emparejadas con el equipo Linux, usando **BlueZ sobre D-Bus** a través del helper `bixolon_spp_print.py`. No hace falta `root` ni crear un puerto `rfcomm`.

### Activación

1. Empareja y confía en la impresora con Bluetooth (`bluetoothctl pair <MAC>` / `trust <MAC>`).
2. Instala los bindings de D-Bus/GIO del sistema (ver Requisitos).
3. Envía el trabajo con la **MAC** de la impresora como `identificador` (campo `printer` en CLI o MAC en el cliente React). El servicio reconoce el patrón `XX:XX:XX:XX:XX:XX` y enruta a SPP automáticamente:

   ```bash
   python print_service.py --printer 00:11:22:33:44:55
   ```

   También se selecciona si existe un enlace previo `/dev/rfcomm0|1|2` (se escribe RAW en el dispositivo).

El helper reintenta la conexión SPP (desconectando una sesión previa colgada en la impresora) y devuelve un error claro si no conecta, que el cliente React propaga al cajero.

> **Windows:** el modo SPP no está implementado; usa la impresora Bluetooth como cola Windows normal (win32print) o vía `/dev/...` no aplica.

---

## 💬 Protocolo WebSocket

El protocolo es 100% equivalente al de la aplicación Android PDA Print Service:

### 1. Enviar Trabajo de Impresión (PRINT)
- **Petición:**
  ```json
  {
    "action": "PRINT",
    "data": "<cadena base64 de los bytes ESC/POS>",
    "copies": 1
  }
  ```
- **Respuesta (Éxito):**
  ```json
  { "code": 0, "message": "ok" }
  ```
- **Respuesta (Error):**
  ```json
  { "code": 1, "message": "Fallo al imprimir en Windows ('EPSON'): Error..." }
  ```

### 2. Comprobación de Estado (PING)
- **Petición:** `{ "action": "PING" }`
- **Respuesta:** `{ "code": 0, "message": "pong" }`

---

## 📦 Instalación y Desinstalación

### Opción A: Instaladores Automáticos (Recomendado)

#### Windows (`instalar_windows.bat`)
1. Haz doble clic en `instalar_windows.bat`.
2. El script detectará Python, actualizará `pip`, instalará las dependencias de `requirements.txt` (`websockets`, `pywin32`, `pyinstaller`), solicitará opcionalmente el nombre de la impresora y creará el acceso directo de inicio automático sin ventana (`pythonw`).
3. Validará la disponibilidad del puerto WebSocket en `ws://127.0.0.1:8090`.

*Para desinstalar:* Ejecuta `desinstalar_windows.bat` (elimina el acceso directo de `Startup`, detiene el proceso `print_service.py` y remueve los archivos).

#### Linux (`./instalar_linux.sh`)
1. Otorga permisos de ejecución y ejecuta:
   ```bash
   chmod +x instalar_linux.sh
   ./instalar_linux.sh
   ```
2. Crea automáticamente un entorno virtual en `.venv`, instala `websockets` y registra una unidad `systemd --user`.
3. El servicio iniciará de inmediato y sobrevivirá a los reinicios de sesión.

*Para desinstalar:* Ejecuta `./desinstalar_linux.sh`.

---

### Opción B: Instalación Manual

1. Clonar / Copiar los archivos del proyecto a la carpeta local.
2. Instalar las dependencias según el sistema operativo:
   ```bash
   py -m pip install -r requirements.txt
   ```
3. Ejecutar el servicio desde la consola:
   ```bash
   # Autodetección de impresora
   python print_service.py

   # Impresora específica en Windows
   python print_service.py --printer "EPSON TM-T20III"

   # Cola CUPS específica en Linux
   python print_service.py --printer TMU --port 8090
   ```

---

## 🧪 Modo Pruebas (Mock Mode)

Si estás desarrollando y no dispones de una impresora física conectada:

```bash
python print_service.py --mock
```

En este modo, el servidor responderá exitosamente a la app React y volcará el contenido del ticket recibido directamente en el archivo `logs/ultimo_ticket.bin`.

---

## 🛠️ Diagnóstico y Errores Frecuentes

- **Error: *"No se encontró una impresora"***
  - Verifica que la impresora esté encendida y visible en Windows (**Configuración > Impresoras y escáneres**).
  - En PowerShell, obtén el nombre exacto con `Get-Printer | Select-Object Name` e inícialo usando `--printer "NOMBRE_EXACTO"`.
- **Error: *"pip no se reconoce como un comando interno"***
  - Utiliza el lanzador nativo de Python: `py -m pip install -r requirements.txt`.
- **Permiso denegado en `/dev/usb/lp0` (Linux):**
  - Agrega tu usuario al grupo lp: `sudo usermod -aG lp $USER` y vuelve a iniciar sesión.