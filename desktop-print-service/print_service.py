"""
Mini-servicio de impresión local para el ESCRITORIO (Windows).

Sustituye el fallback "USB (servidor pyusb/CUPS)" del backend cuando este
corre en hosting (sin acceso a la impresora USB local): la app React se
conecta a `ws://127.0.0.1:8090` y este proceso escribe los bytes ESC/POS
directamente a la impresora térmica instalada en el PC del cajero.

Protocolo (idéntico al de la app Android "PDA Print Service"):

  Enviar  -> { "action": "PRINT", "data": "<base64 del ESC/POS>", "copies": 1 }
  Respuesta -> { "code": 0, "message": "ok" }   (code != 0 => error)
  Enviar  -> { "action": "PING" }
  Respuesta -> { "code": 0, "message": "pong" }

Uso:

  python print_service.py                # impresora por defecto de Windows
  python print_service.py --printer "EPSON TM-T70"   # impresora específica
  python print_service.py --port 8090    # puerto (por defecto 8090)
  python print_service.py --mock         # escribe en logs/ en vez de imprimir (pruebas)

Dependencias: `pip install -r requirements.txt`  (websockets + pywin32)
"""

from __future__ import annotations

import argparse
import asyncio
import base64
import json
import logging
import os
import subprocess
import sys
from pathlib import Path

try:
    import websockets
    from websockets.exceptions import ConnectionClosed
except ImportError:
    print("Falta la dependencia 'websockets': pip install -r requirements.txt", file=sys.stderr)
    sys.exit(1)

try:
    import win32print
except ImportError:
    # Linux/dev: se usan los backends CUPS o /dev/usb/lp*; el import de win32print falla.
    win32print = None  # type: ignore[assignment]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("print-service")

LOOPBACK = "127.0.0.1"
DEFAULT_PORT = 8090

# Palabras clave para autodetección de la impresora térmica.
KEYWORDS_IMPRESORA = (
    "TM-", "TMU", "XPRINTER", "TICKET", "RECIBO", "RECEIPT", "TERMICA",
    "TERMIC", "EPSON", "GPRINTER",
)

# En Linux, candidatos a dispositivos de impresora USB térmica y a colas CUPS.
COLDAS_LINUX = ("/dev/usb/lp0", "/dev/usb/lp1", "/dev/lp0", "/dev/lp1")
COLAS_CUPS_LINUX = ("TMU", "TICKET", "RECIBO", "TM-T20", "TM-T88", "XPRINTER")

_log_dir = Path(__file__).resolve().parent / "logs"


# ─────────────────────────────────────────────────────────────────────────────
# Detección de impresora (Windows / Linux)
# ─────────────────────────────────────────────────────────────────────────────

def _es_windows() -> bool:
    return os.name == "nt"


def _lista_impresoras_windows() -> list[str]:
    """Nombres de impresoras instaladas en Windows (vacío si no hay win32print)."""
    if win32print is None:
        return []
    try:
        return [p[2] for p in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS)]
    except Exception as exc:  # pragma: no cover
        logger.error("Error enumerando impresoras: %s", exc)
        return []


def _lista_colas_cups() -> list[str]:
    """Colas CUPS detectadas (solo en Linux)."""
    try:
        salida = subprocess.run(["lpstat", "-a"], capture_output=True, text=True, timeout=5)
    except (subprocess.SubprocessError, FileNotFoundError):
        return []
    colas: list[str] = []
    for linea in (salida.stdout or "").splitlines():
        linea = linea.strip()
        if linea.startswith("-d") or not linea:
            continue
        nombre = linea.split()[0]
        if nombre:
            colas.append(nombre)
    return colas


def _detectar_device_usb_thermal() -> str | None:
    """Primer dispositivo USB tipo impresora (clase 7) o /dev/usb/lp* existente."""
    for dev in COLDAS_LINUX:
        if os.path.exists(dev):
            return dev
    # Busca dispositivos USB con clase impresora (clase 7)
    try:
        usb = _listar_thermal_usb()
        if usb:
            return usb
    except Exception:
        pass
    return None


def _listar_thermal_usb() -> str | None:
    """Busca /dev/bus/usb/* con clase 7 (impresora) usando lsusb."""
    try:
        salida = subprocess.run(["lsusb", "-d", "::0709"], capture_output=True, text=True, timeout=5)
        if salida.stdout.strip():
            return "/dev/usb/lp0"  # punto de montaje genérico; preferimos COLDAS_LINUX antes
    except (subprocess.SubprocessError, FileNotFoundError):
        pass
    return None


