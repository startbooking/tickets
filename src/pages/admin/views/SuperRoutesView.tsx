import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Map, Plus, Users, Clock, ArrowRight, Trash2, Store, Landmark } from "lucide-react";
import { toast } from "sonner";

interface AgenciaLocal {
  id: string;
  ciudad: string;
  tipo: 'PROPIA' | 'CONCESION';
}

interface RutaEstructura {
  id: number;
  nombre: string;
  origenId: string;
  destinoId: string;
  intermediasIds: string[];
  conductoresNecesarios: number;
  tiempoEstimado: string;
}

export function SuperRoutesView() {
  // 🏢 Base de datos maestra de Ciudades donde la empresa tiene presencia y Agencias
  const [agencias, setAgencias] = useState<AgenciaLocal[]>([
    { id: "1", ciudad: "Bogotá - Salitre", tipo: "PROPIA" },
    { id: "2", ciudad: "Medellín - Norte", tipo: "PROPIA" },
    { id: "3", ciudad: "Villeta", tipo: "CONCESION" },
    { id: "4", ciudad: "Honda", tipo: "CONCESION" },
    { id: "5", ciudad: "Bucaramanga", tipo: "PROPIA" },
  ]);

  // 🛣️ Repositorio Maestro de Rutas
  const [rutas, setRutas] = useState<RutaEstructura[]>([
    { 
      id: 1, 
      nombre: "Troncal del Magdalena Central", 
      origenId: "1", 
      destinoId: "2", 
      intermediasIds: ["3", "4"], 
      conductoresNecesarios: 2, 
      tiempoEstimado: "8h 30m" 
    }
  ]);

  // Estados para añadir nuevas ciudades/agencias al sistema central
  const [nuevaCiudad, setNuevaCiudad] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState<'PROPIA' | 'CONCESION'>('PROPIA');

  // Estados del Formulario de Rutas
  const [nombreRuta, setNombreRuta] = useState('');
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [intermediasSeleccionadas, setIntermediasSeleccionadas] = useState<string[]>([]);
  const [conductores, setConductores] = useState('1');
  const [tiempo, setTiempo] = useState('');

  // 📝 Registrar una nueva ciudad/agencia en el Core
  const handleCrearAgencia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCiudad.trim()) return;

    const nueva: AgenciaLocal = {
      id: Date.now().toString(),
      ciudad: nuevaCiudad.trim(),
      tipo: nuevoTipo
    };

    setAgencias([...agencias, nueva]);
    setNuevaCiudad('');
    toast.success(`Ciudad / Agencia de ${nueva.ciudad} dada de alta.`);
  };

  // 🗺️ Construir y validar ruta con validación de nodos
  const handleCrearRuta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreRuta || !origen || !destino || !tiempo) {
      toast.error("Complete los parámetros estructurales de la ruta");
      return;
    }
    if (origen === destino) {
      toast.error("El origen y el destino no pueden ser la misma terminal");
      return;
    }

    const nuevaRuta: RutaEstructura = {
      id: Date.now(),
      nombre: nombreRuta,
      origenId: origen,
      destinoId: destino,
      intermediasIds: intermediasSeleccionadas,
      conductoresNecesarios: parseInt(conductores),
      tiempoEstimado: tiempo
    };

    setRutas([...rutas, nuevaRuta]);
    toast.success(`Ruta Maestra "${nombreRuta}" autorizada globalmente.`);
    
    // Limpiar formulario
    setNombreRuta(''); setOrigen(''); setDestino('');
    setIntermediasSeleccionadas([]); setTiempo('');
  };

  const toggleIntermedia = (id: string) => {
    if (intermediasSeleccionadas.includes(id)) {
      setIntermediasSeleccionadas(intermediasSeleccionadas.filter(i => i !== id));
    } else {
      setIntermediasSeleccionadas([...intermediasSeleccionadas, id]);
    }
  };

  // Helper para buscar los datos de la ciudad por ID
  const getAgenciaInfo = (id: string) => agencias.find(a => a.id === id);

  return (
    <div className="space-y-6">
      
      {/* ─── SECCIÓN A: MAESTRO DE CIUDADES Y AGENCIAS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <Card className="bg-white border-slate-200 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
              <Store className="w-4 h-4 text-red-600" /> Registrar Punto / Agencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCrearAgencia} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Nombre de la Ciudad / Terminal</Label>
                <Input placeholder="Ej: La Dorada - Caldas" value={nuevaCiudad} onChange={(e) => setNuevaCiudad(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Régimen Administrativo</Label>
                <select 
                  className="w-full h-9 px-3 border rounded-md text-xs bg-white text-slate-800"
                  value={nuevoTipo}
                  onChange={(e) => setNuevoTipo(e.target.value as 'PROPIA' | 'CONCESION')}
                >
                  <option value="PROPIA">Sede Propia (Inversión Directa)</option>
                  <option value="CONCESION">Concesión / Taquilla Aliada</option>
                </select>
              </div>
              <Button type="submit" size="sm" className="w-full bg-slate-900 text-white font-bold">
                Añadir a la Red
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* LISTADO DE AGENCIAS CARGADAS */}
        <Card className="bg-white border-slate-200 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800">Red de Cobertura Vigente</CardTitle>
          </CardHeader>
          <CardContent className="max-h-44 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
            {agencias.map((a) => (
              <div key={a.id} className="p-2 border rounded-lg bg-slate-50 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">{a.ciudad}</span>
                <Badge variant="outline" className={a.tipo === 'PROPIA' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
                  {a.tipo}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ─── SECCIÓN B: FORMULARIO MAESTRO DE RUTAS ─── */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Map className="w-5 h-5 text-red-600" /> Estructurador de Rutas Nacionales
          </CardTitle>
          <CardDescription>Establezca los nodos viales vinculando terminales de origen, destino e intermedias.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCrearRuta} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Nombre Técnico del Corredor</Label>
                <Input placeholder="Ej: Ruta del Sol II" value={nombreRuta} onChange={(e) => setNombreRuta(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Terminal de Origen</Label>
                <select className="w-full h-10 px-3 border rounded-md text-sm bg-white" value={origen} onChange={(e) => setOrigen(e.target.value)} required>
                  <option value="">-- Seleccione Origen --</option>
                  {agencias.map(a => <option key={a.id} value={a.id}>{a.ciudad} ({a.tipo})</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Terminal de Destino</Label>
                <select className="w-full h-10 px-3 border rounded-md text-sm bg-white" value={destino} onChange={(e) => setDestino(e.target.value)} required>
                  <option value="">-- Seleccione Destino --</option>
                  {agencias.map(a => <option key={a.id} value={a.id}>{a.ciudad} ({a.tipo})</option>)}
                </select>
              </div>
            </div>

            {/* SELECCIÓN DINÁMICA DE CIUDADES INTERMEDIAS */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Seleccione las Agencias Intermedias de Paso</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-xl bg-slate-50/50">
                {agencias.filter(a => a.id !== origen && a.id !== destino).map(a => {
                  const seleccionado = intermediasSeleccionadas.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleIntermedia(a.id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        seleccionado 
                          ? "bg-slate-900 text-white border-slate-950 shadow-sm" 
                          : "bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {a.ciudad} <span className="text-[9px] opacity-70">({a.tipo})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Tiempo Estimado del Recorrido</Label>
                <Input placeholder="Ej: 6h 40m" value={tiempo} onChange={(e) => setTiempo(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Pilotos Requeridos</Label>
                <select className="w-full h-10 px-3 border rounded-md text-sm bg-white" value={conductores} onChange={(e) => setConductores(e.target.value)}>
                  <option value="1">1 Operador (Línea Corta)</option>
                  <option value="2">2 Operadores (Relevo de Seguridad)</option>
                </select>
              </div>
              <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold h-10">
                Autorizar Trazado Comercial
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ─── SECCIÓN C: VISTA CONSOLIDADA DE TRAZADOS AUTORIZADOS ─── */}
      <Card className="bg-white border-slate-200">
        <CardContent className="pt-6 space-y-4">
          {rutas.map((ruta) => {
            const agOrigen = getAgenciaInfo(ruta.origenId);
            const agDestino = getAgenciaInfo(ruta.destinoId);

            return (
              <div key={ruta.id} className="p-4 border rounded-xl bg-slate-50/50 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                <div className="space-y-2 flex-1">
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">{ruta.nombre}</h4>
                    <span className="text-xs font-medium text-slate-400">Logística: {ruta.tiempoEstimado} • {ruta.conductoresNecesarios} Conductores</span>
                  </div>
                  
                  {/* Flujo Visual de Paradas Intermedias con su tipo discriminado */}
                  <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                    {agOrigen && (
                      <span className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded shadow-sm">
                        🏁 {agOrigen.ciudad} 
                      </span>
                    )}
                    
                    {ruta.intermediasIds.map(id => {
                      const ag = getAgenciaInfo(id);
                      if (!ag) return null;
                      return (
                        <div key={id} className="flex items-center gap-2">
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className={`px-2.5 py-1 border rounded font-medium flex items-center gap-1 ${
                            ag.tipo === 'PROPIA' ? 'bg-white text-slate-800' : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {ag.tipo === 'PROPIA' ? <Landmark className="w-3 h-3 text-blue-500" /> : <Store className="w-3 h-3 text-amber-500" />}
                            {ag.ciudad}
                          </span>
                        </div>
                      );
                    })}

                    {agDestino && (
                      <>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="px-2.5 py-1 bg-red-600 text-white font-bold rounded shadow-sm">
                          📍 {agDestino.ciudad}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

    </div>
  );
}