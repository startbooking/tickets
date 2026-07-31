import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, ShieldCheck, Building, Globe } from "lucide-react";
import { toast } from "sonner";

export function GeneralSettingsView() {
  const [loading, setLoading] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Configuración global de SACTel actualizada con éxito.");
    }, 1000);
  };

  return (
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
        <form onSubmit={handleSave} className="space-y-6">
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
  );
}