def _elegir_impresora_windows(nombre: str | None) -> str | None:
    if nombre:
        return nombre
    try:
        por_defecto = win32print.GetDefaultPrinter()
        if por_defecto:
            logger.info("Impresora por defecto: %s", por_defecto)
            return por_defecto
    except Exception:
        pass
    for imp in _lista_impresoras_windows():
        if any(kw.lower() in imp.lower() for kw in KEYWORDS_IMPRESORA):
            logger.info("Impresora térmica autodetectada: %s", imp)
            return imp
    disponibles = _lista_impresoras_windows()
    if disponibles:
        logger.info("Usando primera impresora instalada: %s", disponibles[0])
        return disponibles[0]
    return None


def _elegir_impresora_linux() -> tuple[str | None, bool]:
    """Devuelve (cola_cups_o_device_usb, usar_cups)."""
    colas = _lista_colas_cups()
    # 1) Cola CUPS por keyword.
    for cola in colas:
        if any(kw.lower() in cola.lower() for kw in KEYWORDS_IMPRESORA):
            logger.info("Cola CUPS autodetectada: %s", cola)
            return cola, True
    # 2) Cola CUPS explícita TMU.
    for cola in COLAS_CUPS_LINUX:
        if cola.lower() in {c.lower() for c in colas}:
            logger.info("Cola CUPS detectada: %s", cola)
            return cola, True
    # 3) Dispositivo USB raw (/dev/usb/lp*).
    dev = _detectar_device_usb_thermal()
    if dev:
        logger.info("Dispositivo USB térmica autodetectado: %s", dev)
        return dev, False
    return None, False


def _elegir_impresora(nombre: str | None) -> tuple[str | None, bool]:
    """Resuelve la impresora objetivo según SO.
    Devuelve (identificador, usar_cups).
    - Windows: usar_cups=False, identificador=nombre de la impresora.
    - Linux:   usar_cups=True/False, identificador=cola CUPS o device /dev/usb/lp*.
    - Linux sin win32print y --mock: (None, False).
    """
    if _es_windows():
        return (_elegir_impresora_windows(nombre), False)
    # Linux
    if nombre:
        return (nombre, True)
    return _elegir_impresora_linux()


# ─────────────────────────────────────────────────────────────────────────────
# Impresión (Windows win32print / Linux CUPS + /dev/usb/lp*) / mock
# ─────────────────────────────────────────────────────────────────────────────

def _imprimir_windows(data: bytes, copies: int, impresora: str) -> None:
    if copies < 1:
        copies = 1
    hprinter = None
    try:
        hprinter = win32print.OpenPrinter(impresora)
        win32print.StartDocPrinter(hprinter, 1, ("Ticket", None, "RAW"))
        try:
            for _ in range(copies):
                win32print.StartPagePrinter(hprinter)
                win32print.WritePrinter(hprinter, data)
                win32print.EndPagePrinter(hprinter)
        finally:
            win32print.EndDocPrinter(hprinter)
        logger.info("Impreso en '%s' (%d bytes, copies=%d)", impresora, len(data), copies)
    except Exception as exc:
        raise RuntimeError(f"Error imprimiendo en '{impresora}': {exc}") from exc
    finally:
        if hprinter is not None:
            try:
                win32print.ClosePrinter(hprinter)
            except Exception:
                pass


def _imprimir_cups(data: bytes, copies: int, cola: str) -> None:
    import tempfile
    if copies < 1:
        copies = 1
    tmp = None
    try:
        fd, tmp = tempfile.mkstemp(prefix="tiquete_", suffix=".bin")
        with os.fdopen(fd, "wb") as f:
            f.write(data)
        comando = ["lp", "-d", cola, "-o", "raw"]
        if copies > 1:
            comando += ["-n", str(copies)]
        comando.append(tmp)
        resultado = subprocess.run(comando, capture_output=True, text=True, timeout=30)
        if resultado.returncode != 0:
            raise RuntimeError((resultado.stderr or resultado.stdout or "Error de CUPS").strip())
        logger.info("Impreso en CUPS cola '%s' (%d bytes, copies=%d)", cola, len(data), copies)
    except (subprocess.SubprocessError, FileNotFoundError) as exc:
        raise RuntimeError(f"Error enviando a CUPS ('{cola}'): {exc}") from exc
    finally:
        if tmp and os.path.exists(tmp):
            try:
                os.unlink(tmp)
            except OSError:
                pass


