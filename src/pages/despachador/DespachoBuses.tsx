import { ViajeDespacho } from '@/types';
import { useCallback, useEffect, useState } from 'react';
import { travelsoftService, OridesOption, HorarioOption, VehiculoOption } from '@/services/travelsoftService';
import { toast } from 'sonner';
import {
  Bus, Clock, FileText, Plus, Save, Send, Users, MapPin, AlertTriangle, Loader2,
} from 'lucide-react';

export default function DespachoBuses() {
  const [viajes, setViajes] = useState<ViajeDespacho[]>([]);
  const [viajeSeleccionado, setViajeSeleccionado] = useState<ViajeDespacho | null>(null);

  // Catálogos desde la BD
  const [destinos, setDestinos] = useState<OridesOption[]>([]);
  const [horarios, setHorarios] = useState<HorarioOption[]>([]);
  const [vehiculos, setVehiculos] = useState<VehiculoOption[]>([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(false);

  // Formulario de nuevo despacho
  const [destinoSel, setDestinoSel] = useState<number | ''>('');
  const [horaSel, setHoraSel] = useState<string>('');
  const [placaSel, setPlacaSel] = useState<string>('');

  const [guardando, setGuardando] = useState(false);
  const [despachando, setDespachando] = useState(false);

  const cargarCatalogos = useCallback(async () => {
    setCargandoCatalogos(true);
    try {
      const [d, h, v] = await Promise.all([
        travelsoftService.getDestinosFiltrados(),
        travelsoftService.getHorarios(),
        travelsoftService.getVehiculosDropdown(),
      ]);
      setDestinos(d);
      setHorarios(h.filter((x) => x.hora_time != null));
      setVehiculos(v);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudieron cargar los catálogos.');
    } finally {
      setCargandoCatalogos(false);
    }
  }, []);

  useEffect(() => {
    void cargarCatalogos();
  }, [cargarCatalogos]);

  // Seleccionar el primer viaje por defecto al cargar
  useEffect(() => {
    if (viajes.length > 0 && !viajeSeleccionado) {
      setViajeSeleccionado(viajes[0]);
    }
  }, [viajes, viajeSeleccionado]);

  const handleCrearDespacho = async () => {
    if (!destinoSel || !horaSel || !placaSel) {
      toast.error('Seleccione destino, hora y vehículo.');
      return;
    }
    const destino = destinos.find((d) => d.id_orides === Number(destinoSel));
    const horario = horarios.find((h) => String(h.id_horario) === horaSel);
    const vehiculo = vehiculos.find((v) => v.placa_vehi === placaSel);

    const horaTime = horario?.hora_time ?? null;
    const horaAMinutos = (value: string): number => {
      const [h, m] = value.split(':').map(Number);
      return Number.isNaN(h) || Number.isNaN(m) ? 0 : h * 60 + m;
    };
    const horaRuta = horaTime ? horaAMinutos(horaTime.slice(0, 5)) : 0;
    const horaProgramada = horaTime ? horaTime.slice(0, 5) : undefined;

    setGuardando(true);
    try {
      const res = await travelsoftService.crearRuta({
        destino_ruta: Number(destinoSel),
        hora_ruta: horaRuta,
        id_horario: horario?.id_horario ?? undefined,
        hora_programada: horaProgramada,
        placa_vehi: placaSel,
        numero_orden: (vehiculo?.orden_vehi || '').trim().replace(/\D/g, '').slice(0, 6) || undefined,
      });
      const cod_ruta = (res.cod_ruta as number) ?? (res.id_ruta as number) ?? 0;
      const nuevoViaje: ViajeDespacho = {
        id_viaje: viajes.length + 1,
        cod_ruta: cod_ruta,
        destino: destino?.desc_orides ?? String(destinoSel),
        fecha: new Date().toISOString().split('T')[0],
        hora: horario?.hora_horario ?? horaProgramada ?? '',
        placa_bus: placaSel,
        capacidad: vehiculo?.pasajeros_vehi ?? 42,
        estado: 'Programado',
        pasajeros: [],
      };

      setViajes([nuevoViaje, ...viajes]);
      setViajeSeleccionado(nuevoViaje);
      toast.success(`Viaje a ${nuevoViaje.destino} programado en ruta #${cod_ruta}.`);
      setDestinoSel('');
      setHoraSel('');
      setPlacaSel('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo crear el despacho.');
    } finally {
      setGuardando(false);
    }
  };

  // Alternar el estado de abordaje del pasajero
  const handleCheckAsistencia = (documento: string) => {
    if (!viajeSeleccionado) return;

    const pasajerosActualizados = viajeSeleccionado.pasajeros.map(p =>
      p.documento === documento ? { ...p, asistio: !p.asistio } : p,
    );

    const viajeActualizado = { ...viajeSeleccionado, pasajeros: pasajerosActualizados };

    setViajeSeleccionado(viajeActualizado);
    setViajes(viajes.map(v => v.id_viaje === viajeActualizado.id_viaje ? viajeActualizado : v));
  };

  // Cambiar estado del viaje a "En Ruta" (Despachar Bus)
  const handleDespacharBus = async (id: number) => {
    const viaje = viajes.find((v) => v.id_viaje === id);
    if (!viaje?.cod_ruta) {
      toast.error('No se puede despachar: la ruta no fue creada en la BD.');
      return;
    }
    setDespachando(true);
    try {
      await travelsoftService.despacharVehiculo(viaje.cod_ruta);
      setViajes(viajes.map(v => {
        if (v.id_viaje === id) {
          const actualizado: ViajeDespacho = { ...v, estado: 'En Ruta' };
          setViajeSeleccionado(actualizado);
          return actualizado;
        }
        return v;
      }));
      toast.success(`🚨 ¡Bus con placa ${viaje.placa_bus} despachado hacia ${viaje.destino}!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo despachar el vehículo.');
    } finally {
      setDespachando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Encabezado del Módulo */}
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            📋 Módulo de Despacho y Rodamiento
          </h1>
          <p className="text-gray-500 text-sm">Control de bahías, abordaje y liberación de rutas intermunicipales.</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
          📍 Terminal Origen: <span className="font-bold">Bogotá (Salitre)</span>
        </div>
      </header>

      {/* Panel de Programación de Nuevo Despacho */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600" />
          Programar Nueva Salida
        </h2>
        {cargandoCatalogos ? (
          <p className="text-sm text-gray-500">Cargando catálogos...</p>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600">Destino</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              value={destinoSel}
              onChange={(e) => setDestinoSel(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Seleccione un destino</option>
              {destinos.map((d) => (
                <option key={d.id_orides} value={d.id_orides}>
                  {d.desc_orides}
                </option>
              ))}
            </select>
          </div>
           <div className="space-y-1.5">
             <label className="text-xs font-bold text-slate-600">Hora de salida</label>
             <select
               className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 disabled:opacity-60"
               value={horaSel}
               onChange={(e) => setHoraSel(e.target.value)}
               disabled={cargandoCatalogos}
             >
               <option value="">Seleccione la hora</option>
               {horarios.map((h) => (
                 <option key={h.id_horario} value={String(h.id_horario)}>
                   {h.hora_horario}
                 </option>
               ))}
             </select>
           </div>
           <div className="space-y-1.5">
             <label className="text-xs font-bold text-slate-600">Vehículo (Placa)</label>
             <select
               className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 disabled:opacity-60"
               value={placaSel}
               onChange={(e) => setPlacaSel(e.target.value)}
               disabled={cargandoCatalogos}
             >
               <option value="">Seleccione un bus</option>
               {vehiculos
                 .filter((v) => (v.estado_vehi ?? '1') === '1')
                 .map((v) => (
                 <option key={v.placa_vehi} value={v.placa_vehi}>
                   {v.placa_vehi} ({v.marca_vehi})
                 </option>
               ))}
             </select>
           </div>
        </div>
        )}
        <div className="mt-3">
          <button
            onClick={handleCrearDespacho}
            disabled={cargandoCatalogos || !destinoSel || !horaSel || !placaSel || guardando}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold px-4 py-2 rounded-lg shadow flex items-center gap-2 text-sm"
          >
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {guardando ? 'Guardando...' : 'Guardar Despacho'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMNA 1: Listado de Viajes del Día */}
        <div className="bg-white p-4 rounded-xl shadow-sm h-fit">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2 flex items-center gap-2">
            <Bus className="w-5 h-5" />
            Salidas Programadas
          </h2>
          <div className="space-y-3">
            {viajes.map((viaje) => (
              <div
                key={viaje.id_viaje}
                onClick={() => setViajeSeleccionado(viaje)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  viajeSeleccionado?.id_viaje === viaje.id_viaje
                    ? 'border-blue-500 bg-blue-50/40'
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-gray-800 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    {viaje.destino}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    viaje.estado === 'En Ruta'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {viaje.estado}
                  </span>
                </div>
                <div className="text-sm text-gray-600 grid grid-cols-2 gap-y-1">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" /> {viaje.hora}
                  </div>
                  <div>🔤 Placa: <span className="font-mono font-bold">{viaje.placa_bus}</span></div>
                  <div className="col-span-2 text-xs text-gray-400 mt-1">
                    👥 Ocupación: {viaje.pasajeros.length} / {viaje.capacidad} Asientos
                  </div>
                </div>
              </div>
            ))}
            {viajes.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">
                No hay salidas programadas. ¡Use el formulario de arriba para programar una!
              </p>
            )}
          </div>
        </div>

        {/* COLUMNA 2 & 3: Detalles del viaje seleccionado, Manifiesto y Mapa */}
        {viajeSeleccionado ? (
          <div className="lg:col-span-2 space-y-6">
            {/* Panel de Control de Despacho */}
            <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-blue-500">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-blue-600">
                    Viaje #{viajeSeleccionado.id_viaje}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900">{viajeSeleccionado.destino}</h3>
                  <p className="text-sm text-gray-500">
                    Salida: {viajeSeleccionado.fecha} a las {viajeSeleccionado.hora}
                  </p>
                </div>

                {viajeSeleccionado.estado === 'Programado' ? (
                  <button
                    onClick={() => handleDespacharBus(viajeSeleccionado.id_viaje)}
                    disabled={despachando}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold px-6 py-3 rounded-lg shadow transition-colors flex items-center justify-center gap-2"
                  >
                    {despachando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {despachando ? 'Despachando...' : 'Autorizar Salida (Despachar)'}
                  </button>
                ) : (
                  <div className="bg-green-100 text-green-800 font-bold px-6 py-3 rounded-lg text-center">
                    ✅ Vehículo en Ruta
                  </div>
                )}
              </div>
            </div>

            {/* Sub-Secciones Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Manifiesto / Listado de Pasajeros */}
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <h4 className="text-base font-bold text-gray-700 mb-3 flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-500" />
                    Lista de Pasajeros Autorizados
                  </span>
                  <span className="text-xs text-gray-500">
                    ({viajeSeleccionado.pasajeros.length} tiquetes)
                  </span>
                </h4>

                {viajeSeleccionado.pasajeros.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    No hay pasajeros registrados para este viaje todavía.
                  </p>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto pr-1">
                    {viajeSeleccionado.pasajeros.map((pasajero) => (
                      <div key={pasajero.documento} className="py-3 flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-800">
                            Silla {pasajero.asiento} - {pasajero.nombres} {pasajero.apellidos}
                          </div>
                          <div className="text-xs text-gray-400 font-mono">
                            Doc: {pasajero.documento}
                          </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded-md hover:bg-gray-100">
                          <input
                            type="checkbox"
                            checked={pasajero.asistio}
                            disabled={viajeSeleccionado.estado === 'En Ruta'}
                            onChange={() => handleCheckAsistencia(pasajero.documento)}
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                          />
                          <span className="text-xs font-semibold text-gray-600">Abordó</span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vista del Mapa de Asientos (Fines de Monitoreo visual) */}
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <h4 className="text-base font-bold text-gray-700 mb-3">
                  💺 Estado de Ocupación del Bus
                </h4>
                <div className="mb-4 flex gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-200 rounded" /> Libre
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-600 rounded" /> Vendido
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-600 rounded" /> Abordado
                  </div>
                </div>

                {/* Grid que simula el pasillo del bus intermunicipal */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 max-h-80 overflow-y-auto">
                  <div className="w-full text-center text-xs text-gray-400 font-bold mb-4 tracking-widest border-b pb-1 uppercase">
                    🚍 Frente / Conductor
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    {Array.from({ length: viajeSeleccionado.capacidad }, (_, i) => {
                      const numAsiento = i + 1;
                      const pasajeroInfo = viajeSeleccionado.pasajeros.find(
                        (p) => p.asiento === numAsiento,
                      );

                      let claseAsiento =
                        'bg-white text-gray-700 border-gray-300';
                      if (pasajeroInfo) {
                        claseAsiento = pasajeroInfo.asistio
                          ? 'bg-green-600 text-white border-green-700'
                          : 'bg-blue-600 text-white border-blue-700';
                      }

                      return (
                        <div
                          key={numAsiento}
                          title={
                            pasajeroInfo
                              ? `${pasajeroInfo.nombres} (Silla ${numAsiento})`
                              : `Asiento ${numAsiento} Vacío`
                          }
                          className={`p-2 text-xs font-bold rounded border shadow-sm transition-all ${claseAsiento}`}
                        >
                          {numAsiento}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
            Seleccione un viaje programado del panel izquierdo para gestionar su manifiesto y autorización.
          </div>
        )}
      </div>
    </div>
  );
}
