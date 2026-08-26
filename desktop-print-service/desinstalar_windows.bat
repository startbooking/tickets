@echo off
REM =============================================================================
REM Desinstalador del Desktop Print Service (Windows)
REM -----------------------------------------------------------------------------
REM   1) Detiene el servicio (proceso de print_service.py en este PC).
REM   2) Elimina el acceso directo del Inicio (shell:startup).
REM   3) Borra la carpeta desktop-print-service.
REM =============================================================================
setlocal
set "DIR=%~dp0"
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

echo.
echo == Desktop Print Service - Desinstalador (Windows) ==
echo.

REM ---- 1) Detener el servicio (por linea de comando, sin matar otro pythonw) ----
echo [1/3] Deteniendo el servicio...
powershell -NoProfile -Command ^
  "$ps=Get-CimInstance Win32_Process | Where-Object{$_.CommandLine -like '*print_service.py*'} | Select-Object -ExpandProperty ProcessId -Unique;" ^
  "if($ps){$ps | ForEach-Object{Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue}; '[OK] Proceso print_service detenido.'}else{'[i] No se encontro un proceso print_service en ejecucion.'}"

REM ---- 2) Quitar el acceso directo del Inicio ----
echo [2/3] Eliminando acceso directo del Inicio...
if exist "%STARTUP%\Desktop Print Service.lnk" (
  del /f /q "%STARTUP%\Desktop Print Service.lnk"
  echo "[OK] Acceso directo eliminado: %STARTUP%\Desktop Print Service.lnk"
) else (
  echo "[i] No existia el acceso directo en el Inicio."
)

REM ---- 3) Eliminar la carpeta (se borra tras cerrar esta ventana) ----
echo [3/3] Eliminando carpeta...
echo "   La carpeta se eliminara sola al cerrar: %DIR%"
start "" cmd /c "timeout /t 2 >nul & rmdir /s /q \"%DIR%\" & exit"

echo.
echo == Desinstalacion completada. ==
echo    (Si la carpeta no se borra automaticamente, eliminela manualmente).
echo.
pause
endlocal
