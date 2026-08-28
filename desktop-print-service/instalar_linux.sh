#!/usr/bin/env bash
# =============================================================================
# Instalador del Desktop Print Service (Linux)
# -----------------------------------------------------------------------------
#  - Crea un entorno virtual de Python (.venv) e instala 'websockets'.
#  - Registra una unidad systemd --user para inicio automatico y autoreinicio.
#  - Escucha en ws://127.0.0.1:8090 y maneja impresion via CUPS o /dev/usb/lp*.
# =============================================================================
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_NAME="desktop-print-service"
UNIT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
UNIT_PATH="$UNIT_DIR/$SERVICE_NAME.service"
VENV_DIR="$DIR/.venv"

echo
echo "== Desktop Print Service - Instalador (Linux) =="
echo

# ---- 1) Validar interprete de Python 3 ----
PYBIN="$(command -v python3 || command -v python || true)"
if [ -z "$PYBIN" ]; then
  echo "[X] No se encontro python3 en el sistema."
  echo "    Ejecute: sudo apt update && sudo apt install -y python3 python3-venv python3-pip"
  exit 1
fi

echo "[OK] Python detectado: $($PYBIN --version 2>&1)"

# ---- 2) Crear Entorno Virtual (VENV) e Instalar Dependencias ----
echo
echo "== Configurando entorno virtual e instalando dependencias =="

if [ ! -d "$VENV_DIR" ]; then
  echo "-- Creando entorno virtual en $VENV_DIR --"
  if ! "$PYBIN" -m venv "$VENV_DIR" 2>/dev/null; then
    echo "[!] Error creando el entorno virtual. Intentando instalar python3-venv..."
    echo "    Por favor ejecute: sudo apt install python3-venv (o equivalente en su distro)"
    exit 1
  fi
fi

VENV_PY="$VENV_DIR/bin/python"
VENV_PIP="$VENV_DIR/bin/pip"

echo "-- Actualizando pip e instalando websockets --"
"$VENV_PIP" install --upgrade pip >/dev/null 2>&1 || true
"$VENV_PIP" install websockets

if "$VENV_PY" -c "import websockets" >/dev/null 2>&1; then
  echo "[OK] Dependencia 'websockets' verificada correctamente."
else
  echo "[X] Fallo la verificacion de 'websockets'."
  exit 1
fi

# ---- 3) Impresora (opcional) y Puerto ----
echo
read -r -p "Nombre de la cola/impresora CUPS (Enter para autodetectar): " PRINTER
PRINTER_ARG=""
if [ -n "${PRINTER:-}" ]; then
  PRINTER_ARG="--printer \"$PRINTER\""
fi

PORT="8090"
read -r -p "Puerto (Enter = 8090): " PORT_READ
if [ -n "${PORT_READ:-}" ]; then
  PORT="$PORT_READ"
fi

# ---- 4) Generar Unidad systemd --user ----
echo
echo "== Registrando unidad systemd ($UNIT_PATH) =="
mkdir -p "$UNIT_DIR"

cat > "$UNIT_PATH" <<EOF
[Unit]
Description=Desktop Print Service - Impresion Local WebSocket
After=network.target

[Service]
Type=simple
WorkingDirectory=$DIR
ExecStart=$VENV_PY$DIR/print_service.py --port $PORT$PRINTER_ARG
Restart=on-failure
RestartSec=3

[Install]
WantedBy=default.target
EOF

echo "[OK] Unidad systemd creada."

# ---- 5) Habilitar y Arrancar el Servicio ----
systemctl --user daemon-reload
systemctl --user enable --now "$SERVICE_NAME.service"

# Permitir ejecucion persistente del servicio sin sesion grafica activa
if command -v loginctl >/dev/null 2>&1; then
  loginctl enable-linger "$(whoami)" 2>/dev/null || true
fi

# ---- 6) Verificacion de Permisos en /dev/usb/lp* ----
if [ -z "${PRINTER:-}" ] && [ -e /dev/usb/lp0 ]; then
  if id -nG "$(whoami)" | grep -qw lp; then
    echo "[OK] El usuario ya pertenece al grupo 'lp'."
  else
    echo
    echo "[!] Para imprimir directamente en /dev/usb/lp0 sin CUPS:"
    echo "    sudo usermod -aG lp $(whoami)"
    echo "    (requiere reiniciar la sesion del usuario para aplicar cambios)"
  fi
fi

echo
echo "== Estado del servicio =="
systemctl --user status "$SERVICE_NAME.service" --no-pager || true

echo
echo "== Instalacion finalizada correctamente. =="
echo "   Ver logs en tiempo real: journalctl --user -u $SERVICE_NAME.service -f"
echo "   Reiniciar servicio:      systemctl --user restart $SERVICE_NAME.service"
echo "   Detener servicio:        systemctl --user stop $SERVICE_NAME.service"
echo