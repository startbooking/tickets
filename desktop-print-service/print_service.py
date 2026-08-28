from __future__ import annotations

import argparse
import asyncio
import base64
import json
import logging
import os
import subprocess
import sys
from functools import partial
from pathlib import Path

try:
    import websockets
except ImportError:
    print("Falta la dependencia 'websockets': pip install websockets", file=sys.stderr)
    sys.exit(1)

try:
    import win32print
except ImportError:
    win32print = None  # type: ignore[assignment]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("print-service")

LOOPBACK = "127.0.0.1"
DEFAULT_PORT = 8090

KEYWORDS_IMPRESORA = (
    "TM-", "TMU", "XPRINTER", "TICKET", "RECIBO", "RECEIPT",
    "TERMICA", "TERMIC", "EPSON", "GPRINTER", "POS", "58MM", "80MM"
)

# Impresoras virtuales comunes que deben ignorarse en Windows
IMPRESORAS_IGNORAR = (
    "pdf", "xps", "onenote", "fax", "root", "document writer"
)

COLDAS_LINUX = ("/dev/usb/lp0", "/dev/usb/lp1", "/dev/lp0", "/dev/lp1")

_log_dir = Path(__file__).resolve().parent / "logs"


# ─────────────────────────────────────────────────────────────────────────────
# Detección de Impresoras
# ─────────────────────────────────────────────────────────────────────────────

def _es_windows() -> bool:
    return os.name == "nt"


def _lista_impresoras_windows() -> list[str]:
    """Obtiene la lista de impresoras físicas/reales instaladas en Windows."""
    if win32print is None:
        return []
    try:
        # PRINTER_ENUM_LOCAL (2) + PRINTER_ENUM_CONNECTIONS (4)
        banderas = win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
        impresoras = [p[2] for p in win32print.EnumPrinters(banderas)]

        # Si no encuentra ninguna, intentar buscar por nivel de driver (Level 5)
        if not impresoras:
            impresoras = [p["pPrinterName"] for p in win32print.EnumPrinters(5)]

        return impresoras
    except Exception as exc:
        logger.error("Error enumerando impresoras en Windows: %s", exc)
        return []


def _elegir_impresora_windows(nombre_solicitado: str | None) -> str | None:
    disponibles = _lista_impresoras_windows()

    if not disponibles:
        logger.error("No se encontraron impresoras instaladas en el sistema.")
        return None

    # 1. Nombre explícito pasado por CLI
    if nombre_solicitado:
        for imp in disponibles:
            if nombre_solicitado.lower() in imp.lower():
                logger.info("Impresora seleccionada por parámetro: %s", imp)
                return imp
        logger.warning("No se encontró '%s'. Impresoras disponibles: %s", nombre_solicitado, disponibles)
        return None

    # 2. Impresora predeterminada del sistema (si no es una impresora virtual)
    try:
        por_defecto = win32print.GetDefaultPrinter()
        if por_defecto and not any(ign in por_defecto.lower() for ign in IMPRESORAS_IGNORAR):
            logger.info("Usando impresora predeterminada de Windows: %s", por_defecto)
            return por_defecto
    except Exception:
        pass

    # 3. Coincidencia por palabras clave
    for imp in disponibles:
        nombre_lower = imp.lower()
        if any(kw.lower() in nombre_lower for kw in KEYWORDS_IMPRESORA):
            if not any(ign in nombre_lower for ign in IMPRESORAS_IGNORAR):
                logger.info("Impresora térmica autodetectada por palabra clave: %s", imp)
                return imp

    # 4. Fallback: primera impresora física no virtual
    for imp in disponibles:
        if not any(ign in imp.lower() for ign in IMPRESORAS_IGNORAR):
            logger.info("Usando primera impresora válida disponible: %s", imp)
            return imp

    return None


def _elegir_impresora_linux(nombre_solicitado: str | None) -> tuple[str | None, bool]:
    if nombre_solicitado:
        return nombre_solicitado, True

    try:
        salida = subprocess.run(["lpstat", "-a"], capture_output=True, text=True, timeout=5)
        colas = [linea.split()[0] for linea in salida.stdout.splitlines() if linea and not linea.startswith("-d")]
        for cola in colas:
            if any(kw.lower() in cola.lower() for kw in KEYWORDS_IMPRESORA):
                return cola, True
        if colas:
            return colas[0], True
    except (subprocess.SubprocessError, FileNotFoundError):
        pass

    for dev in COLDAS_LINUX:
        if os.path.exists(dev):
            return dev, False

    return None, False


def _elegir_impresora(nombre: str | None) -> tuple[str | None, bool]:
    if _es_windows():
        return _elegir_impresora_windows(nombre), False
    return _elegir_impresora_linux(nombre)


# ─────────────────────────────────────────────────────────────────────────────
# Métodos de Impresión
# ─────────────────────────────────────────────────────────────────────────────

