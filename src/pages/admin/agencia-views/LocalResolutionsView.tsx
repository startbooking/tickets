import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import {
  AlertCircle, CheckCircle2, FileText, Loader2, Pencil, Plus, Trash2, CalendarDays
} from "lucide-react";
import { travelsoftService, Resolucion, ResolucionInput } from "@/services/travelsoftService";
import { ResolucionFormDialog } from "@/components/resoluciones/ResolucionFormDialog";

function pctUsado(r: Resolucion): number {
  if (r.rango_inicial == null || r.rango_final == null || r.rango_final <= r.rango_inicial) return 0;
  const usado = r.consecutivo_actual - r.rango_inicial;
  return Math.min(100, Math.max(0, Math.round((usado / (r.rango_final - r.rango_inicial)) * 100)));
}

export function LocalResolutionsView({ idAgencia }: { idAgencia: number }) {
  const [resoluciones, setResoluciones] = useState<Resolucion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Resolucion | null>(null);
  const [eliminando, setEliminando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setResoluciones(await travelsoftService.getResoluciones());
    } catch (err) {
      setResoluciones([]);
      toast.error(err instanceof Error ? err.message : 'No se pudieron cargar las resoluciones.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const guardar = async (input: ResolucionInput) => {
    try {
      if (editando) {
        await travelsoftService.actualizarResolucion(editando.id_resolucion, input);
        toast.success('Resolución actualizada.');
      } else {
        await travelsoftService.crearResolucion(input);
        toast.success('Resolución creada.');
      }
      await cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar la resolución.');
      throw err;
    }
  };

  const eliminar = async (r: Resolucion) => {
    setEliminando(r.id_resolucion);
    try {
      await travelsoftService.eliminarResolucion(r.id_resolucion);
      toast.success('Resolución eliminada.');
      await cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar la resolución.');
    } finally {
      setEliminando(null);
    }
  };

  const activa = resoluciones.find((r) => Boolean(r.activa)) || null;

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /> Resoluciones Asignadas</CardTitle>
          <CardDescription>Vigila los rangos consumidos y la caducidad legal ante la DIAN para evitar frenos de venta.</CardDescription>
        </div>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1" onClick={() => { setEditando(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4" /> Adicionar
        </Button>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {cargando ? (
          <div className="flex items-center justify-center p-8 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" /> Cargando...
          </div>
        ) : resoluciones.length === 0 ? (
          <div className="p-6 border rounded-xl bg-slate-50 text-center text-slate-500">
            <p className="text-sm">Sin resoluciones registradas para esta agencia.</p>
            <p className="text-xs mt-1">Presiona "Adicionar" para cargar la resolución vigente ante la DIAN.</p>
          </div>
        ) : (
          <>
            {!activa && (
              <div className="p-4 border border-red-200 bg-red-50/50 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <div className="text-xs text-red-700">
                  <p className="font-bold">Sin resolución activa.</p>
                  <p className="mt-0.5">Los tiquetes se generan sin numeración de facturación. Activa una resolución para vender con numeración DIAN.</p>
                </div>
              </div>
            )}

            {resoluciones.map((r) => {
              const pct = pctUsado(r);
              const esActiva = Boolean(r.activa);
              return (
                <div key={r.id_resolucion} className={`p-4 rounded-xl border ${esActiva ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200'}`}>
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-sm">
                          {r.prefijo ? `Prefijo: ${r.prefijo}` : 'Sin prefijo'} · {r.numero_resolucion}
                        </h4>
                        {esActiva ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"><CheckCircle2 className="w-3 h-3" /> Activa</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-500 border-slate-200">Inactiva</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        <CalendarDays className="w-3.5 h-3.5 inline mr-1" />
                        Vigencia: {r.vigencia_desde ?? '—'} al {r.vigencia_hasta ?? '—'}
                      </p>
                      {r.rango_inicial != null && r.rango_final != null && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Rango: {r.rango_inicial.toLocaleString('es-CO')} al {r.rango_final.toLocaleString('es-CO')} · Consecutivo: {r.consecutivo_actual.toLocaleString('es-CO')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50 px-2" onClick={() => { setEditando(r); setFormOpen(true); }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 px-2" disabled={eliminando === r.id_resolucion} onClick={() => void eliminar(r)}>
                        {eliminando === r.id_resolucion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {r.rango_inicial != null && r.rango_final != null && r.rango_final > r.rango_inicial && (
                    <div className="mt-3 space-y-1">
                      <Progress value={pct} className={`h-2 ${pct >= 85 ? 'bg-amber-200' : 'bg-slate-200'}`} />
                      <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                        <span>Consumido: {pct}%</span>
                        <span>Quedan: {(r.rango_final - r.consecutivo_actual).toLocaleString('es-CO')}</span>
                      </div>
                      {pct >= 85 && (
                        <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Rango por agotarse
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
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
