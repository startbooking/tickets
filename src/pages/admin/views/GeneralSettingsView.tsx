import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, Building, Globe, Ticket, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { travelsoftService } from '@/services/travelsoftService';
import { cn } from '@/lib/utils';

export function GeneralSettingsView() {
  const [loading, setLoading] = useState(false);
  const [cargandoTiquetes, setCargandoTiquetes] = useState(true);
  const [tiqueteConsolidado, setTiqueteConsolidado] = useState('0');

  const cargarConfigTiquetes = useCallback(async () => {
    setCargandoTiquetes(true);
    try {
      const params = await travelsoftService.getParametrosTickets();
      setTiqueteConsolidado(params.tiquete_consolidado);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo leer la configuración de tiquetes.');
    } finally {
      setCargandoTiquetes(false);
    }
  }, []);

  useEffect(() => {
    void cargarConfigTiquetes();
  }, [cargarConfigTiquetes]);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Configuración global de SACTel actualizada con éxito.");
    }, 600);
  };

  const handleSaveTiquetes = async () => {
    setLoading(true);
    try {
      await travelsoftService.setParametrosTickets(tiqueteConsolidado);
      toast.success("Configuración de tiquetes guardada en los parámetros del sistema.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar la configuración de tiquetes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-slate-200 bg-white">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Configuración General del Sistema</CardTitle>
              <CardDescription>Parámetros globales de Sactel.Cloud y datos fiscales de la Empresa.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSaveGeneral} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Datos de Empresa */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Building className="w-4 h-4" /> Datos Corporativos
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="razonSocial">Razón Social</Label>
                  <Input id="razonSocial" defaultValue="TRANSPORTES DE LOS LLANOS S.A.S." className="uppercase" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nit">NIT (Número de Identificación Tributaria)</Label>
                  <Input id="nit" defaultValue="800.123.456-1" />
                </div>
              </div>

              {/* Configuración de red / Endpoints */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Entorno de Proveedor Tecnológico
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="apiUrl">Core Backend URL</Label>
                  <Input id="apiUrl" defaultValue="http://backend.sactel.lan/api/v1" className="bg-slate-50 font-mono text-xs" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entorno">Modo de Operación DIAN</Label>
                  <select id="entorno" className="w-full px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="PROD">Producción (Emisión Real)</option>
                    <option value="HAB">Habilitación / Pruebas</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 flex justify-end">
              <Button type="submit" disabled={loading} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium">
                <Save className="w-4 h-4" />
                {loading ? "Guardando..." : "Guardar Configuración"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Configuración de Tiquetes */}
      <Card className="shadow-sm border-slate-200 bg-white">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Impresión de Tiquetes</CardTitle>
              <CardDescription>
                Define cómo se emiten los tiquetes al vender varias sillas. Se guarda en los parámetros del sistema
                (<code className="text-[11px] bg-slate-100 px-1 rounded">parametros.tiquete_consolidado</code>).
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {cargandoTiquetes ? (
            <div className="py-6 flex items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> Cargando configuración...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label
                  className={cn(
                    "rounded-xl border-2 p-4 cursor-pointer transition-all flex items-start gap-3",
                    tiqueteConsolidado === '0'
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <input
                    type="radio"
                    name="modoTiquete"
                    className="mt-1 accent-emerald-600"
                    value="0"
                    checked={tiqueteConsolidado === '0'}
                    onChange={() => setTiqueteConsolidado('0')}
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-800">Un tiquete por silla</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Cada silla vendida se imprime en un tiquete individual.
                    </div>
                  </div>
                </label>

                <label
                  className={cn(
                    "rounded-xl border-2 p-4 transition-all flex items-start gap-3",
                    tiqueteConsolidado === '1'
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <input
                    type="radio"
                    name="modoTiquete"
                    className="mt-1 accent-emerald-600"
                    value="1"
                    checked={tiqueteConsolidado === '1'}
                    onChange={() => setTiqueteConsolidado('1')}
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-800">Tiquete consolidado</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Un solo tiquete con el total de sillas vendidas y el valor total de la venta.
                    </div>
                  </div>
                </label>
              </div>

              <div className="border-t pt-4 flex justify-end">
                <Button onClick={() => void handleSaveTiquetes()} disabled={loading || cargandoTiquetes} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                  <Save className="w-4 h-4" />
                  {loading ? "Guardando..." : "Guardar Configuración de Tiquetes"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}