def _imprimir_device_raw(data: bytes, copies: int, device: str) -> None:
    if copies < 1:
        copies = 1
    try:
        with open(device, "ab") as f:
            for _ in range(copies):
                f.write(data)
                f.flush()
        logger.info("Impreso en device '%s' (%d bytes, copies=%d)", device, len(data), copies)
    except PermissionError as exc:
        raise RuntimeError(f"Permiso denegado escribiendo '{device}'. Agregue su usuario al grupo `lp` (Linux): sudo usermod -aG lp $USER") from exc
    except OSError as exc:
        raise RuntimeError(f"Error escribiendo a '{device}': {exc}") from exc


def _imprimir(data: bytes, copies: int, identificador: str | None, usar_cups: bool, mock: bool) -> None:
    if copies < 1:
        copies = 1
    _log_dir.mkdir(parents=True, exist_ok=True)

    if mock or identificador is None:
        # Modo prueba o sin impresora/encontrada: volcar a disco.
        destino = _log_dir / "ultimo_ticket.bin"
        destino.write_bytes(data * copies)
        logger.warning("modo mock: %d bytes ESC/POS escritos en %s (copies=%d)",
                       len(data), destino, copies)
        return

    if usar_cups:
        _imprimir_cups(data, copies, identificador)
    elif _es_windows() and win32print is not None:
        _imprimir_windows(data, copies, identificador)
    else:
        # Linux con device USB raw (identificador = /dev/usb/lpX) y usar_cups=False.
        _imprimir_device_raw(data, copies, identificador)



# ─────────────────────────────────────────────────────────────────────────────
# WebSocket
# ─────────────────────────────────────────────────────────────────────────────

async def manejar_mensaje(ws, identificador: str | None, usar_cups: bool, mock: bool) -> None:
    async for raw in ws:
        try:
            mensaje = json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            await ws.send(json.dumps({"code": 1, "message": "JSON inválido"}))
            continue

        accion = mensaje.get("action")
        if accion == "PING":
            await ws.send(json.dumps({"code": 0, "message": "pong"}))
            continue

        if accion != "PRINT":
            await ws.send(json.dumps({"code": 1, "message": f"acción desconocida: {accion}"}))
            continue

        try:
            b64 = mensaje.get("data", "")
            if not isinstance(b64, str) or not b64:
                raise ValueError("falta 'data' (base64)")
            data = base64.b64decode(b64)
            if not data:
                raise ValueError("'data' vacío tras decodificar")
            copies = int(mensaje.get("copies", 1) or 1)

            await asyncio.to_thread(_imprimir, data, copies, identificador, usar_cups, mock)
            await ws.send(json.dumps({"code": 0, "message": "ok"}))
        except Exception as exc:  # noqa: BLE001 - respuesta de error al cliente
            logger.error("Fallo al imprimir: %s", exc)
            await ws.send(json.dumps({"code": 1, "message": str(exc)}))


async def main() -> None:
    parser = argparse.ArgumentParser(
        description="Mini-servicio de impresión WS para escritorio (Windows/Linux)"
    )
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="puerto local (por defecto %(default)s)")
    parser.add_argument("--printer", default=None, help="nombre de la impresora (Windows) o cola CUPS (Linux). Por defecto: autodetección")
    parser.add_argument("--mock", action="store_true", help="no imprimir: volcar el ticket a logs/ (pruebas)")
    args = parser.parse_args()

    if args.mock:
        identificador, usar_cups = None, False
    else:
        identificador, usar_cups = _elegir_impresora(args.printer)

    _detectar = identificador if args.mock else (identificador + " (CUPS)" if usar_cups else identificador)
    if not args.mock and identificador is None:
        logger.error(
            "No se encontró una impresora. Use --printer \"NOMBRE\", configure CUPS o --mock para pruebas."
        )
        sys.exit(2)

    backend = "mock" if args.mock else ("CUPS/queue" if usar_cups else ("win32print" if _es_windows() else "/dev/usb"))
    logger.info("Modo: %s | objetivo: %s", backend, identificador or "(mock)")

    async with websockets.serve(
        lambda ws: manejar_mensaje(ws, identificador, usar_cups, args.mock),
        host=LOOPBACK,
        port=args.port,
        max_size=4 * 1024 * 1024,  # tickets con logo pueden ser grandes
    ):
        logger.info("Servicio de impresión WS en ws://%s:%d", LOOPBACK, args.port)
        await asyncio.Future()  # corre indefinidamente


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Servicio detenido")
        sys.exit(0)
