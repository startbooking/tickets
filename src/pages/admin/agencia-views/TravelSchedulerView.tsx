import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, Plus, Clock, Bus, MapPin, SlidersHorizontal, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { travelsoftService, VehiculoSACTel } from "@/services/travelsoftService";

interface ProgramacionViaje {
  id: number;
  placa: string;
  interno: string;
  ruta: string;
  horaSalida: string;
  capacidad: number;
}

export function TravelSchedulerView({ idAgencia }: { idAgencia: number }) {
  // 🎛️ Estados de Filtro: 'DIA' (Ver cronograma completo) o 'BUS' (Filtrar por placa/interno)
  const [enfoqueFiltro, setEnfoqueFiltro] = useState<'DIA' | 'BUS'>('DIA');
  const [busFiltrado, setBusFiltrado] = useState('');

  // 📝 Estados para el Formulario de Nueva Programación
  const [placa, setPlaca] = useState('');
  const [interno, setInterno] = useState('');
  const [ruta, setRuta] = useState('');
  const [hora, setHora] = useState('');

  // 🚌 Vehículos operativos disponibles en la agencia (origen_siguiente === idAgencia)
  const [vehiculosDisponibles, setVehiculosDisponibles] = useState<VehiculoSACTel[]>([]);
  const [cargandoVehiculos, setCargandoVehiculos] = useState(true);

  const cargarVehiculos = useCallback(async () => {
    setCargandoVehiculos(true);
    try {
      setVehiculosDisponibles(await travelsoftService.getVehiculosDisponiblesAgencia(idAgencia));
    } catch (err) {
      setVehiculosDisponibles([]);
      toast.error(err instanceof Error ? err.message : 'No se pudieron cargar los vehículos disponibles.');
    } finally {
      setCargandoVehiculos(false);
    }
  }, [idAgencia]);

  useEffect(() => {
    void cargarVehiculos();
  }, [cargarVehiculos]);

  const vehiculoSeleccionado = useMemo(
    () => vehiculosDisponibles.find((v) => v.placa_vehi === placa) || null,
    [vehiculosDisponibles, placa]
  );

  const handleCambiarPlaca = (nuevaPlaca: string) => {
    setPlaca(nuevaPlaca);
    const v = vehiculosDisponibles.find((x) => x.placa_vehi === nuevaPlaca);
    setInterno(v?.orden_vehi?.trim() ?? '');
  };

  // Mock de datos iniciales programados para el día de hoy
  const [cronograma, setCronograma] = useState<ProgramacionViaje[]>([
    { id: 1, placa: "SXT-432", interno: "102", ruta: "Medellín Express", horaSalida: "06:00 AM", capacidad: 42 },
    { id: 2, placa: "TLK-891", interno: "550", ruta: "Cali Directo", horaSalida: "08:30 AM", capacidad: 38 },
    { id: 3, placa: "SXT-432", interno: "102", ruta: "Ibagué Intermedio", horaSalida: "02:15 PM", capacidad: 42 },
    { id: 4, placa: "MNO-612", interno: "304", ruta: "Bogotá Sabanera", horaSalida: "04:45 PM", capacidad: 19 },
  ]);

  const handleProgramarViaje = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placa || !interno || !ruta || !hora) {
      toast.error("Por favor completa todos los campos del itinerario");
      return;
    }

    // Formatear hora de manera legible (AM/PM simple)
    const [hours, minutes] = hora.split(':');
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    const displayHours = parseInt(hours) % 12 || 12;
    const horaFormateada = `${displayHours}:${minutes} ${ampm}`;

    const nuevoViaje: ProgramacionViaje = {
      id: Date.now(),
      placa: placa.toUpperCase(),
      interno,
      ruta,
      horaSalida: horaFormateada,
      capacidad: vehiculoSeleccionado?.pasajeros_vehi ?? 40,
    };

    setCronograma([...cronograma, nuevoViaje].sort((a, b) => a.horaSalida.localeCompare(b.horaSalida)));
    toast.success(`Viaje programado con éxito para el Interno ${interno}`);

    // Limpiar campos
    setPlaca('');
    setInterno('');
    setRuta('');
    setHora('');
  };

  // Filtrado lógico en el cliente
  const viajesFiltrados = cronograma.filter(viaje => {
    if (enfoqueFiltro === 'DIA') return true;
    return (
      viaje.placa.toLowerCase().includes(busFiltrado.toLowerCase()) ||
      viaje.interno.includes(busFiltrado)
    );
  });

  return (
    <div className="space-y-6">

      {/* ─── SECCIÓN 1: FORMULARIO DE ASIGNACIÓN RÁPIDA ─── */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b pb-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <div>
              <CardTitle className="text-base text-slate-800">Nueva Asignación de Ruta e Itinerario</CardTitle>
              <CardDescription>Vincula un autobús disponible a un horario específico para habilitar la venta de tiquetes.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleProgramarViaje} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase">Placa Vehículo</Label>
              <select
                className="w-full h-10 px-3 border border-slate-200 bg-white rounded-md text-sm text-slate-800"
                value={placa}
                onChange={(e) => handleCambiarPlaca(e.target.value)}
                disabled={cargandoVehiculos}
              >
                <option value="">
                  {cargandoVehiculos ? 'Cargando vehículos...' : '-- Seleccione Placa --'}
                </option>
                {vehiculosDisponibles.map((v) => (
                  <option key={v.placa_vehi} value={v.placa_vehi}>
                    {v.placa_vehi}
                    {v.marca_vehi || v.tipo_vehi ? ` · ${[v.marca_vehi, v.tipo_vehi].filter(Boolean).join(' ')}` : ''}
                    {v.pasajeros_vehi ? ` · ${v.pasajeros_vehi} sillas` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase">Número Interno</Label>
              <Input
                placeholder="Se completa al elegir placa"
                value={interno}
                onChange={(e) => setInterno(e.target.value)}
                readOnly={!!vehiculoSeleccionado}
                className={vehiculoSeleccionado ? 'bg-slate-50' : ''}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase">Ruta Autorizada</Label>
              <select
                className="w-full h-10 px-3 border border-slate-200 bg-white rounded-md text-sm text-slate-800"
                value={ruta}
                onChange={(e) => setRuta(e.target.value)}
              >
                <option value="">-- Seleccione Destino --</option>
                <option value="Medellín Express">Medellín Express (Directo)</option>
                <option value="Cali Directo">Cali Directo (Línea Alta)</option>
                <option value="Ibagué Intermedio">Ibagué Intermedio</option>
                <option value="Bogotá Sabanera">Bogotá Sabanera</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase">Hora de Salida</Label>
              <div className="relative">
                <Input
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="pl-9"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold">
              <Plus className="w-4 h-4" /> Programar
            </Button>
          </form>

          {/* Estado de disponibilidad de vehículos en la agencia */}
          {!cargandoVehiculos && vehiculosDisponibles.length === 0 && (
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              No hay vehículos operativos disponibles en esta agencia para programar.
            </div>
          )}
          {!cargandoVehiculos && vehiculosDisponibles.length > 0 && (
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <Bus className="w-4 h-4 shrink-0" />
              {vehiculosDisponibles.length} vehículo{vehiculosDisponibles.length !== 1 ? 's' : ''} operativo{vehiculosDisponibles.length !== 1 ? 's' : ''} disponible{vehiculosDisponibles.length !== 1 ? 's' : ''} en esta agencia.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── SECCIÓN 2: CONTROLADOR DE CRONOGRAMA Y FILTROS ─── */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2 text-slate-800">
              <SlidersHorizontal className="w-4 h-4 text-slate-500" /> Itinerarios Registrados
            </CardTitle>
            <CardDescription>Consulta el despacho programado bajo la modalidad que requieras.</CardDescription>
          </div>

          {/* Selector de tipo de visualización */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium self-start sm:self-center">
            <button
              type="button"
              onClick={() => { setEnfoqueFiltro('DIA'); setBusFiltrado(''); }}
              className={`px-3 py-1.5 rounded-md transition-all ${enfoqueFiltro === 'DIA' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Todo el Día
            </button>
            <button
              type="button"
              onClick={() => setEnfoqueFiltro('BUS')}
              className={`px-3 py-1.5 rounded-md transition-all ${enfoqueFiltro === 'BUS' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Por Autobús
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Input dinámico si el enfoque es filtrar por bus específico */}
          {enfoqueFiltro === 'BUS' && (
            <div className="mb-4 max-w-sm space-y-1.5 animate-in fade-in duration-200">
              <Label className="text-xs text-slate-500 font-semibold">Escribe la Placa o el Número Interno del Bus</Label>
              <div className="relative">
                <Input
                  placeholder="Ej: SXT-432 o 102..."
                  value={busFiltrado}
                  onChange={(e) => setBusFiltrado(e.target.value)}
                  className="pl-9"
                />
                <Bus className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          )}

          {/* Tabla / Lista de viajes del itinerario */}
          {viajesFiltrados.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm font-medium border-2 border-dashed rounded-xl">
              No se encontraron itinerarios programados para el criterio seleccionado.
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
              {viajesFiltrados.map((viaje) => (
                <div key={viaje.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">

                  {/* Info izquierda: Vehículo y Hora */}
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg flex flex-col items-center font-mono font-bold min-w-16 border border-blue-100">
                      <Clock className="w-3.5 h-3.5 mb-0.5 text-blue-500" />
                      <span className="text-xs">{viaje.horaSalida.split(' ')[0]}</span>
                      <span className="text-[9px] uppercase tracking-wide -mt-0.5 text-blue-600">{viaje.horaSalida.split(' ')[1]}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-900 text-white font-mono text-xs font-bold rounded">
                          Interno {viaje.interno}
                        </span>
                        <span className="text-xs font-bold text-slate-500 font-mono tracking-wide uppercase">
                          ({viaje.placa})
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-semibold text-slate-800 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        {viaje.ruta}
                      </div>
                    </div>
                  </div>

                  {/* Info derecha: Detalle Operativo y Botón */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-slate-400 uppercase font-bold block">Capacidad Autorizada</span>
                      <span className="text-xs font-bold text-slate-700">{viaje.capacidad} Sillas Disponibles</span>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs text-slate-600 hover:text-slate-900 font-medium">
                      Modificar Horario
                    </Button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
