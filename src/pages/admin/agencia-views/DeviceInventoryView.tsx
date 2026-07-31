import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Monitor, Smartphone, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeviceInventoryView({ idAgencia }: { idAgencia: number }) {
  const equipos = [
    { id: "PC-01", tipo: "Computador Pos", serial: "SN-99823", asignadoA: "Carlos Mendoza" },
    { id: "DAT-02", tipo: "Datáfono Redeban", serial: "SN-11204", asignadoA: "Sin Asignar" },
  ];

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-lg flex items-center gap-2"><Monitor className="w-5 h-5 text-blue-600" /> Inventario de Equipos Periféricos</CardTitle>
        <CardDescription>Asigna hardware, computadores y datáfonos a los cajeros para auditoría del turno.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {equipos.map(eq => (
            <div key={eq.id} className="p-4 border rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                {eq.tipo.includes("PC") ? <Monitor className="w-8 h-8 text-slate-400" /> : <Smartphone className="w-8 h-8 text-slate-400" />}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{eq.id} — {eq.tipo}</h4>
                  <p className="text-xs text-slate-500">Asignado: <span className="font-semibold text-blue-600">{eq.asignadoA}</span></p>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="text-blue-600 gap-1"><Link2 className="w-4 h-4" /> Asignar</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}