import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bus, Plus, Armchair, FileCheck } from "lucide-react";

export function BusesManagementView() {
  const mockBuses = [
    { id: 1, placa: "ABC123", numeroInterno: "1024", capacidad: 32, tipo: "Piso y Medio", estado: "Operativo" },
    { id: 2, placa: "XYZ789", numeroInterno: "2050", capacidad: 40, tipo: "Doble Piso", estado: "Mantenimiento" }
  ];

  return (
    <Card className="shadow-sm border-slate-200 bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <Bus className="w-5 h-5 text-blue-600" />
            Flota de Vehículos (Buses)
          </CardTitle>
          <CardDescription className="mt-1">Vinculación de vehículos, auditoría de capacidad física y asignación de layouts.</CardDescription>
        </div>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" /> Vincular Vehículo
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockBuses.map((b) => (
            <div key={b.id} className="p-4 border rounded-xl bg-white shadow-sm flex items-start justify-between border-slate-200 hover:border-slate-300 transition-all">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-sm tracking-wider shadow-sm border border-amber-500">
                    {b.placa}
                  </span>
                  <span className="text-sm font-bold text-slate-700">Bus N° {b.numeroInterno}</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">{b.tipo}</p>
                
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 pt-1">
                  <div className="flex items-center gap-1"><Armchair className="w-3.5 h-3.5 text-blue-500" /> {b.capacidad} Sillas</div>
                  <div className="flex items-center gap-1"><FileCheck className="w-3.5 h-3.5 text-emerald-500" /> Tarjeta Activa</div>
                </div>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                b.estado === 'Operativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {b.estado}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}