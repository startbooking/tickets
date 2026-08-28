📦 Instalación y Desinstalación
Opción A: Instaladores Automáticos (Recomendado)
Windows (instalar_windows.bat)

    Haz doble clic en instalar_windows.bat.

    El script detectará Python, actualizará pip, instalará las dependencias de requirements.txt (websockets, pywin32, pyinstaller), solicitará opcionalmente el nombre de la impresora y creará el acceso directo de inicio automático sin ventana (pythonw).

    Validará la disponibilidad del puerto WebSocket en ws://127.0.0.1:8090.

Para desinstalar: Ejecuta desinstalar_windows.bat (elimina el acceso directo de Startup, detiene el proceso print_service.py y remueve los archivos).
Linux (./instalar_linux.sh)

    Otorga permisos de ejecución y ejecuta:
    Bash

    chmod +x instalar_linux.sh
    ./instalar_linux.sh

    Crea automáticamente un entorno virtual en .venv, instala websockets y registra una unidad systemd --user.

    El servicio iniciará de inmediato y sobrevivirá a los reinicios de sesión.

Para desinstalar: Ejecuta ./desinstalar_linux.sh.
Opción B: Instalación Manual

    Clonar / Copiar los archivos del proyecto a la carpeta local.

    Instalar las dependencias según el sistema operativo:
    Bash

    py -m pip install -r requirements.txt

    Ejecutar el servicio desde la consola:
    Bash

    # Autodetección de impresora
    python print_service.py

    # Impresora específica en Windows
    python print_service.py --printer "EPSON TM-T20III"

    # Cola CUPS específica en Linux
    python print_service.py --printer TMU --port 8090

🧪 Modo Pruebas (Mock Mode)

Si estás desarrollando y no dispones de una impresora física conectada:
Bash

python print_service.py --mock

