import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, ShieldCheck, Ticket, Package, Banknote } from "lucide-react";
import { toast } from "sonner";

export function CashClosingView({ idAgencia }: { idAgencia: number }) {
  
  // Datos financieros simulados desglosados para la sucursal
  const reporteFinanciero = {
    tiquetesEfectivo: 2450000,
    tiquetesTarjeta: 1120000,
    fletesEncomiendas: 480000,   // 👈 Nuevos ingresos por carga
    comisionGiros: 235000,       // 👈 Nuevos ingresos por servicios postales
  };

  const totalRecaudado = 
    reporteFinanciero.tiquetesEfectivo + 
    reporteFinanciero.tiquetesTarjeta + 
    reporteFinanciero.fletesEncomiendas + 
    reporteFinanciero.comisionGiros;

  const handleEjecutarArqueo = () => {
    toast.success("Arqueo general procesado. Caja bloqueada para auditoría central.");
  };

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Coins className="w-5 h-5 text-blue-600" /> Arqueo y Cierre de Caja Consolidado
        </CardTitle>
        <CardDescription>
          Muestra el consolidado acumulado de todos los turnos de taquilla y operaciones de carga de hoy.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        {/* Grilla Inyectada con desglose analítico */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-4 bg-slate-50 border rounded-xl flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg"><Ticket className="w-5 h-5" /></div>
            <div>
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Venta Tiquetes</span>
              <p className="text-lg font-black text-slate-900">${(reporteFinanciero.tiquetesEfectivo + reporteFinanciero.tiquetesTarjeta).toLocaleString()}</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border rounded-xl flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg"><Package className="w-5 h-5" /></div>
            <div>
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Fletes Encomiendas</span>
              <p className="text-lg font-black text-slate-900">${reporteFinanciero.fletesEncomiendas.toLocaleString()}</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border rounded-xl flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg"><Banknote className="w-5 h-5" /></div>
            <div>
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Comisión de Giros</span>
              <p className="text-lg font-black text-slate-900">${reporteFinanciero.comisionGiros.toLocaleString()}</p>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg"><Coins className="w-5 h-5" /></div>
            <div>
              <span className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">Total Neto Recaudado</span>
              <p className="text-xl font-black text-emerald-900">${totalRecaudado.toLocaleString()}</p>
            </div>
          </div>

        </div>

        {/* Resumen de medios de pago para auditoría */}
        <div className="bg-slate-50 p-4 rounded-xl border space-y-2 text-sm">
          <h4 className="font-bold text-slate-700 border-b pb-2 mb-2">Composición Física de Valores</h4>
          <div className="flex justify-between text-slate-600">
            <span>Efectivo Físico en Caja (Tiquetes + Encomiendas + Giros):</span>
            <span className="font-mono font-bold text-slate-900">${(totalRecaudado - reporteFinanciero.tiquetesTarjeta).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Vaucher Datáfonos / Transferencias QR Bancarias:</span>
            <span className="font-mono font-bold text-slate-900">${reporteFinanciero.tiquetesTarjeta.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button onClick={handleEjecutarArqueo} className="bg-slate-900 hover:bg-slate-800 text-white gap-2 shadow-md font-medium">
            <ShieldCheck className="w-4 h-4" /> Ejecutar Arqueo General de la Agencia
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}