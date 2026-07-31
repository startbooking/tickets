import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

export function ResolutionsManagementView() {
  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Resoluciones de Facturación DIAN
          </CardTitle>
          <CardDescription className="mt-1">Control de prefijos, rangos autorizados y vigencias legales.</CardDescription>
        </div>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Nueva Resolución
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="border rounded-lg bg-white p-8 text-center text-slate-500">
          {/* Aquí mapearás el listado de resoluciones desde backend */}
          <p className="text-sm">Ninguna resolución activa o configurada. Presiona "Nueva Resolución" para homologar con la DIAN.</p>
        </div>
      </CardContent>
    </Card>
  );
}