import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, Bus, Map, Landmark, ShieldAlert, Users } from "lucide-react";

export default function SuperAdminHome() {
  const KPIs = [
    { title: "Ingresos Globales Hoy", value: "$45,230,000 COP", sub: "Venta de todas las agencias", icon: <Landmark className="text-emerald-600" /> },
    { title: "Flota Total Registrada", value: "48 Buses", sub: "A nivel nacional", icon: <Bus className="text-blue-600" /> },
    { title: "Rutas Activas", value: "14 Trayectos", sub: "Intermunicipales", icon: <Map className="text-purple-600" /> },
    { title: "Alertas de Documentación", value: "3 Vehículos", sub: "SOAT / Tecno por vencer", icon: <ShieldAlert className="text-rose-600" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Consolidado Corporativo</h1>
        <p className="text-sm text-slate-500">Monitoreo de operación, finanzas y control regulatorio global.</p>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIs.map((kpi, idx) => (
          <Card key={idx} className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{kpi.title}</span>
                <h3 className="text-xl font-black text-slate-900 mt-1">{kpi.value}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{kpi.sub}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border">{kpi.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* DETALLES DE AGENCIAS */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-600" /> Estado de Ventas por Terminal</CardTitle>
          <CardDescription>Consolidado en tiempo real del flujo financiero y despacho de pasajeros.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-xl overflow-hidden divide-y text-sm">
            <div className="grid grid-cols-4 p-3 bg-slate-50 font-bold text-slate-700 text-xs uppercase">
              <span>Terminal / Agencia</span>
              <span>Buses Despachados</span>
              <span>Tiquetes Vendidos</span>
              <span className="text-right">Total Caja</span>
            </div>
            <div className="grid grid-cols-4 p-3 hover:bg-slate-50 items-center">
              <span className="font-semibold text-slate-900">Bogotá Terminal Salitre</span>
              <span>12 Unidades</span>
              <span>340 Pasajeros</span>
              <span className="text-right font-mono font-bold text-emerald-600">$21,450,000</span>
            </div>
            <div className="grid grid-cols-4 p-3 hover:bg-slate-50 items-center">
              <span className="font-semibold text-slate-900">Medellín Terminal del Norte</span>
              <span>8 Unidades</span>
              <span>210 Pasajeros</span>
              <span className="text-right font-mono font-bold text-emerald-600">$14,890,000</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}