En este modo, el servidor responderá exitosamente a la app React y volcará el contenido del ticket recibido directamente en el archivo logs/ultimo_ticket.bin.
🛠️ Diagnóstico y Errores Frecuentes

    Error: "No se encontró una impresora"

        Verifica que la impresora esté encendida y visible en Windows (Configuración > Impresoras y escáneres).

        En PowerShell, obtén el nombre exacto con Get-Printer | Select-Object Name e inícialo usando --printer "NOMBRE_EXACTO".

    Error: "pip no se reconoce como un comando interno"

        Utiliza el lanzador nativo de Python: py -m pip install -r requirements.txt.

    Permiso denegado en /dev/usb/lp0 (Linux):

        Agrega tu usuario al grupo lp: sudo usermod -aG lp $USER y vuelve a iniciar sesión.
        """

with open("README.md", "w", encoding="utf-8") as f:
f.write(readme_content)

print("README.md generado con éxito.")


```text?code_stdout&code_event_index=1
README.md generado con éxito.

Aquí tienes la versión actualizada del README.md, adaptada con todas las optimizaciones, módulos nuevos (entornos virtuales isolados en Linux, empaquetado con PyInstaller, desinstaladores dedicados, filtrado de impresoras virtuales y manejo de dependencias avanzadas):


Desktop Print Service (WebSocket local → impresora térmica del PC)Mini-servicio multiplataforma de impresión local de alto rendimiento para escritorio (Windows y Linux).Sustituye el fallback "USB (servidor pyusb/CUPS)" cuando el backend corre en la nube o hosting (sin acceso a la impresora USB local): la app React de tickets/POS se conecta a ws://127.0.0.1:8090 y este servicio escribe los bytes ESC/POS (RAW) directamente a la impresora térmica instalada en el equipo del cajero.Es la contraparte para escritorio de pda-websocket-printer/ (app Android para PDAs Sunmi), compartiendo la misma especificidad de protocolo y cliente en React (src/services/pdaWebSocketService.ts).🚀 Novedades y Mejoras RecientesFiltro de Impresoras Virtuales: Autodetección inteligente en Windows que descarta automáticamente dispositivos no físicos (Microsoft Print to PDF, XPS, OneNote, Fax).Aislamiento por Entorno Virtual (.venv en Linux): Instalador de Linux adaptado a estándares PEP 668 (compatibilidad garantizada con Ubuntu 24.04+, Debian 12+, Fedora, etc.).Instalación y Manejo de Dependencias Robusto: Soporte nativo para pyinstaller y gestión condicional por plataforma (sys_platform) en requirements.txt.Ejecución Silenciosa y Autoreinicio:Windows: Ejecución desacoplada mediante pythonw sin ventanas flotantes y enlace en shell:startup.Linux: Servicio de usuario systemd (desktop-print-service.service) con política on-failure y persistencia loginctl linger.Desinstaladores Limpios: Scripts dedicados (desinstalar_windows.bat y desinstalar_linux.sh) para remoción total de servicios, accesos directos y carpetas temporales.🛠️ Requisitos del SistemaPython: 3.8 o superior (en Windows marcar "Add Python to PATH" durante la instalación).Librerías / Dependencias (requirements.txt):websockets>=12.0 (Servidor WebSocket ligero y asíncrono)pywin32>=306 (Exclusivo para Windows: interacción con la API de Spooler win32print)pyinstaller>=6.0.0 (Exclusivo para Windows: empaquetado a ejecutable independiente .exe)📋 Arquitectura y Backend por SOPlataformaMétodo / BackendDescripción / ObservacionesWindowswin32print RAWSpooler directo de Windows. Soporta autodetección por keywords (TM-, XPRINTER, TICKET, etc.) o asignación por --printer.Linux (CUPS)lp -d <cola> -o rawImpresión asíncrona mediante colas RAW en el servidor de impresión local CUPS.Linux (RAW Directo)/dev/usb/lp*Fallback cuando CUPS no está instalado. Requiere permisos en grupo: sudo usermod -aG lp $USER.Mock (Pruebas)logs/ultimo_ticket.binVuelco local de bytes en disco sin requerir una impresora física conectada.💬 Protocolo WebSocketEl protocolo es 100% equivalente al de la aplicación Android PDA Print Service:1. Enviar Trabajo de Impresión (PRINT)Petición:JSON{
  "action": "PRINT",
  "data": "<cadena base64 de los bytes ESC/POS>",
  "copies": 1
}
Respuesta (Éxito):JSON{ "code": 0, "message": "ok" }
Respuesta (Error):JSON{ "code": 1, "message": "Fallo al imprimir en Windows ('EPSON'): Error..." }
2. Comprobación de Estado (PING)Petición: { "action": "PING" }Respuesta: { "code": 0, "message": "pong" }📦 Instalación y DesinstalaciónOpción A: Instaladores Automáticos (Recomendado)Windows (instalar_windows.bat)Haz doble clic en instalar_windows.bat.El script detectará Python, actualizará pip, instalará las dependencias de requirements.txt (websockets, pywin32, pyinstaller), solicitará opcionalmente el nombre de la impresora y creará el acceso directo de inicio automático sin ventana (pythonw).Validará la disponibilidad del puerto WebSocket en ws://127.0.0.1:8090.Para desinstalar: Ejecuta desinstalar_windows.bat (elimina el acceso directo de Startup, detiene el proceso print_service.py y remueve los archivos).Linux (./instalar_linux.sh)Otorga permisos de ejecución y ejecuta:Bashchmod +x instalar_linux.sh
./instalar_linux.sh
Crea automáticamente un entorno virtual en .venv, instala websockets y registra una unidad systemd --user.El servicio iniciará de inmediato y sobrevivirá a los reinicios de sesión.Para desinstalar: Ejecuta ./desinstalar_linux.sh.Opción B: Instalación ManualClonar / Copiar los archivos del proyecto a la carpeta local.Instalar las dependencias según el sistema operativo:Bashpy -m pip install -r requirements.txt
Ejecutar el servicio desde la consola:Bash# Autodetección de impresora
python print_service.py

# Impresora específica en Windows
python print_service.py --printer "EPSON TM-T20III"

# Cola CUPS específica en Linux
python print_service.py --printer TMU --port 8090
🧪 Modo Pruebas (Mock Mode)Si estás desarrollando y no dispones de una impresora física conectada:Bashpython print_service.py --mock
En este modo, el servidor responderá exitosamente a la app React y volcará el contenido del ticket recibido directamente en el archivo logs/ultimo_ticket.bin.🛠️ Diagnóstico y Errores FrecuentesError: "No se encontró una impresora"Verifica que la impresora esté encendida y visible en Windows (Configuración > Impresoras y escáneres).En PowerShell, obtén el nombre exacto con Get-Printer | Select-Object Name e inícialo usando --printer "NOMBRE_EXACTO".Error: "pip no se reconoce como un comando interno"Utiliza el lanzador nativo de Python: py -m pip install -r requirements.txt.Permiso denegado en /dev/usb/lp0 (Linux):Agrega tu usuario al grupo lp: sudo usermod -aG lp $USER y vuelve a iniciar sesión.