def _imprimir_windows(data: bytes, copies: int, impresora: str) -> None:
    copies = max(1, copies)
    hprinter = None
    try:
        hprinter = win32print.OpenPrinter(impresora)
        win32print.StartDocPrinter(hprinter, 1, ("Ticket ESC/POS", None, "RAW"))
        try:
            for _ in range(copies):
                win32print.StartPagePrinter(hprinter)
                win32print.WritePrinter(hprinter, data)
                win32print.EndPagePrinter(hprinter)
        finally:
            win32print.EndDocPrinter(hprinter)
        logger.info("Trabajo enviado a '%s' (%d bytes, %d copia/s)", impresora, len(data), copies)
    except Exception as exc:
        raise RuntimeError(f"Fallo al imprimir en Windows ('{impresora}'): {exc}") from exc
    finally:
        if hprinter:
            try:
                win32print.ClosePrinter(hprinter)
            except Exception:
                pass


def _imprimir_cups(data: bytes, copies: int, cola: str) -> None:
    import tempfile
    copies = max(1, copies)
    with tempfile.NamedTemporaryFile(prefix="ticket_", suffix=".bin", delete=False) as tmp:
        tmp.write(data)
        tmp_path = tmp.name

    try:
        cmd = ["lp", "-d", cola, "-o", "raw"]
        if copies > 1:
            cmd.extend(["-n", str(copies)])
        cmd.append(tmp_path)

        res = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        if res.returncode != 0:
            raise RuntimeError(res.stderr.strip() or "Error en CUPS")
        logger.info("Trabajo enviado a CUPS '%s' (%d bytes)", cola, len(data))
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


def _imprimir_device_raw(data: bytes, copies: int, device: str) -> None:
    copies = max(1, copies)
    try:
        with open(device, "wb") as f:
            for _ in range(copies):
                f.write(data)
                f.flush()
        logger.info("Escribiendo directamente a '%s' (%d bytes)", device, len(data))
    except Exception as exc:
        raise RuntimeError(f"Error escribiendo en dispositivo '{device}': {exc}") from exc


def _imprimir(data: bytes, copies: int, identificador: str | None, usar_cups: bool, mock: bool) -> None:
    if mock or identificador is None:
        _log_dir.mkdir(parents=True, exist_ok=True)
        destino = _log_dir / "ultimo_ticket.bin"
        destino.write_bytes(data * max(1, copies))
        logger.warning("[MOCK] Datos guardados en %s (%d bytes)", destino, len(data))
        return

    if usar_cups:
        _imprimir_cups(data, copies, identificador)
    elif _es_windows():
        _imprimir_windows(data, copies, identificador)
    else:
        _imprimir_device_raw(data, copies, identificador)


# ─────────────────────────────────────────────────────────────────────────────
# Servidor WebSocket
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
            await ws.send(json.dumps({"code": 1, "message": f"Acción no soportada: {accion}"}))
            continue

        try:
            b64_data = mensaje.get("data")
            if not b64_data or not isinstance(b64_data, str):
                raise ValueError("Campo 'data' (base64) requerido")

            raw_bytes = base64.b64decode(b64_data)
            if not raw_bytes:
                raise ValueError("Buffer de datos vacío")

            copies = int(mensaje.get("copies", 1))

            # Ejecutar E/S bloqueante en un hilo separado
            await asyncio.to_thread(_imprimir, raw_bytes, copies, identificador, usar_cups, mock)
            await ws.send(json.dumps({"code": 0, "message": "ok"}))

        except Exception as exc:
            logger.error("Error procesando impresión: %s", exc)
            await ws.send(json.dumps({"code": 1, "message": str(exc)}))


async def main() -> None:
    parser = argparse.ArgumentParser(description="Servicio Local de Impresión WebSocket")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Puerto del servicio")
    parser.add_argument("--printer", default=None, help="Nombre exacto de la impresora")
    parser.add_argument("--mock", action="store_true", help="Modo pruebas (escribe a archivo)")
    args = parser.parse_args()

    if _es_windows() and win32print is None and not args.mock:
        logger.error("Falta pywin32. Instálalo con: pip install pywin32")
        sys.exit(1)

    if args.mock:
        identificador, usar_cups = None, False
    else:
        identificador, usar_cups = _elegir_impresora(args.printer)

    if not args.mock and identificador is None:
        logger.error("No se detectó ninguna impresora válida.")
        if _es_windows():
            logger.info("Impresoras disponibles en el sistema: %s", _lista_impresoras_windows())
        sys.exit(2)

    logger.info("Servidor listo. Impresora destino: '%s'", identificador or "(Modo Mock)")

    handler = partial(manejar_mensaje, identificador=identificador, usar_cups=usar_cups, mock=args.mock)

    async with websockets.serve(handler, host=LOOPBACK, port=args.port, max_size=4 * 1024 * 1024):
        logger.info("Escuchando peticiones en ws://%s:%d", LOOPBACK, args.port)
        await asyncio.Future()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Servicio detenido por el usuario.")
        sys.exit(0)