@echo off
REM =============================================================================
REM Instalador del Desktop Print Service (Windows)
REM -----------------------------------------------------------------------------
REM  - Instala las dependencias de Python (websockets + pywin32).
REM  - Crea un acceso directo en el Inicio (shell:startup) que arranca el
REM    servicio SIN ventana (pythonw) cada vez que el usuario entra a sesion.
REM  - El servicio escucha en ws://127.0.0.1:8090 y vuelca ESC/POS en la
REM    impresora termica del PC del cajero/satelite.
REM =============================================================================

setlocal
set "DIR=%~dp0"
set "LAUNCHER=%DIR%iniciar_print_service.bat"
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

echo.
echo == Desktop Print Service - Instalador (Windows) ==
echo.

REM ---- 1) Validar que Python 3 esta instalado y ejecuta ----
where pythonw >nul 2>nul && set "PYRUN=pythonw" || (
  where py >nul 2>nul && set "PYRUN=py -3" || (
    where python >nul 2>nul && set "PYRUN=python" || (
      set "PYRUN="
    )
  )
)
if "%PYRUN%"=="" (
  echo [X] Python no esta instalado en este equipo.
  echo     Descargue e instale Python 3 desde https://python.org
  echo     (marque "Add Python to PATH" durante la instalacion) y vuelva a ejecutar.
  pause
  exit /b 1
)
REM Confirma que el interprete detectado es Python 3 y puede ejecutar codigo
%PYRUN% -c "import sys; sys.exit(0 if sys.version_info[0]==3 else 1)" >nul 2>nul
if errorlevel 1 (
  echo [X] El interprete detectado (%PYRUN%) no es Python 3 o no ejecuta.
  echo     Instale Python 3 desde https://python.org (marque "Add Python to PATH").
  pause
  exit /b 1
)
for /f "delims=" %%i in ('%PYRUN% -c "import sys;print(sys.version.split()[0])"') do set PYVER=%%i
echo [OK] Python %PYVER% validado y disponible (%PYRUN%).

REM ---- 2) Dependencias ----
echo.
echo == Instalando dependencias ==
REM Bootstrap de pip por si el interprete no lo trae (p.ej. Python de la Store)
%PYRUN% -m ensurepip --upgrade >nul 2>nul
%PYRUN% -m pip install --upgrade pip >nul 2>nul
echo -- websockets --
%PYRUN% -m pip install websockets
echo -- pywin32 (solo Windows; si falla, la impresion lo avisara) --
%PYRUN% -m pip install pywin32 >nul 2>nul
%PYRUN% -m pywin32_postinstall -install >nul 2>nul
REM Verifica que websockets quedo instalado en ESTE interprete
%PYRUN% -c "import websockets" >nul 2>nul
if errorlevel 1 (
  echo [X] No se pudo instalar 'websockets'. Verifique su conexion y permisos.
  echo     Puede intentarlo manualmente: %PYRUN% -m pip install websockets
  pause
  exit /b 1
)
echo [OK] Dependencias instaladas (websockets OK).

REM ---- 3) Impresora (opcional) y puerto ----
echo.
set "PRINTER_ARG="
set /p PRINTER=Nombre de la impresora (Enter para autodetectar): 
if not "%PRINTER%"=="" set "PRINTER_ARG=--printer "%PRINTER%""

set "PORT_ARG=--port 8090"
set /p PORT=Puerto (Enter = 8090): 
if not "%PORT%"=="" set "PORT_ARG=--port %PORT%"

REM ---- 4) Launcher que arranca sin ventana (pythonw) y registra log ----
echo.
echo == Creando launcher %LAUNCHER% ==
(
  echo @echo off
  echo REM Generado por instalar_windows.bat - no editar manualmente.
  echo start "" %PYRUN% "%DIR%print_service.py" %PORT_ARG% %PRINTER_ARG% ^> "%DIR%print_service.log" 2^>^&1
) > "%LAUNCHER%"
echo [OK] Launcher creado.

REM ---- 5) Acceso directo en el Inicio ----
if not exist "%STARTUP%" mkdir "%STARTUP%"
powershell -NoProfile -Command ^
  "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('%STARTUP%\Desktop Print Service.lnk');" ^
  "$s.TargetPath='%LAUNCHER%';" ^
  "$s.WorkingDirectory='%DIR%';" ^
  "$s.Description='Servicio de impresion local travelsoft (escritorio)';" ^
  "$s.WindowStyle=7;" ^
  "$s.Save()"
if errorlevel 1 (
  echo [!] No se pudo crear el acceso directo automaticamente.
  echo     Agregue manualmente "%LAUNCHER%" al Inicio (shell:startup).
) else (
  echo [OK] Acceso directo creado en el Inicio: %STARTUP%\Desktop Print Service.lnk
)

REM ---- 6) Arrancar el servicio AHORA (no esperar al reinicio) ----
echo.
echo == Arrancando el servicio en esta sesion ==
start "" %PYRUN% "%DIR%print_service.py" %PORT_ARG% %PRINTER_ARG% > "%DIR%print_service.log" 2>&1
timeout /t 2 >nul
powershell -NoProfile -Command ^
  "$ok=Test-NetConnection -ComputerName 127.0.0.1 -Port %PORT_ARG:--port =% -InformationLevel Quiet -WarningAction SilentlyContinue;" ^
  "if($ok){'[OK] Servicio escuchando en 127.0.0.1:%PORT_ARG:--port =% (WebSocket local).'}else{'[!] El servicio no responde en el puerto. Revise print_service.log en esta carpeta.'}"
echo     Use el boton "Test Impresora" de la app para confirmar la impresion.

echo.
echo == Listo. El servicio arrancara solo al iniciar sesion. ==
echo    Para probarlo ahora: abra la app y use "Test Impresora".
echo    Para detenerlo: Borre el acceso directo del Inicio o cierre el proceso pythonw.
echo.
pause
endlocal
