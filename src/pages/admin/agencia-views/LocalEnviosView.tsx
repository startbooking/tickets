import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Send, ArrowDownLeft, Landmark, Scale, DollarSign } from "lucide-react";
import { toast } from "sonner";

export function LocalEnviosView({ idAgencia }: { idAgencia: number }) {
  const [tipoEnvio, setTipoEnvio] = useState<'DINERO' | 'MERCANCIA'>('MERCANCIA');
  const [valorMonto, setValorMonto] = useState('');
  const [flete, setFlete] = useState(0);

  // Cálculo automático de fletes simulando las reglas de SACTel
  const handleMontoChange = (val: string) => {
    setValorMonto(val);
    const num = parseFloat(val) || 0;
    if (tipoEnvio === 'DINERO') {
      setFlete(Math.round(num * 0.05)); // 5% comisión por giro de dinero
    } else {
      setFlete(num > 20 ? 25000 : 12000); // Tarifa fija por rango de peso (kg)
    }
  };

  const handleRegistrarEnvio = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Envío registrado con éxito. Flete recaudado: $${flete.toLocaleString()}`);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Módulo de Envíos & Encomiendas</CardTitle>
              <CardDescription>Admisión de giros postales y despacho/recepción de mercancías en la terminal.</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <Tabs defaultValue="admitir" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 p-1 rounded-lg">
              <TabsTrigger value="admitir" className="flex items-center gap-2"><Send className="w-4 h-4" /> Registrar Salida (Admisión)</TabsTrigger>
              <TabsTrigger value="recibir" className="flex items-center gap-2"><ArrowDownLeft className="w-4 h-4" /> Registrar Entrega en Destino</TabsTrigger>
            </TabsList>

            {/* TAB: ADMISIÓN DE ENVÍOS */}
            <TabsContent value="admitir">
              <form onSubmit={handleRegistrarEnvio} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="space-y-2">
                    <Label>Tipo de Envío</Label>
                    <select 
                      className="w-full px-3 py-2 border bg-white rounded-md text-sm"
                      value={tipoEnvio}
                      onChange={(e) => { setTipoEnvio(e.target.value as any); setValorMonto(''); setFlete(0); }}
                    >
                      <option value="MERCANCIA">Mercancías / Encomiendas</option>
                      <option value="DINERO">Giro de Dinero (Postal)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>{tipoEnvio === 'DINERO' ? 'Monto a Enviar ($)' : 'Peso Estimado (KG)'}</Label>
                    <Input 
                      type="number" 
                      placeholder={tipoEnvio === 'DINERO' ? 'Ej: 500000' : 'Ej: 15'} 
                      value={valorMonto}
                      onChange={(e) => handleMontoChange(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-blue-700 font-bold">Valor Flete / Comisión</Label>
                    <div className="h-10 bg-blue-50 border border-blue-200 rounded-md flex items-center px-3 font-mono font-bold text-blue-700">
                      $ {flete.toLocaleString()} COP
                    </div>
                  </div>
                </div>

                {/* Remitente y Destinatario */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 border p-4 rounded-xl bg-white">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Datos del Remitente</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Documento" required />
                      <Input placeholder="Nombre Completo" className="uppercase" required />
                    </div>
                  </div>
                  <div className="space-y-3 border p-4 rounded-xl bg-white">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Datos del Destinatario</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Documento" required />
                      <Input placeholder="Nombre Completo" className="uppercase" required />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end border-t pt-4">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                    Guardar y Emitir Guía
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* TAB: RECEPCIÓN / ENTREGA */}
            <TabsContent value="recibir">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Buscar por número de guía o cédula..." className="max-w-md" />
                  <Button variant="secondary">Buscar Guía</Button>
                </div>
                <div className="border rounded-xl bg-white p-6 text-center text-slate-400 text-sm">
                  Ingrese el número de documento o guía física para registrar la entrega al ciudadano.
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}