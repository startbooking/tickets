import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wrench, FileText, History, User, Users, AlertTriangle, 
  Clock, MapPin, CheckCircle2, ShieldAlert, ChevronRight 
} from "lucide-react";
import { usePagination } from '@/hooks/usePagination';
import { PaginationBar } from "@/components/PaginationBar";

interface ViajeBitacora {
  idViaje: string;
  fecha: string;
  conductor: string;
  pasajerosDespachados: number;
  novedadesTrayecto: string;
  destino: string;
  horaLlegada: string;
  novedadLlegada: string;
}

interface Vehiculo {
  placa: string;
  interno: string;
  empresa: string;
  estadoMantenimiento: 'OPERATIVO' | 'MANTENIMIENTO_PREVENTIVO' | 'CRITICO_TALLER';
  soatVencimiento: string;
  tecnomecanica: string;
  ultimoCambioAceite: string;
  bitacoraViajes: ViajeBitacora[];
}

export function LocalVehiclesView({ idAgencia }: { idAgencia: number }) {
  // 🚌 Dataset de vehículos asignados a la sucursal con sus bitácoras embebidas
  const [vehiculos] = useState<Vehiculo[]>([
    {
      placa: "STX-789",
      interno: "404",
      empresa: "Flota Magdalena",
      estadoMantenimiento: "MANTENIMIENTO_PREVENTIVO",
      soatVencimiento: "2027-04-15",
      tecnomecanica: "Vigente (Vence 2026-11-20)",
      ultimoCambioAceite: "Hace 4,200 KM",
      bitacoraViajes: [
        {
          idViaje: "V-9982",
          fecha: "2026-07-01",
          conductor: "Jairo Humberto Gómez",
          pasajerosDespachados: 36,
          novedadesTrayecto: "Lluvia fuerte en línea de alta montaña, retraso de 20 min.",
          destino: "Ibagué",
          horaLlegada: "04:15 PM",
          novedadLlegada: "Ninguna. Vehículo entregado limpio."
        },
        {
          idViaje: "V-9810",
          fecha: "2026-06-29",
          conductor: "Albeiro de Jesús Castro",
          pasajerosDespachados: 40,
          novedadesTrayecto: "Falla menor en aire acondicionado en la mitad del trayecto.",
          destino: "Bogotá Terminal Salitre",
          horaLlegada: "11:10 AM",
          novedadLlegada: "Se reporta a taller local para revisión de ductos de enfriamiento."
        }
      ]
    },
    {
      placa: "KGL-234",
      interno: "882",
      empresa: "Expreso Bolivariano",
      estadoMantenimiento: "OPERATIVO",
      soatVencimiento: "2027-01-10",
      tecnomecanica: "Vigente (Vence 2027-02-05)",
      ultimoCambioAceite: "Hace 1,100 KM",
      bitacoraViajes: [
        {
          idViaje: "V-9990",
          fecha: "2026-07-02",
          conductor: "Carlos Mario Restrepo",
          pasajerosDespachados: 18,
          novedadesTrayecto: "Ninguna. Vía despejada.",
          destino: "Villavicencio",
          horaLlegada: "09:45 AM",
          novedadLlegada: "Ninguna. Vehículo listo para retorno."
        }
      ]
    },
    {
      placa: "ZXC-987",
      interno: "115",
      empresa: "Coomotor",
      estadoMantenimiento: "CRITICO_TALLER",
      soatVencimiento: "2026-08-22",
      tecnomecanica: "Vencida hace 3 días",
      ultimoCambioAceite: "Requiere Cambio Urgente",
      bitacoraViajes: []
    },
    {
      placa: "RTG-451",
      interno: "220",
      empresa: "Cootranshuila",
      estadoMantenimiento: "OPERATIVO",
      soatVencimiento: "2026-12-01",
      tecnomecanica: "Vigente (Vence 2027-01-15)",
      ultimoCambioAceite: "Hace 2,300 KM",
      bitacoraViajes: [
        {
          idViaje: "V-9951",
          fecha: "2026-07-03",
          conductor: "Néstor Iván Quintero",
          pasajerosDespachados: 29,
          novedadesTrayecto: "Ninguna. Vía despejada.",
          destino: "Neiva",
          horaLlegada: "06:30 PM",
          novedadLlegada: "Ninguna. Vehículo entregado a recibo."
        }
      ]
    },
    {
      placa: "MNO-612",
      interno: "304",
      empresa: "Autobuses Rápidos del Caribe",
      estadoMantenimiento: "MANTENIMIENTO_PREVENTIVO",
      soatVencimiento: "2027-03-20",
      tecnomecanica: "Vigente (Vence 2027-04-02)",
      ultimoCambioAceite: "Hace 6,800 KM",
      bitacoraViajes: [
        {
          idViaje: "V-9907",
          fecha: "2026-07-01",
          conductor: "Hugo Armando Páez",
          pasajerosDespachados: 34,
          novedadesTrayecto: "Frenos con desgaste leve, revisión programada.",
          destino: "Barranquilla",
          horaLlegada: "03:55 PM",
          novedadLlegada: "Pasa a taller para cambio de balatas."
        }
      ]
    }
  ]);

  // Vehículo seleccionado actualmente para inspección de Hoja de Vida
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<Vehiculo>(vehiculos[0]);

  // Paginación de la lista de vehículos (columna izquierda)
  const { paginatedItems, currentPage, totalPages, pageSize, setPageSize, goToPage, nextPage, prevPage, goToFirst, goToLast } =
    usePagination<Vehiculo>(vehiculos, 25);

  const getBadgeEstado = (estado: Vehiculo['estadoMantenimiento']) => {
    switch (estado) {
      case 'OPERATIVO':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold">Operativo (En Ruta)</Badge>;
      case 'MANTENIMIENTO_PREVENTIVO':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold">Mantenimiento Preventivo</Badge>;
      case 'CRITICO_TALLER':
        return <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse">Crítico - Fuera de Servicio</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
      
      {/* COLUMNA IZQUIERDA: LISTADO DE VEHÍCULOS DE LA AGENCIA */}
      <Card className="bg-white border-slate-200 shadow-sm xl:col-span-1">
        <CardHeader className="border-b pb-4 bg-slate-50/50">
          <CardTitle className="text-base flex items-center gap-2 text-slate-800">
            <Wrench className="w-4 h-4 text-slate-500" /> Control de Flota Local
          </CardTitle>
          <CardDescription>Estado de mantenimiento técnico de los autobuses en terminal.</CardDescription>
        </CardHeader>
        <CardContent className="p-2 divide-y">
          {paginatedItems.map((v) => (
            <button
              key={v.placa}
              type="button"
              onClick={() => setVehiculoSeleccionado(v)}
              className={`w-full p-3 flex items-center justify-between rounded-lg transition-all text-left ${
                vehiculoSeleccionado.placa === v.placa 
                  ? "bg-blue-50/70 border border-blue-200 shadow-sm" 
                  : "hover:bg-slate-50"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border">
                    {v.placa}
                  </span>
                  <span className="text-xs font-bold text-slate-500">Int. {v.interno}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 truncate max-w-[180px]">{v.empresa}</p>
                <div className="mt-2">{getBadgeEstado(v.estadoMantenimiento)}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          ))}
          {totalPages > 1 && (
            <div className="p-3 border-t">
              <PaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={vehiculos.length}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                onGoToPage={goToPage}
                onPrevPage={prevPage}
                onNextPage={nextPage}
                onGoToFirst={goToFirst}
                onGoToLast={goToLast}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* COLUMNA DERECHA: HOJA DE VIDA Y BITÁCORA DETALLADA */}
      <Card className="bg-white border-slate-200 shadow-sm xl:col-span-2">
        <CardHeader className="border-b pb-4 bg-slate-900 text-white rounded-t-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">Hoja de Vida de Flota</span>
              <CardTitle className="text-lg mt-1 font-black">Vehículo Interno #{vehiculoSeleccionado.interno} — Placa {vehiculoSeleccionado.placa}</CardTitle>
            </div>
            <div className="bg-slate-800 px-3 py-1.5 rounded border border-slate-700 text-xs font-mono">
              {vehiculoSeleccionado.empresa}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Tabs defaultValue="hojavida" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 p-1 rounded-lg">
              <TabsTrigger value="hojavida" className="flex items-center gap-2 text-xs sm:text-sm"><FileText className="w-4 h-4" /> Ficha y Documentación Legal</TabsTrigger>
              <TabsTrigger value="bitacora" className="flex items-center gap-2 text-xs sm:text-sm"><History className="w-4 h-4" /> Bitácora de Viajes e Historial</TabsTrigger>
            </TabsList>

            {/* TAB 1: HOJA DE VIDA / TRÁMITES LEGALES */}
            <TabsContent value="hojavida" className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 border rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Vencimiento SOAT</span>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {vehiculoSeleccionado.soatVencimiento}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 border rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Revisión Técnico-Mecánica</span>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    {vehiculoSeleccionado.estadoMantenimiento === 'CRITICO_TALLER' ? (
                      <><ShieldAlert className="w-4 h-4 text-rose-500" /> <span className="text-rose-600">{vehiculoSeleccionado.tecnomecanica}</span></>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> {vehiculoSeleccionado.tecnomecanica}</>
                    )}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 border rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Estado de Motor / Aceite</span>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-blue-500" /> {vehiculoSeleccionado.ultimoCambioAceite}
                  </p>
                </div>
              </div>

              <div className="p-4 border border-blue-100 bg-blue-50/40 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider">Anotaciones de la Administración de la Agencia</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Este registro está vinculado al sistema central de SACTel.Cloud. Cualquier alteración mecánica en carretera debe reportarse de inmediato para suspender de forma temporal la venta automatizada de tiquetes en taquilla.
                </p>
              </div>
            </TabsContent>

            {/* TAB 2: BITÁCORA DETALLADA DE TRAYECTOS */}
            <TabsContent value="bitacora" className="space-y-4 animate-in fade-in-50 duration-200">
              {vehiculoSeleccionado.bitacoraViajes.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm font-medium border-2 border-dashed rounded-xl">
                  Este vehículo no registra viajes operados o despachados recientemente en esta sucursal.
                </div>
              ) : (
                <div className="space-y-4">
                  {vehiculoSeleccionado.bitacoraViajes.map((viaje) => (
                    <div key={viaje.idViaje} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                      
                      {/* Cabecera del Viaje */}
                      <div className="bg-slate-50 p-3 border-b flex justify-between items-center text-xs">
                        <span className="font-mono font-bold text-blue-600">{viaje.idViaje} — Trayecto del {viaje.fecha}</span>
                        <div className="flex items-center gap-1 font-semibold text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" /> Destino: {viaje.destino}
                        </div>
                      </div>

                      {/* Cuerpo de Información Solicitada */}
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-2">
                          <p className="text-slate-600 flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" /> 
                            <span>Conductor Asignado: <strong className="text-slate-900 font-semibold">{viaje.conductor}</strong></span>
                          </p>
                          <p className="text-slate-600 flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-400" /> 
                            <span>Pasajeros Despachados: <strong className="text-slate-900 font-semibold">{viaje.pasajerosDespachados} ciudadanos</strong></span>
                          </p>
                          <p className="text-slate-600 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" /> 
                            <span>Hora de Llegada Registrada: <strong className="text-slate-900 font-semibold">{viaje.horaLlegada}</strong></span>
                          </p>
                        </div>

                        <div className="space-y-2 border-t md:border-t-0 md:border-l md:pl-4 pt-2 md:pt-0">
                          <div className="p-2 bg-amber-50 border border-amber-100 rounded text-amber-900">
                            <span className="font-bold flex items-center gap-1 mb-0.5"><AlertTriangle className="w-3.5 h-3.5" /> Novedades durante el trayecto:</span>
                            <p className="text-slate-700">{viaje.novedadesTrayecto}</p>
                          </div>
                          <div className="p-2 bg-slate-50 border rounded text-slate-900">
                            <span className="font-bold block mb-0.5">Novedad registrada al arribo:</span>
                            <p className="text-slate-600">{viaje.novedadLlegada}</p>
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

    </div>
  );
}