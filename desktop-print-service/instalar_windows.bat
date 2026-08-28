@echo off
REM =============================================================================
REM Instalador del Desktop Print Service (Windows)
REM -----------------------------------------------------------------------------
REM  - Valida la instalacion de Python 3.
REM  - Instala dependencias via pip (websockets, pywin32, pyinstaller).
REM  - Crea launcher silencioso y acceso directo en el Inicio (shell:startup).
REM  - Inicia el servicio inmediatamente y valida el puerto WebSocket.
REM =============================================================================

setlocal enabledelayedexpansion
set "DIR=%~dp0"
set "LAUNCHER=%DIR%iniciar_print_service.bat"
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

echo.
echo == Desktop Print Service - Instalador (Windows) ==
echo.

REM ---- 1) Validar interprete de Python ----
set "PYCMD="
py -3 -c "import sys" >nul 2>&1 && set "PYCMD=py -3"
if "%PYCMD%"=="" (
    python -c "import sys; sys.exit(0 if sys.version_info[0]==3 else 1)" >nul 2>&1 && set "PYCMD=python"
)

if "%PYCMD%"=="" (
    echo [X] Python 3 no se encuentra instalado o no esta agregado al PATH.
    echo     Descargue e instale Python 3 desde https://python.org
    echo     Asegurese de marcar "Add Python to PATH" durante la instalacion.
    pause
    exit /b 1
)

for /f "delims=" %%i in ('%PYCMD% -c "import sys; print(sys.version.split()[0])"') do set "PYVER=%%i"
echo [OK] Python %PYVER% detectado correctamente (%PYCMD%).

REM ---- 2) Instalacion y verificacion de dependencias Pip ----
echo.
echo == Instalando dependencias requeridas ==

echo -- Actualizando pip --
%PYCMD% -m pip install --upgrade pip >nul 2>&1

echo -- Instalando websockets, pywin32 y pyinstaller --
%PYCMD% -m pip install websockets pywin32 pyinstaller

REM Ejecutar script de post-instalacion de pywin32 si aplica
%PYCMD% -m pywin32_postinstall -install >nul 2>&1

REM ---- Validacion de paquetes ----
echo.
echo == Verificando instalacion de modulos ==

%PYCMD% -c "import websockets" >nul 2>&1
if errorlevel 1 (
    echo [X] Fallo la verificacion de 'websockets'.
    pause
    exit /b 1
) else (
    echo [OK] 'websockets' instalado correctamente.
)

%PYCMD% -c "import win32print" >nul 2>&1
if errorlevel 1 (
    echo [!] Advertencia: 'pywin32' no pudo cargarse correctamente.
) else (
    echo [OK] 'pywin32' instalado correctamente.
)

%PYCMD% -m PyInstaller --version >nul 2>&1
if errorlevel 1 (
    echo [!] Advertencia: 'pyinstaller' no esta disponible en la linea de comandos.
) else (
    echo [OK] 'pyinstaller' instalado correctamente.
)

REM ---- 3) Impresora y puerto ----
echo.
set "PRINTER_NAME="
set /p PRINTER_NAME=Nombre de la impresora (Enter para autodetectar): 
set "PRINTER_ARG="
if not "%PRINTER_NAME%"=="" set "PRINTER_ARG=--printer "%PRINTER_NAME%""

set "PORT_NUM=8090"
set /p PORT_INPUT=Puerto (Enter = 8090): 
if not "%PORT_INPUT%"=="" set "PORT_NUM=%PORT_INPUT%"

REM ---- 4) Creacion del Launcher ----
echo.
echo == Creando launcher %LAUNCHER% ==

set "PYWCMD=pythonw"
where pythonw >nul 2>&1 || set "PYWCMD=%PYCMD%"

(
  echo @echo off
  echo REM Generado automaticamente por instalar_windows.bat
  echo start "" %PYWCMD% "%DIR%print_service.py" --port %PORT_NUM% %PRINTER_ARG% ^> "%DIR%print_service.log" 2^>^&1
) > "%LAUNCHER%"
echo [OK] Launcher generado.

REM ---- 5) Crear Acceso Directo en Startup ----
if not exist "%STARTUP%" mkdir "%STARTUP%"

powershell -NoProfile -Command ^
  "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('%STARTUP%\Desktop Print Service.lnk');" ^
  "$s.TargetPath='%LAUNCHER%';" ^
  "$s.WorkingDirectory='%DIR%';" ^
  "$s.Description='Servicio de impresion local';" ^
  "$s.WindowStyle=7;" ^
  "$s.Save()"

if errorlevel 1 (
    echo [!] No se pudo crear el acceso directo en Inicio automáticamente.
) else (
    echo [OK] Acceso directo registrado en Startup.
)

REM ---- 6) Arrancar el Servicio ----
echo.
echo == Iniciando servicio de impresion ==
start "" %PYWCMD% "%DIR%print_service.py" --port %PORT_NUM% %PRINTER_ARG% > "%DIR%print_service.log" 2>&1

timeout /t 3 /nobreak >nul

powershell -NoProfile -Command ^
  "$ok=Test-NetConnection -ComputerName 127.0.0.1 -Port %PORT_NUM% -InformationLevel Quiet -WarningAction SilentlyContinue;" ^
  "if($ok){ write-host '[OK] Servicio activo y escuchando en ws://127.0.0.1:' %PORT_NUM% } else { write-host '[!] El servicio no responde en el puerto. Verifique print_service.log' }"

echo.
echo == Instalacion Finalizada ==
echo    El servicio iniciara automaticamente al abrir sesion.
echo.
pause
endlocal