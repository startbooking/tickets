import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Bus, ArrowUpRight, ArrowDownLeft, CheckCircle2, Ticket, 
  Clock, AlertCircle, ChevronRight, Play 
} from "lucide-react";

export function DespachoBusesView({ idAgencia }: { idAgencia: number }) {
  
  // 📊 Datos Operativos en Tiempo Real (Métricas de la Terminal Local)
  const metricas = {
    enSitio: 6,
    saliendoProximo: 3,
    disponiblesRuta: 4,
    tiquetesPorVender: 142
  };

  // 🚌 Mock 1: Buses llegando o actualmente en andenes de desembarque
  const busesEnSitio = [
    { id: 1, placa: "XYZ-123", numero: "1020", origen: "Bogotá", estado: "EN_SITIO", horaLlegada: "11:30 AM" },
    { id: 2, placa: "UVW-456", numero: "2050", origen: "Medellín", estado: "LLEGANDO", horaLlegada: "12:05 PM" },
  ];

  // 🛫 Mock 2: Próximas salidas programadas con tiquetes vendidos
  const busesSaliendo = [
    { id: 3, placa: "STR-789", numero: "401", destino: "Cali", horaSalida: "12:30 PM", tiquetesVendidos: 32, capacidad: 40 },
    { id: 4, placa: "KGL-234", numero: "882", destino: "Ibagué", horaSalida: "01:15 PM", tiquetesVendidos: 12, capacidad: 38 },
  ];

  // 🔋 Mock 3: Buses en patio listos para que el administrador les asigne una ruta diaria
  const busesDisponibles = [
    { id: 5, placa: "ZXC-987", numero: "303", empresa: "Flota Magdalena", tipo: "Bus Premium" },
    { id: 6, placa: "QWE-654", numero: "115", empresa: "Expreso Bolivariano", tipo: "Buseta Ejecutiva" },
  ];

  return (
    <div className="space-y-6">
      
      {/* ─── ROW 1: TARJETAS DE MÉTRICAS (KPIs) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">En Sitio / Llegando</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{metricas.enSitio} <span className="text-xs text-slate-400 font-normal">buses</span></h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><ArrowDownLeft className="w-6 h-6" /></div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Salidas Próximas</span>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{metricas.saliendoProximo} <span className="text-xs text-slate-400 font-normal">rutas</span></h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><ArrowUpRight className="w-6 h-6" /></div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Disponibles en Patio</span>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{metricas.disponiblesRuta} <span className="text-xs text-slate-400 font-normal">unidades</span></h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 className="w-6 h-6" /></div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tiquetes Disponibles</span>
              <h3 className="text-2xl font-black text-purple-600 mt-1">{metricas.tiquetesPorVender} <span className="text-xs text-slate-400 font-normal">cupos</span></h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Ticket className="w-6 h-6" /></div>
          </CardContent>
        </Card>

      </div>

      {/* ─── ROW 2: CONTROL DE FLUJO TERRESTRE ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PANEL A: MONITOR DE LLEGADAS (EN SITIO / ARRIBANDO) */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b pb-4 bg-slate-50/50">
            <CardTitle className="text-base flex items-center gap-2 text-slate-800">
              <ArrowDownLeft className="w-4 h-4 text-blue-600" /> Monitoreo de Andenes e Ingresos
            </CardTitle>
            <CardDescription>Vehículos cruzando control satelital o estacionados en la terminal.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 divide-y">
            {busesEnSitio.map((bus) => (
              <div key={bus.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex flex-col justify-center items-center font-mono font-bold text-xs text-slate-700 border">
                    <span>N°</span>
                    <span className="text-blue-600 -mt-1">{bus.numero}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Placa: {bus.placa}</h4>
                    <p className="text-xs text-slate-500">Procedencia: <span className="font-semibold text-slate-700">{bus.origen}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      bus.estado === 'EN_SITIO' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800 animate-pulse'
                    }`}>
                      {bus.estado === 'EN_SITIO' ? 'En Sitio' : 'En Trayecto'}
                    </span>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1 justify-end"><Clock className="w-3 h-3" /> {bus.horaLlegada}</p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs font-semibold">Registrar Recibo</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* PANEL B: PRÓXIMAS SALIDAS Y OCUPACIÓN DE TIQUETES */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b pb-4 bg-slate-50/50">
            <CardTitle className="text-base flex items-center gap-2 text-slate-800">
              <ArrowUpRight className="w-4 h-4 text-amber-600" /> Próximos Despachos a Salida
            </CardTitle>
            <CardDescription>Ocupación de sillas, tiquetes vendidos y estado del viaje.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 divide-y">
            {busesSaliendo.map((bus) => {
              const porcentajeOcupacion = Math.round((bus.tiquetesVendidos / bus.capacidad) * 100);
              return (
                <div key={bus.id} className="p-4 space-y-3 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="px-2 py-1 bg-amber-50 text-amber-800 font-mono text-xs font-bold rounded border border-amber-200">
                        Interno {bus.numero}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Destino: {bus.destino} <span className="text-xs text-slate-400 font-mono">({bus.placa})</span></h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3 text-amber-500" /> Sale a las {bus.horaSalida}</p>
                      </div>
                    </div>
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1 font-semibold shadow-sm">
                      <Play className="w-3 h-3 fill-white" /> Despachar
                    </Button>
                  </div>
                  
                  {/* Barra de progreso de Tiquetes de la Ruta */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                      <span className="flex items-center gap-1"><Ticket className="w-3.5 h-3.5 text-purple-500" /> {bus.tiquetesVendidos} de {bus.capacidad} Tiquetes Vendidos</span>
                      <span>{porcentajeOcupacion}% Ocupado</span>
                    </div>
                    <Progress value={porcentajeOcupacion} className="h-1.5 bg-slate-100" />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

      </div>

      {/* ─── ROW 3: DISPONIBILIDAD PARA ASIGNACIÓN DE RUTAS ─── */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b pb-4 bg-slate-50/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2 text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Parque Automotor Disponible (En Patio)
            </CardTitle>
            <CardDescription>Buses validados mecánicamente y listos para cubrir rutas extraordinarias o itinerarios diarios.</CardDescription>
          </div>
          <div className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">Zona: Patio de Espera Local</div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {busesDisponibles.map((bus) => (
              <div key={bus.id} className="p-4 border border-slate-200 bg-slate-50/40 rounded-xl flex items-center justify-between hover:border-emerald-300 hover:bg-emerald-50/10 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                    <Bus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Interno {bus.numero} — <span className="font-mono text-emerald-600">{bus.placa}</span></h4>
                    <p className="text-xs text-slate-500">{bus.empresa} • <span className="text-slate-400">{bus.tipo}</span></p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50 text-xs font-bold gap-1">
                  Asignar Ruta <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}