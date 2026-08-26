#!/usr/bin/env bash
# =============================================================================
# Instalador del Desktop Print Service (Linux)
# -----------------------------------------------------------------------------
#  - Instala 'websockets' (pywin32 no es necesario en Linux).
#  - Registra una unidad systemd --user que arranca el servicio en el inicio de
#    sesion y lo reinicia si falla.
#  - El servicio escucha en ws://127.0.0.1:8090 y vuelca ESC/POS en la impresora
#    del equipo (CUPS 'lp -d ... -o raw' o /dev/usb/lp*).
# =============================================================================
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_NAME="desktop-print-service"
UNIT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
UNIT_PATH="$UNIT_DIR/$SERVICE_NAME.service"

echo
echo "== Desktop Print Service - Instalador (Linux) =="
echo

# ---- 1) Python disponible? ----
PYBIN="$(command -v python3 || command -v python || true)"
if [ -z "$PYBIN" ]; then
  echo "[X] No se encontro python3. Instalelo (apt install python3 python3-pip) y reintente."
  exit 1
fi
echo "[OK] Python: $($PYBIN --version 2>&1)"

# ---- 2) Dependencias ----
echo
echo "== Instalando dependencias (websockets) =="
PIP="$(command -v pip3 || command -v pip)"
"$PIP" install --user --upgrade pip >/dev/null 2>&1 || true
"$PIP" install --user websockets
echo "[OK] Dependencias instaladas."

# ---- 3) Impresora (opcional) y puerto ----
echo
read -r -p "Nombre de la cola/impresora CUPS (Enter para autodetectar): " PRINTER
PRINTER_ARG=""
if [ -n "${PRINTER:-}" ]; then
  PRINTER_ARG="--printer $PRINTER"
fi

PORT="${PORT:-8090}"
read -r -p "Puerto (Enter = 8090): " PORT_READ
if [ -n "${PORT_READ:-}" ]; then
  PORT="$PORT_READ"
fi

# ---- 4) Unidad systemd --user ----
echo
echo "== Registrando unidad systemd ($UNIT_PATH) =="
mkdir -p "$UNIT_DIR"
cat > "$UNIT_PATH" <<EOF
[Unit]
Description=Desktop Print Service (travelsoft) - impresion local WebSocket
After=network.target

[Service]
Type=simple
WorkingDirectory=$DIR
ExecStart=$PYBIN $DIR/print_service.py --port $PORT $PRINTER_ARG
Restart=on-failure
RestartSec=3

[Install]
WantedBy=default.target
EOF
echo "[OK] Unidad creada."

# ---- 5) Habilitar y arrancar ----
systemctl --user daemon-reload
systemctl --user enable --now "$SERVICE_NAME.service"

# Para que el servicio sobreviva aunque el usuario no tenga sesion grafica activa.
if command -v loginctl >/dev/null 2>&1; then
  loginctl enable-linger "$(whoami)" 2>/dev/null || true
fi

# ---- 6) Permisos para /dev/usb/lp* (fallback sin CUPS) ----
if [ -z "${PRINTER:-}" ] && [ -e /dev/usb/lp0 ]; then
  if groups "$(whoami)" | grep -qw lp; then
    echo "[OK] El usuario ya pertenece al grupo 'lp' (acceso a /dev/usb/lp*)."
  else
    echo "[!] Para imprimir en /dev/usb/lp* sin CUPS, agregue el usuario al grupo lp:"
    echo "    sudo usermod -aG lp \"$(whoami)\"   (requiere cerrar sesion)"
  fi
fi

echo
echo "== Estado del servicio =="
systemctl --user status "$SERVICE_NAME.service" --no-pager || true
echo
echo "== Listo. El servicio arrancara solo al iniciar sesion. =="
echo "   Probar ahora: abra la app y use 'Test Impresora'."
echo "   Ver log:    journalctl --user -u $SERVICE_NAME.service -f"
echo "   Detener:    systemctl --user stop $SERVICE_NAME.service"
echo "   Deshabilitar: systemctl --user disable $SERVICE_NAME.service"
echo
