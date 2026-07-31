import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LocalResolutionsView({ idAgencia }: { idAgencia: number }) {
  return (
    <Card className="bg-white border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /> Resoluciones Asignadas</CardTitle>
          <CardDescription>Vigila los rangos consumidos y la caducidad legal ante la DIAN para evitar frenos de venta.</CardDescription>
        </div>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1"><Plus className="w-4 h-4" /> Adicionar</Button>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="p-4 border border-amber-200 bg-amber-50/50 rounded-xl space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Prefijo: TR-SALITRE</h4>
              <p className="text-xs text-slate-500">Rango Autorizado: 1,000 al 10,000 • Vence: 2026-12-31</p>
            </div>
            <span className="text-xs font-black text-amber-700 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Crítico (85%)</span>
          </div>
          <div className="space-y-1">
            <Progress value={85} className="h-2 bg-slate-200" />
            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>Consumido: 8,500 tiquetes</span>
              <span>Quedan: 1,500</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}