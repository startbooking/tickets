import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import type { Resolucion, ResolucionInput } from '@/services/travelsoftService';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inicial?: Resolucion | null;
  onGuardar: (input: ResolucionInput) => Promise<void>;
}

export function ResolucionFormDialog({ open, onOpenChange, inicial, onGuardar }: Props) {
  const [numero, setNumero] = useState('');
  const [prefijo, setPrefijo] = useState('');
  const [rangoInicial, setRangoInicial] = useState('');
  const [rangoFinal, setRangoFinal] = useState('');
  const [consecutivo, setConsecutivo] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [fechaResolucion, setFechaResolucion] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [activa, setActiva] = useState(true);
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNumero(inicial?.numero_resolucion ?? '');
    setPrefijo(inicial?.prefijo ?? '');
    setRangoInicial(inicial?.rango_inicial != null ? String(inicial.rango_inicial) : '');
    setRangoFinal(inicial?.rango_final != null ? String(inicial.rango_final) : '');
    setConsecutivo(String(inicial?.consecutivo_actual ?? 0));
    setDesde(inicial?.vigencia_desde ?? '');
    setHasta(inicial?.vigencia_hasta ?? '');
    setFechaResolucion(inicial?.fecha_resolucion ?? '');
    setMunicipio(inicial?.municipio ?? '');
    setActiva(Boolean(inicial?.activa));
    setNotas(inicial?.notas ?? '');
  }, [open, inicial]);

  const submit = async () => {
    if (!numero.trim()) return;
    setGuardando(true);
    try {
      await onGuardar({
        numero_resolucion: numero.trim(),
        prefijo: prefijo.trim() || undefined,
        rango_inicial: rangoInicial ? Number(rangoInicial) : undefined,
        rango_final: rangoFinal ? Number(rangoFinal) : undefined,
        consecutivo_actual: Number(consecutivo) || 0,
        fecha_resolucion: fechaResolucion || undefined,
        municipio: municipio.trim() || undefined,
        vigencia_desde: desde || undefined,
        vigencia_hasta: hasta || undefined,
        activa: activa ? 1 : 0,
        notas: notas.trim() || undefined,
      });
      onOpenChange(false);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{inicial ? 'Editar Resolución DIAN' : 'Nueva Resolución DIAN'}</DialogTitle>
          <DialogDescription>
            Registra la resolución expedida por la DIAN con su numeración autorizada.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="res-numero">Número de Resolución</Label>
            <Input
              id="res-numero"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="18764000000001"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="res-prefijo">Prefijo</Label>
              <Input id="res-prefijo" value={prefijo} onChange={(e) => setPrefijo(e.target.value)} placeholder="FSV" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="res-consecutivo">Consecutivo actual</Label>
              <Input id="res-consecutivo" type="number" value={consecutivo} onChange={(e) => setConsecutivo(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="res-inicial">Rango inicial</Label>
              <Input id="res-inicial" type="number" value={rangoInicial} onChange={(e) => setRangoInicial(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="res-final">Rango final</Label>
              <Input id="res-final" type="number" value={rangoFinal} onChange={(e) => setRangoFinal(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="res-fecha-resolucion">Fecha de resolución</Label>
              <Input id="res-fecha-resolucion" type="date" value={fechaResolucion} onChange={(e) => setFechaResolucion(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="res-municipio">Municipio autorizado</Label>
              <Input id="res-municipio" value={municipio} onChange={(e) => setMunicipio(e.target.value)} placeholder="BOGOTA D.C." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="res-desde">Vigencia desde</Label>
              <Input id="res-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="res-hasta">Vigencia hasta</Label>
              <Input id="res-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="font-semibold">Activa</Label>
              <p className="text-xs text-slate-500">La resolución vigente se usa al vender tiquetes.</p>
            </div>
            <Switch checked={activa} onCheckedChange={setActiva} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="res-notas">Notas</Label>
            <Input id="res-notas" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Opcional" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={guardando || !numero.trim()} className="bg-blue-600 hover:bg-blue-700">
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {inicial ? 'Guardar cambios' : 'Crear resolución'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
