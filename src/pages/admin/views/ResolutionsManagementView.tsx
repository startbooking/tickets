import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import {
  FileText, Plus, Pencil, Trash2, Loader2, AlertTriangle, CheckCircle2, Landmark, CalendarDays, MapPin
} from "lucide-react";
import { travelsoftService, Resolucion, ResolucionInput, OridesOption } from "@/services/travelsoftService";
import { ResolucionFormDialog } from "@/components/resoluciones/ResolucionFormDialog";

function pctUsado(r: Resolucion): number {
  if (r.rango_inicial == null || r.rango_final == null || r.rango_final <= r.rango_inicial) return 0;
  const usado = r.consecutivo_actual - r.rango_inicial;
  return Math.min(100, Math.max(0, Math.round((usado / (r.rango_final - r.rango_inicial)) * 100)));
}

export function ResolutionsManagementView() {
  const [agencias, setAgencias] = useState<OridesOption[]>([]);
  const [agenciaSel, setAgenciaSel] = useState<string>('');
  const [resoluciones, setResoluciones] = useState<Resolucion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Resolucion | null>(null);
  const [eliminando, setEliminando] = useState<number | null>(null);

  const cargarAgencias = useCallback(async () => {
    try {
      const list = await travelsoftService.getOrides();
      setAgencias(list);
      if (list.length > 0 && !agenciaSel) setAgenciaSel(String(list[0].id_orides));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudieron cargar las agencias.');
    }
  }, [agenciaSel]);

  const cargarResoluciones = useCallback(async (agencia: string) => {
    if (!agencia) return;
    setCargando(true);
    try {
      setResoluciones(await travelsoftService.getResoluciones(Number(agencia)));
    } catch (err) {
      setResoluciones([]);
      toast.error(err instanceof Error ? err.message : 'No se pudieron cargar las resoluciones.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarAgencias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (agenciaSel) void cargarResoluciones(agenciaSel);
  }, [agenciaSel, cargarResoluciones]);

  const guardar = async (input: ResolucionInput) => {
    const base = { ...input, id_orides: Number(agenciaSel) };
    try {
      if (editando) {
        await travelsoftService.actualizarResolucion(editando.id_resolucion, base);
        toast.success('Resolución actualizada.');
      } else {
        await travelsoftService.crearResolucion(base);
        toast.success('Resolución creada.');
      }
      await cargarResoluciones(agenciaSel);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar la resolución.');
      throw err;
    }
  };

  const eliminar = async (r: Resolucion) => {
    setEliminando(r.id_resolucion);
    try {
      await travelsoftService.eliminarResolucion(r.id_resolucion, Number(agenciaSel));
      toast.success('Resolución eliminada.');
      await cargarResoluciones(agenciaSel);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar la resolución.');
    } finally {
      setEliminando(null);
    }
  };

  const nombreAgencia = agencias.find((a) => String(a.id_orides) === agenciaSel)?.desc_orides || 'Agencia';

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b flex-wrap gap-4">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Resoluciones de Facturación DIAN
          </CardTitle>
          <CardDescription className="mt-1">Control de prefijos, rangos autorizados y vigencias legales por agencia.</CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-52">
            <Select value={agenciaSel || undefined} onValueChange={setAgenciaSel}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Seleccione agencia" />
              </SelectTrigger>
              <SelectContent>
                {agencias.map((a) => (
                  <SelectItem key={a.id_orides} value={String(a.id_orides)}>
                    {a.desc_orides || `Agencia ${a.id_orides}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => { setEditando(null); setFormOpen(true); }}>
            <Plus className="w-4 h-4" /> Nueva Resolución
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {cargando ? (
          <div className="flex items-center justify-center p-10 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" /> Cargando resoluciones...
          </div>
        ) : resoluciones.length === 0 ? (
          <div className="border rounded-lg bg-white p-8 text-center text-slate-500">
            <p className="text-sm">Sin resoluciones para <span className="font-semibold text-slate-700">{nombreAgencia}</span>.</p>
            <p className="text-xs mt-1">Presiona "Nueva Resolución" para homologar con la DIAN.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {resoluciones.map((r) => {
              const pct = pctUsado(r);
              const activa = Boolean(r.activa);
              return (
                <div key={r.id_resolucion} className={`rounded-xl border p-4 ${activa ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200 bg-white'}`}>
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-sm">
                          {r.prefijo ? `${r.prefijo} - ` : ''}{r.numero_resolucion}
                        </h4>
                        {activa ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"><CheckCircle2 className="w-3 h-3" /> Activa</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-500 border-slate-200">Inactiva</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        <Landmark className="w-3.5 h-3.5 inline mr-1" />
                        {nombreAgencia} · Consecutivo: {r.consecutivo_actual}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        <CalendarDays className="w-3.5 h-3.5 inline mr-1" />
                        {r.vigencia_desde ?? '—'} al {r.vigencia_hasta ?? '—'}
                      </p>
                      {r.rango_inicial != null && r.rango_final != null && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Rango autorizado: {r.rango_inicial.toLocaleString('es-CO')} – {r.rango_final.toLocaleString('es-CO')}
                        </p>
                      )}
                      {r.fecha_resolucion && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          <CalendarDays className="w-3.5 h-3.5 inline mr-1" />
                          Fecha resolución: {r.fecha_resolucion}
                        </p>
                      )}
                      {r.municipio && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 inline mr-1" />
                          Municipio autorizado: {r.municipio}
                        </p>
                      )}
                      {r.notas && <p className="text-xs text-slate-400 italic mt-0.5">“{r.notas}”</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {r.rango_inicial != null && r.rango_final != null && r.rango_final > r.rango_inicial && (
                        <div className="w-40 space-y-1">
                          <Progress value={pct} className={`h-2 ${pct >= 85 ? 'bg-amber-200' : 'bg-slate-200'}`} />
                          <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                            <span>{pct}% usado</span>
                            <span>{(r.rango_final - r.consecutivo_actual).toLocaleString('es-CO')} libres</span>
                          </div>
                          {pct >= 85 && (
                            <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Rango por agotarse
                            </span>
                          )}
                        </div>
                      )}
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50" onClick={() => { setEditando(r); setFormOpen(true); }}>
                        <Pencil className="w-4 h-4" /> Editar
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" disabled={eliminando === r.id_resolucion} onClick={() => void eliminar(r)}>
                        {eliminando === r.id_resolucion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <ResolucionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        inicial={editando}
        onGuardar={guardar}
      />
    </Card>
  );
}
