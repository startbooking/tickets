import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AgenciesManagementView() {
  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Gestión de Agencias y Sucursales
          </CardTitle>
          <CardDescription className="mt-1">Administración de puntos de venta autorizados y asignación geográfica.</CardDescription>
        </div>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Registrar Agencia
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Aquí renderizarás tu grilla de agencias conectada a tu base de datos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg bg-white shadow-sm flex justify-between items-center">
            <div>
              <h4 className="font-bold text-slate-900">Terminal Salitre - Bogotá</h4>
              <p className="text-xs text-slate-500">ID Agencia: #1 • Código Divipola: 11001</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Activa</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}