import { ViajeDespacho } from '@/types';
import React, { useState, useEffect } from 'react';


export default function DespachoBuses() {
  // Datos de prueba basados en los viajes programados de la base de datos
  const [viajes, setViajes] = useState<ViajeDespacho[]>([
    {
      id_viaje: 1,
      destino: 'Medellín (Antioquia)',
      fecha: '2026-07-15',
      hora: '06:30 AM',
      placa_bus: 'SXZ123',
      capacidad: 42,
      estado: 'Programado',
      pasajeros: [
        { documento: '1018234567', nombres: 'Carlos', apellidos: 'Mendoza', asiento: 5, asistio: false },
        { documento: '52345678', nombres: 'Ana', apellidos: 'Gomez', asiento: 6, asistio: false },
      ]
    },
    {
      id_viaje: 2,
      destino: 'Cali (Valle del Cauca)',
      fecha: '2026-07-15',
      hora: '09:30 AM',
      placa_bus: 'TRK456',
      capacidad: 38,
      estado: 'Programado',
      pasajeros: []
    }
  ]);

  const [viajeSeleccionado, setViajeSeleccionado] = useState<ViajeDespacho | null>(null);

  // Seleccionar el primer viaje por defecto al cargar
  useEffect(() => {
    if (viajes.length > 0 && !viajeSeleccionado) {
      setViajeSeleccionado(viajes[0]);
    }
  }, [viajes, viajeSeleccionado]);

  // Alternar el estado de abordaje del pasajero
  const handleCheckAsistencia = (documento: string) => {
    if (!viajeSeleccionado) return;

    const pasajerosActualizados = viajeSeleccionado.pasajeros.map(p => 
      p.documento === documento ? { ...p, asistio: !p.asistio } : p
    );

    const viajeActualizado = { ...viajeSeleccionado, pasajeros: pasajerosActualizados };
    
    setViajeSeleccionado(viajeActualizado);
    setViajes(viajes.map(v => v.id_viaje === viajeActualizado.id_viaje ? viajeActualizado : v));
  };

  // Cambiar estado del viaje a "En Ruta" (Despachar Bus)
  const handleDespacharBus = (id: number) => {
    setViajes(viajes.map(v => {
      if (v.id_viaje === id) {
        const actualizado: ViajeDespacho = { ...v, estado: 'En Ruta' };
        setViajeSeleccionado(actualizado);
        return actualizado;
      }
      return v;
    }));
    alert(`🚨 ¡Bus con placa ${viajeSeleccionado?.placa_bus} despachado exitosamente hacia ${viajeSeleccionado?.destino}!`);
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA 1: Listado de Viajes del Día */}
        <div className="bg-white p-4 rounded-xl shadow-sm h-fit">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">🚍 Salidas Programadas</h2>
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
                  <span className="font-bold text-gray-800">{viaje.destino}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    viaje.estado === 'En Ruta' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {viaje.estado}
                  </span>
                </div>
                <div className="text-sm text-gray-600 grid grid-cols-2 gap-y-1">
                  <div>⏰ {viaje.hora}</div>
                  <div>🔤 Placa: <span className="font-mono font-bold">{viaje.placa_bus}</span></div>
                  <div className="col-span-2 text-xs text-gray-400 mt-1">
                    👥 Ocupación: {viaje.pasajeros.length} / {viaje.capacidad} Asientos
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA 2 & 3: Detalles del viaje seleccionado, Manifiesto y Mapa */}
        {viajeSeleccionado ? (
          <div className="lg:col-span-2 space-y-6">
            
            {/* Panel de Control de Despacho */}
            <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-blue-500">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-blue-600">Viaje #00{viajeSeleccionado.id_viaje}</span>
                  <h3 className="text-xl font-bold text-gray-900">{viajeSeleccionado.destino}</h3>
                  <p className="text-sm text-gray-500">Salida: {viajeSeleccionado.fecha} a las {viajeSeleccionado.hora}</p>
                </div>
                
                {viajeSeleccionado.estado === 'Programado' ? (
                  <button
                    onClick={() => handleDespacharBus(viajeSeleccionado.id_viaje)}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg shadow transition-colors flex items-center justify-center gap-2"
                  >
                    🚀 Autorizar Salida (Despachar)
                  </button>
                ) : (
                  <div className="bg-green-100 text-green-800 font-bold px-6 py-3 rounded-lg text-center">
                    ✅ Vehículo en Ruta Internacional / Nacional
                  </div>
                )}
              </div>
            </div>

            {/* Sub-Secciones Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Manifiesto / Listado de Pasajeros */}
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <h4 className="text-base font-bold text-gray-700 mb-3 flex justify-between items-center">
                  <span>📋 Lista de Pasajeros Autorizados</span>
                  <span className="text-xs text-gray-500">({viajeSeleccionado.pasajeros.length} tiquetes)</span>
                </h4>
                
                {viajeSeleccionado.pasajeros.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No hay pasajeros registrados para este viaje todavía.</p>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto pr-1">
                    {viajeSeleccionado.pasajeros.map((pasajero) => (
                      <div key={pasajero.documento} className="py-3 flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-800">
                            Silla {pasajero.asiento} - {pasajero.nombres} {pasajero.apellidos}
                          </div>
                          <div className="text-xs text-gray-400 font-mono">Doc: {pasajero.documento}</div>
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
                <h4 className="text-base font-bold text-gray-700 mb-3">💺 Estado de Ocupación del Bus</h4>
                <div className="mb-4 flex gap-4 text-xs">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-200 rounded"></div> Libre</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-600 rounded"></div> Vendido</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-600 rounded"></div> Abordado</div>
                </div>

                {/* Grid que simula el pasillo del bus intermunicipal */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 max-h-80 overflow-y-auto">
                  <div className="w-full text-center text-xs text-gray-400 font-bold mb-4 tracking-widest border-b pb-1 uppercase">
                    🚍 Frente / Conductor
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {Array.from({ length: viajeSeleccionado.capacidad }, (_, i) => {
                      const numAsiento = i + 1;
                      const pasajeroInfo = viajeSeleccionado.pasajeros.find(p => p.asiento === numAsiento);
                      
                      let claseAsiento = "bg-white text-gray-700 border-gray-300";
                      if (pasajeroInfo) {
                        claseAsiento = pasajeroInfo.asistio 
                          ? "bg-green-600 text-white border-green-700" 
                          : "bg-blue-600 text-white border-blue-700";
                      }

                      return (
                        <div 
                          key={numAsiento}
                          title={pasajeroInfo ? `${pasajeroInfo.nombres} (Silla ${numAsiento})` : `Asiento ${numAsiento} Vacío`}
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
            Selecciona un viaje programado del panel izquierdo para gestionar su manifiesto y autorización.
          </div>
        )}
      </div>
    </div>
  );
}

