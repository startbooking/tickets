import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserSquare2, Plus, Contact, Award, AlertCircle } from "lucide-react";

export function DriversManagementView() {
  const mockDrivers = [
    { id: 1, name: "ALBERTO GÓMEZ RODRÍGUEZ", cedula: "79.456.123", licencia: "C3", vencimiento: "2029-05-12", estado: "Apto" },
    { id: 2, name: "ORLANDO LLANOS JURADO", cedula: "17.234.890", licencia: "C2", vencimiento: "2026-08-20", estado: "Licencia por Vencer" }
  ];

  return (
    <Card className="shadow-sm border-slate-200 bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <UserSquare2 className="w-5 h-5 text-blue-600" />
            Maestro de Conductores / Operadores
          </CardTitle>
          <CardDescription className="mt-1">Historial de licencias de conducción de servicio público, seguridad social y vigencias.</CardDescription>
        </div>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" /> Registrar Conductor
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {mockDrivers.map((d) => (
            <div key={d.id} className="p-4 border rounded-xl bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-slate-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0">
                  {d.name.slice(0, 2)}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900 tracking-wide">{d.name}</h4>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Contact className="w-3.5 h-3.5" /> CC: {d.cedula}</span>
                    <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-blue-500" /> Cat: {d.licencia}</span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-400">Vence Licencia: {d.vencimiento}</p>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                  d.estado === 'Apto' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {d.estado !== 'Apto' && <AlertCircle className="w-3 h-3" />}
                  {d.estado}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}