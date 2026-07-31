import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Map, Plus, Users, Clock, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface RutaEstructura {
  id: number;
  nombre: string;
  ciudadesPaso: string[];
  conductoresNecesarios: number;
  tiempoEstimado: string;
}

export function SuperRoutesView() {
  const [rutas, setRutas] = useState<RutaEstructura[]>([
    { id: 1, nombre: "Troncal Andina Norte", ciudadesPaso: ["Bogotá", "Tunja", "Moniquirá", "Barbosa", "Bucaramanga"], conductoresNecesarios: 2, tiempoEstimado: "9h 30m" },
    { id: 2, nombre: "Ruta del Sol Línea Corta", ciudadesPaso: ["Medellín", "Puerto Berrío", "Barrancabermeja"], conductoresNecesarios: 1, tiempoEstimado: "5h 15m" }
  ]);

  // Estados del Formulario
  const [nombreRuta, setNombreRuta] = useState('');
  const [ciudadesInput, setCiudadesInput] = useState('');
  const [conductores, setConductores] = useState('1');
  const [tiempo, setTiempo] = useState('');

  const handleCrearRuta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreRuta || !ciudadesInput || !tiempo) {
      toast.error("Complete los datos de la estructura de ruta");
      return;
    }

    // Convertir string de ciudades separado por comas en un Array limpio
    const ciudadesArray = ciudadesInput.split(',').map(c => c.trim()).filter(Boolean);

    const nuevaRuta: RutaEstructura = {
      id: Date.now(),
      nombre: nombreRuta,
      ciudadesPaso: ciudadesArray,
      conductoresNecesarios: parseInt(conductores),
      tiempoEstimado: tiempo
    };

    setRutas([...rutas, nuevaRuta]);
    toast.success("Estructura de ruta autorizada cargada en el core del sistema.");
    
    // Reset Form
    setNombreRuta('');
    setCiudadesInput('');
    setConductores('1');
    setTiempo('');
  };

  return (
    <div className="space-y-6">
      
      {/* FORMULARIO DE CREACIÓN */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Map className="w-5 h-5 text-blue-600" /> Crear Nueva Ruta y Línea Geográfica</CardTitle>
          <CardDescription>Defina el trazado nacional, paradas comerciales intermedias y requerimientos logísticos de tripulación.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCrearRuta} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nombre de la Ruta / Corredor</Label>
                <Input placeholder="Ej: Bogotá - Medellín por Autopista" value={nombreRuta} onChange={(e) => setNombreRuta(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Tiempo Estimado del Trayecto</Label>
                <Input placeholder="Ej: 8h 45m" value={tiempo} onChange={(e) => setTiempo(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Secuencia de Ciudades (Separadas por Comas en orden de paso)</Label>
              <Input 
                placeholder="Ej: Bogotá, Villeta, Honda, La Dorada, Medellín" 
                value={ciudadesInput} 
                onChange={(e) => setCiudadesInput(e.target.value)}
                required
              />
              <p className="text-[11px] text-slate-400 font-medium">El sistema habilitará automáticamente la venta fraccionada de tiquetes entre estas ciudades.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Necesidad de Conductores en Cabina</Label>
                <select 
                  className="w-full h-10 px-3 border border-slate-200 bg-white rounded-md text-sm text-slate-800"
                  value={conductores}
                  onChange={(e) => setConductores(e.target.value)}
                >
                  <option value="1">1 Conductor (Trayectos menores a 5 horas)</option>
                  <option value="2">2 Conductores (Relevo obligatorio - Alta montaña / Nocturno)</option>
                  <option value="3">3 Conductores (Rutas Extremas transfronterizas)</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2">
                  <Plus className="w-4 h-4" /> Registrar Ruta Maestra
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* REPOSITORIO DE RUTAS REGISTRADAS */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-800">Líneas y Corredores Autorizados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rutas.map((ruta) => (
            <div key={ruta.id} className="p-4 border rounded-xl bg-slate-50/50 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{ruta.nombre}</h3>
                  <div className="flex gap-4 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {ruta.tiempoEstimado}</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Mínimo {ruta.conductoresNecesarios} Pilotos</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></Button>
              </div>

              {/* Trazado de ciudades */}
              <div className="bg-white border p-3 rounded-lg flex items-center flex-wrap gap-2 text-xs font-medium text-slate-700">
                {ruta.ciudadesPaso.map((ciudad, cIdx) => (
                  <div key={cIdx} className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-slate-100 border rounded text-slate-800">{ciudad}</span>
                    {cIdx < ruta.ciudadesPaso.length - 1 && <ArrowRight className="w-3 h-3 text-slate-400" />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

    </div>
  );
}