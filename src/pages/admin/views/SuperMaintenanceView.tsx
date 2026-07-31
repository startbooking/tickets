import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch"; 
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, FileText, History, AlertOctagon, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface VehiculoGlobal {
  placa: string;
  interno: string;
  empresa: string;
  bloqueadoPorMantenimiento: boolean;
  soat: string;
  tecnomecanica: string;
}

export function SuperMaintenanceView() {
  const [vehiculos, setVehiculos] = useState<VehiculoGlobal[]>([
    { placa: "STX-789", interno: "404", empresa: "Flota Magdalena", bloqueadoPorMantenimiento: false, soat: "Vigente", tecnomecanica: "Vigente" },
    { placa: "KGL-234", interno: "882", empresa: "Expreso Bolivariano", bloqueadoPorMantenimiento: true, soat: "Vigente", tecnomecanica: "Vencida" },
    { placa: "ZXC-987", interno: "115", empresa: "Coomotor", bloqueadoPorMantenimiento: false, soat: "Vencido", tecnomecanica: "Vigente" },
  ]);

  const toggleBloqueo = (placa: string, estadoActual: boolean) => {
    setVehiculos(vehiculos.map(v => 
      v.placa === placa ? { ...v, bloqueadoPorMantenimiento: !estadoActual } : v
    ));
    
    if (!estadoActual) {
      toast.error(`Vehículo ${placa} BLOQUEADO. Ventas suspendidas a nivel nacional.`);
    } else {
      toast.success(`Vehículo ${placa} LIBERADO para programación en agencias.`);
    }
  };

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader className="border-b">
        <CardTitle className="text-base flex items-center gap-2"><Wrench className="w-5 h-5 text-blue-600" /> Control Centralizado de Mantenimiento de Flota</CardTitle>
        <CardDescription>Habilite o suspenda el parque automotor. Los vehículos bloqueados no podrán cargarse en planillas de viaje locales.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="border rounded-xl overflow-hidden divide-y text-sm">
          <div className="grid grid-cols-5 p-3 bg-slate-50 font-bold text-slate-700 text-xs uppercase">
            <span>Vehículo</span>
            <span>Empresa Aliada</span>
            <span>Documentos</span>
            <span>Estado Comercial</span>
            <span className="text-right">Acción de Bloqueo</span>
          </div>

          {vehiculos.map((v) => (
            <div key={v.placa} className="grid grid-cols-5 p-4 hover:bg-slate-50 items-center">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold bg-slate-100 border px-2 py-0.5 rounded text-slate-900">{v.placa}</span>
                <span className="text-xs text-slate-500 font-bold">Int. {v.interno}</span>
              </div>
              <span className="text-slate-600">{v.empresa}</span>
              <div className="flex gap-1">
                <Badge variant="outline" className={v.soat === 'Vigente' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}>SOAT</Badge>
                <Badge variant="outline" className={v.tecnomecanica === 'Vigente' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}>TECNOMECÁNICA</Badge>
              </div>
              <div>
                {v.bloqueadoPorMantenimiento ? (
                  <Badge className="bg-rose-100 text-rose-800 border-rose-200 flex items-center gap-1 w-max"><AlertOctagon className="w-3 h-3" /> Freno Taller</Badge>
                ) : (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 flex items-center gap-1 w-max"><ShieldCheck className="w-3 h-3" /> Activo Comercial</Badge>
                )}
              </div>
              <div className="flex justify-end">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">{v.bloqueadoPorMantenimiento ? "Bloqueado" : "Habilitado"}</span>
                  <Switch 
                    checked={v.bloqueadoPorMantenimiento} 
                    onCheckedChange={() => toggleBloqueo(v.placa, v.bloqueadoPorMantenimiento)} 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}