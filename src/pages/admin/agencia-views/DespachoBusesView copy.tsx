import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bus, ArrowUpRight, ArrowDownLeft } from "lucide-react";

export function DespachoBusesView({ idAgencia }: { idAgencia: number }) {
  return (
    <Card className="bg-white border-slate-200">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-lg flex items-center gap-2"><Bus className="w-5 h-5 text-blue-600" /> Despacho y Recibo de Unidades</CardTitle>
        <CardDescription>Valida la salida de vehículos en ruta o procesa la llegada y liberación de andenes.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button size="lg" className="h-24 bg-emerald-600 hover:bg-emerald-700 text-white flex flex-col gap-1 rounded-xl shadow-sm">
          <ArrowUpRight className="w-6 h-6" />
          <span className="font-bold text-base">Despachar Bus / Validar Planilla</span>
          <span className="text-xs font-normal text-emerald-100">Autoriza salida a carretera</span>
        </Button>
        <Button size="lg" variant="outline" className="h-24 border-2 border-slate-200 hover:bg-slate-50 flex flex-col gap-1 rounded-xl shadow-sm">
          <ArrowDownLeft className="w-6 h-6 text-blue-600" />
          <span className="font-bold text-base text-slate-800">Recibir Autobús en Destino</span>
          <span className="text-xs font-normal text-slate-500">Cierra trayecto y libera cupos</span>
        </Button>
      </CardContent>
    </Card>
  );
}