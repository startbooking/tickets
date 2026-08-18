# Desktop Print Service (WebSocket local → impresora térmica del PC)

Mini-servicio para el **escritorio** (Windows y Linux). Reemplaza el fallback
"USB (servidor pyusb/CUPS)" cuando el backend corre en hosting y no tiene
acceso a la impresora USB local: la app React de tickets se conecta a
`ws://127.0.0.1:8090` y este proceso escribe los bytes ESC/POS directamente a
la impresora térmica instalada en el PC del cajero.

Es la contraparte de escritorio de `pda-websocket-printer/` (la app Android
que hace lo mismo en la PDA Sunmi). Usa el mismo protocolo y el mismo cliente
`src/services/pdaWebSocketService.ts`.

## Cómo funciona

1. El PC corre `print_service.py`, que abre un servidor WebSocket solo en
   loopback (`127.0.0.1:8090`).
2. La app React envía el ticket ESC/POS como base64 por WebSocket.
3. El servicio escribe los bytes RAW a la impresora del equipo.

### Backend de impresión por SO

| SO | Método | Comentario |
|----|--------|-----------|
| Windows | `win32print` RAW | `pip install pywin32`; autodetección por nombre. |
| Linux | CUPS (`lp -d ... -o raw`) | Colas `TMU`, `TICKET`, etc. |
| Linux | `/dev/usb/lp*` directo | Fallback sin CUPS; usar grupo `lp`: `sudo usermod -aG lp $USER`. |

El backend se detecta automáticamente; `--printer` fuerza uno.

## Protocolo (idéntico a la app Android)

```
→ { "action": "PRINT", "data": "<base64 del ESC/POS>", "copies": 1 }
← { "code": 0, "message": "ok" }   (code != 0 => error con detalle)
→ { "action": "PING" }
← { "code": 0, "message": "pong" }
```

## Instalación (Windows / Linux)

1. Instala Python 3 (en Windows marca "Add to PATH").
2. Abre terminal en esta carpeta:
   ```
   pip install -r requirements.txt
   ```
   - En Windows instala `websockets` + `pywin32`.
   - En Linux basta `pip install websockets` (pywin32 no es necesario; el
     import falla de forma segura y se usan CUPS o `/dev/usb/lp*`).

3. Arranque:
   ```
   python print_service.py                # autodetección de impresora
   python print_service.py --printer "EPSON TM-T70"   # Windows: impresora específica
   python print_service.py --printer TMU  # Linux: cola CUPS específica
   ```
4. Prueba con el botón "Test Impresora" de la app (en el escritorio la cadena
   de impresión intenta este servicio como primer medio).

### Arranque automático al iniciar Windows

Crea un acceso directo a `print_service.py` (usa `pythonw` para que no abra
ventana) y cópialo en `shell:startup` (`Win+R` → `shell:startup`).

## Modo pruebas (sin impresora / sin cuarto OS)

```
python print_service.py --mock
```

En `--mock` no se imprime: los bytes se vuelcan a `logs/ultimo_ticket.bin`.
Útil para validar el flujo en desarrollo sin una impresora conectada.

## Notas

- El servidor solo escucha en `127.0.0.1` (loopback); la web debe correr en el
  mismo PC.
- Los bytes ESC/POS los genera la app React (`encodarEscPos`); el servicio no
  formatea nada.
- Puertos de impresión: escritorio 8090, PDA Android 8091. El 8080 queda libre
  para el servidor web/desarrollo (Vite).
- En Linux: si no hay CUPS ni `lp`, el fallback escribe directamente a
  `/dev/usb/lp0`; si el permiso falla, agrega tu usuario al grupo `lp`.
