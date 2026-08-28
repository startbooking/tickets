@echo off
REM =============================================================================
REM Desinstalador del Desktop Print Service (Windows)
REM -----------------------------------------------------------------------------
REM   1) Detiene el proceso activo de Python (print_service.py).
REM   2) Elimina el acceso directo del Inicio (shell:startup).
REM   3) Elimina el script launcher generado (iniciar_print_service.bat).
REM   4) Auto-elimina la carpeta del proyecto de forma segura.
REM =============================================================================

setlocal enabledelayedexpansion
set "DIR=%~dp0"
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT=%STARTUP%\Desktop Print Service.lnk"
set "LAUNCHER=%DIR%iniciar_print_service.bat"

echo.
echo == Desktop Print Service - Desinstalador (Windows) ==
echo.

REM ---- 1) Detener el proceso activo de impresion ----
echo [1/3] Deteniendo el servicio de impresion...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$procs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*print_service.py*' };" ^
  "if ($procs) { $procs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }; Write-Host '[OK] Proceso print_service detenido.' } else { Write-Host '[i] No hay procesos de print_service en ejecucion.' }"

REM ---- 2) Remover el acceso directo del Inicio ----
echo.
echo [2/3] Eliminando acceso directo de Inicio...
if exist "%SHORTCUT%" (
    del /f /q "%SHORTCUT%" >nul 2>&1
    if not exist "%SHORTCUT%" (
        echo [OK] Acceso directo eliminado correctamente.
    ) else (
        echo [!] No se pudo eliminar el acceso directo de Inicio.
    )
) else (
    echo [i] No se encontro el acceso directo en Startup.
)

REM ---- 3) Remover el archivo launcher ----
if exist "%LAUNCHER%" (
    del /f /q "%LAUNCHER%" >nul 2>&1
)

REM ---- 4) Programar auto-eliminacion de la carpeta ----
echo.
echo [3/3] Finalizando limpieza...
echo [i] La carpeta %DIR% se eliminara al finalizar esta ventana.
echo.

REM Proceso en segundo plano que espera a que se cierre la consola Batch para eliminar el directorio
start "" /b cmd /c "timeout /t 2 /nobreak >nul & rmdir /s /q \"%DIR%\" >nul 2>&1"

echo == Desinstalacion completada exitosamente. ==
echo.
pause
endlocal