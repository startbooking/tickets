import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bluetooth, Printer, CheckCircle2, AlertTriangle, RefreshCcw, Trash2, X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  detectarImpresoraBle,
  imprimirTestBle,
  limpiarImpresoraBlePredeterminada,
  obtenerImpresoraBlePredeterminada,
  soportaBluetoothEscPos,
  tieneImpresoraBlePredeterminada,
  isAndroidDevice,
} from '@/utils/ticketFormatter';

/**
 * Diálogo de configuración de la impresora Bluetooth local. Permite al
 * operador emparejar una impresora térmica ESC/POS por Web Bluetooth (BLE)
 * y guardarla como predeterminada. La impresión es SIEMPRE local: el
 * dispositivo (PDA / PC / Tablet / Móvil) imprime directo a su impresora
 * Bluetooth sin pasar por la red ni por un backend con impresora conectada.
 */
export function ConfigurarImpresoraBluetooth({ onCerrar }: { onCerrar: () => void }) {
  const [emparejando, setEmparejando] = useState(false);
  const [probando, setProbando] = useState(false);

  const guardada = obtenerImpresoraBlePredeterminada();
  const soporteBle = soportaBluetoothEscPos();
  const android = isAndroidDevice();

  const emparejar = async () => {
    setEmparejando(true);
    try {
      const r = await detectarImpresoraBle();
      if (r.impresoraConectada) {
        toast.success(r.mensaje);
      } else {
        toast.info(r.mensaje);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo emparejar la impresora.');
    } finally {
      setEmparejando(false);
    }
  };

  const probar = async () => {
    setProbando(true);
    try {
      const r = await imprimirTestBle();
      if (r.ok) toast.success(`Prueba enviada a ${r.dispositivo ?? 'la impresora'}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo imprimir la prueba.');
    } finally {
      setProbando(false);
    }
  };

  const olvidar = () => {
    limpiarImpresoraBlePredeterminada();
    toast.info('Impresora Bluetooth olvidada. Deberá emparejarla de nuevo.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Bluetooth className="w-4 h-4 text-sky-400" /> Impresora Bluetooth
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Impresión local del dispositivo</p>
          </div>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-400" onClick={onCerrar}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {!soporteBle ? (
          <div className="rounded-xl border border-amber-800 bg-amber-950/40 p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <p className="text-[11px] text-amber-200 font-semibold">
              {android
                ? 'Este navegador no soporta Web Bluetooth. Use la app RawBT o el navegador Chrome de la PDA.'
                : 'Web Bluetooth no está disponible. Use un navegador Chromium (Chrome/Edge) por HTTPS.'}
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Estado</span>
              {tieneImpresoraBlePredeterminada() ? (
                <Badge className="bg-emerald-900/40 text-emerald-300 border-emerald-700 text-[9px] font-bold gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Emparejada
                </Badge>
              ) : (
                <Badge className="bg-slate-900 text-slate-300 border-slate-700 text-[9px] font-bold">
                  Sin configurar
                </Badge>
              )}
            </div>
            {guardada && (
              <div className="flex items-center gap-2 text-[11px] text-slate-200">
                <Printer className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-semibold truncate">{guardada.nombre}</span>
              </div>
            )}
            <p className="text-[10px] text-slate-500">
              La impresión es local: el tiquete y el Libro de Ruta se envían directo a esta
              impresora Bluetooth, sin depender de la red ni de un servidor.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2">
          <Button
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm h-11 gap-2"
            disabled={!soporteBle || emparejando}
            onClick={() => void emparejar()}
          >
            {emparejando ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Bluetooth className="w-4 h-4" />}
            {emparejando ? 'Buscando…' : 'Buscar y emparejar impresora'}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-11 border-slate-700 text-slate-200 text-xs font-bold gap-2"
              disabled={!tieneImpresoraBlePredeterminada() || probando}
              onClick={() => void probar()}
            >
              {probando ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
              Probar
            </Button>
            <Button
              variant="outline"
              className="h-11 border-red-800 text-red-300 text-xs font-bold gap-2"
              disabled={!tieneImpresoraBlePredeterminada()}
              onClick={olvidar}
            >
              <Trash2 className="w-3.5 h-3.5" /> Olvidar
            </Button>
          </div>
        </div>

        <Button className="w-full h-11 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black" onClick={onCerrar}>
          Cerrar
        </Button>
      </div>
    </div>
  );
}
