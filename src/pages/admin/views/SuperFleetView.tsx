import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Bus, User, Users, MapPin, Route, 
  Wrench, PlayCircle, Coffee, AlertCircle 
} from "lucide-react";

interface AutobusGlobal {
  placa: string;
  interno: string;
  empresa: string;
  capacidadMax: number;
  estado: 'EN_RUTA' | 'EN_ESPERA' | 'EN_MANTENIMIENTO';
  // Detalles dinámicos exclusivos de operación en ruta
  rutaDetalle?: {
    origen: string;
    destino: string;
    conductor: string;
    pasajerosAboard: number;
  };
}

export function SuperFleetView() {
  // 🚍 Dataset Maestro de la Flota Nacional de Buses
  const [buses] = useState<AutobusGlobal[]>([
    {
      placa: "SXT-432",
      interno: "102",
      empresa: "Expreso Bolivariano",
      capacidadMax: 42,
      estado: "EN_RUTA",
      rutaDetalle: {
        origen: "Bogotá Salitre",
        destino: "Medellín Norte",
        conductor: "Carlos Mario Restrepo",
        pasajerosAboard: 38
      }
    },
    {
      placa: "TLK-891",
      interno: "550",
      empresa: "Flota Magdalena",
      capacidadMax: 40,
      estado: "EN_RUTA",
      rutaDetalle: {
        origen: "Ibagué",
        destino: "Cali",
        conductor: "Albeiro de Jesús Castro",
        pasajerosAboard: 15
      }
    },
    {
      placa: "KGL-234",
      interno: "882",
      empresa: "Expreso Bolivariano",
      capacidadMax: 38,
      estado: "EN_ESPERA" // En terminal local/patio listo para asignación
    },
    {
      placa: "ZXC-987",
      interno: "115",
      empresa: "Coomotor",
      capacidadMax: 40,
      estado: "EN_MANTENIMIENTO" // Bloqueado en taller central
    }
  ]);

  // Contadores para las tarjetas informativas superiores
  const totalBuses = buses.length;
  const enRuta = buses.filter(b => b.estado === 'EN_RUTA').length;
  const enEspera = buses.filter(b => b.estado === 'EN_ESPERA').length;
  const enTaller = buses.filter(b => b.estado === 'EN_MANTENIMIENTO').length;

  return (
    <div className="space-y-6">
      
      {/* ─── ENCABEZADO Y ADVERTENCIA DE CONTROL ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-xl shadow-md">
        <div>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
            <Route className="w-5 h-5 text-red-500" /> Monitor de Tráfico Terrestre Nacional
          </h2>
          <p className="text-xs text-slate-400 mt-1">Desglose e inspección de servicios activos, tripulaciones y andenes de espera.</p>
        </div>
        <div className="flex gap-2 text-xs font-mono">
          <span className="bg-blue-950 border border-blue-800 px-3 py-1.5 rounded text-blue-400 font-bold">Ruta: {enRuta}</span>
          <span className="bg-emerald-950 border border-emerald-800 px-3 py-1.5 rounded text-emerald-400 font-bold">Espera: {enEspera}</span>
          <span className="bg-amber-950 border border-amber-800 px-3 py-1.5 rounded text-amber-400 font-bold">Taller: {enTaller}</span>
        </div>
      </div>

      {/* ─── GRID DE BUSES REGISTRADOS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {buses.map((bus) => {
          const ocupacionPorcentaje = bus.rutaDetalle 
            ? Math.round((bus.rutaDetalle.pasajerosAboard / bus.capacidadMax) * 100) 
            : 0;

          return (
            <Card key={bus.placa} className="bg-white border-slate-200 shadow-sm hover:shadow transition-shadow overflow-hidden">
              
              {/* Encabezado de Tarjeta de Vehículo */}
              <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-900 text-white rounded-lg font-mono font-black text-xs border tracking-wider">
                    {bus.placa}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Interno #{bus.interno}</h3>
                    <span className="text-[11px] font-medium text-slate-400 block">{bus.empresa}</span>
                  </div>
                </div>

                {/* Badge de Estado del Bus */}
                <div>
                  {bus.estado === 'EN_RUTA' && (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-bold flex items-center gap-1">
                      <PlayCircle className="w-3 h-3 animate-spin text-blue-600" /> En Ruta
                    </Badge>
                  )}
                  {bus.estado === 'EN_ESPERA' && (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold flex items-center gap-1">
                      <Coffee className="w-3 h-3" /> En Espera / Patio
                    </Badge>
                  )}
                  {bus.estado === 'EN_MANTENIMIENTO' && (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-bold flex items-center gap-1">
                      <Wrench className="w-3 h-3" /> En Mantenimiento
                    </Badge>
                  )}
                </div>
              </div>

              {/* Contenido Dinámico según Estado */}
              <CardContent className="p-4">
                {bus.estado === 'EN_RUTA' && bus.rutaDetalle ? (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    
                    {/* Origen y Destino */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Terminal Origen</span>
                        <div className="flex items-center gap-1 font-bold text-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" /> {bus.rutaDetalle.origen}
                        </div>
                      </div>
                      <div className="border-l pl-4">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Terminal Destino</span>
                        <div className="flex items-center gap-1 font-bold text-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-rose-600" /> {bus.rutaDetalle.destino}
                        </div>
                      </div>
                    </div>

                    {/* Conductor a Cargo */}
                    <div className="text-xs flex items-center gap-2 text-slate-600">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Conductor: <strong className="text-slate-900 font-semibold">{bus.rutaDetalle.conductor}</strong></span>
                    </div>

                    {/* Barra de Pasajeros / Ocupación */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-purple-600" /> Ocupación: {bus.rutaDetalle.pasajerosAboard} / {bus.capacidadMax} Pasajeros
                        </span>
                        <span>{ocupacionPorcentaje}%</span>
                      </div>
                      <Progress value={ocupacionPorcentaje} className="h-1.5 bg-slate-100" />
                    </div>

                  </div>
                ) : bus.estado === 'EN_ESPERA' ? (
                  <div className="py-6 text-center text-xs text-slate-400 font-medium flex flex-col items-center justify-center gap-2">
                    <Coffee className="w-8 h-8 text-slate-300" />
                    <span>Vehículo limpio y disponible en andén de alistamiento. Capacidad libre para {bus.capacidadMax} pasajeros.</span>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400 font-medium flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-8 h-8 text-amber-400" />
                    <span className="text-amber-800 font-semibold">Bloqueado por Orden de Taller.</span>
                    <span className="max-w-xs text-[11px] -mt-1 text-slate-400">Ventas inhabilitadas globalmente hasta que se registre la salida técnica.</span>
                  </div>
                )}
              </CardContent>

            </Card>
          );
        })}
      </div>

    </div>
  );
}