import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { 
  Bus, FileText, ShieldCheck, ClipboardCheck, LogOut, 
  Clock, CheckCircle2, AlertTriangle, Gauge, User, MapPin
} from 'lucide-react';
import { toast } from 'sonner';

type DespachadorSection = 'programacion' | 'alistamiento' | 'manifiestos';

export default function DespachadorDashboard() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<DespachadorSection>('programacion');

  const nombreUsuario = user?.name || "Néstor Fabián Chaux";
  const correoUsuario = user?.email || "despacho.salitre@tickets.com";

  const getIniciales = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans antialiased overflow-hidden text-slate-800">
      
      {/* ─── BARRA LATERAL IZQUIERDA (IDENTIDAD MORADA LOGÍSTICA) ─── */}
      <aside className="w-72 bg-slate-950 text-slate-200 flex flex-col justify-between border-r border-slate-900 shadow-xl z-20 shrink-0">
        <div>
          {/* Encabezado Corporativo */}
          <div className="p-5 flex items-center gap-4 bg-slate-950">
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-md">
              <Bus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-wide text-white">SACTel.Cloud</h1>
              <span className="text-[11px] font-bold text-purple-400 tracking-widest uppercase block mt-0.5">
                CONTROL DE ANDÉN
              </span>
            </div>
          </div>

          <div className="border-b border-slate-900" />

          {/* Perfil del Despachador */}
          <div className="p-5 flex items-center gap-4 bg-slate-950/40">
            <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center font-bold text-sm text-slate-200 tracking-wider shrink-0">
              {getIniciales(nombreUsuario)}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-bold text-sm text-slate-100 truncate tracking-wide">{nombreUsuario}</h4>
              <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">{correoUsuario}</p>
            </div>
          </div>

          <div className="border-b border-slate-900 mb-2" />

          {/* Menú Operativo */}
          <nav className="p-4 space-y-1">
            {[
              { id: 'programacion', label: 'Vehículos en Andén', icon: <Clock className="w-4 h-4" /> },
              { id: 'alistamiento', label: 'Seguridad y Alcoholimetría', icon: <ShieldCheck className="w-4 h-4" /> },
              { id: 'manifiestos', label: 'Historial de Despachos', icon: <FileText className="w-4 h-4" /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as DespachadorSection)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all",
                  activeSection === item.id 
                    ? "bg-purple-600 text-white shadow-md shadow-purple-950/50" 
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 bg-slate-950/60 border-t border-slate-900">
          <Button 
            variant="ghost" 
            onClick={logout}
            className="w-full justify-start text-xs text-slate-400 hover:bg-red-950/30 hover:text-red-400 gap-2 h-10 font-bold"
          >
            <LogOut className="w-4 h-4" /> Finalizar Turno
          </Button>
        </div>
      </aside>

      {/* ─── ÁREA DE CONTENIDO DINÁMICO (DERECHA) ─── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10 shrink-0">
          <div className="text-xs text-slate-400 font-bold tracking-wider uppercase">
            Módulo Logístico / <span className="text-purple-600 font-black">{activeSection}</span>
          </div>
          <Badge className="bg-purple-50 text-purple-700 border border-purple-200 font-mono font-bold">
            Pista 02 Activa
          </Badge>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {(() => {
            switch (activeSection) {
              case 'programacion':
                return <SubViewProgramacion setSeccion={setActiveSection} />;
              case 'alistamiento':
                return <SubViewAlistamiento />;
              case 'manifiestos':
                return <SubViewManifiestos />;
            }
          })()}
        </div>
      </main>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 🚌 1. SUBVISTA: PROGRAMACIÓN / VEHÍCULOS EN ANDÉN
// ─────────────────────────────────────────────────────────────────────────────
function SubViewProgramacion({ setSeccion }: { setSeccion: React.Dispatch<React.SetStateAction<DespachadorSection>> }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Próximas Salidas Programadas</h2>
        <p className="text-xs text-slate-500">Monitoree la ocupación de pasajeros y autorice el alistamiento técnico.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tarjeta de Autobús en Espera */}
        <Card className="bg-white border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
          <CardContent className="p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase">Espera Alistamiento</span>
                <h3 className="text-base font-black text-slate-900 mt-1">Bus 405 — Premium Star</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> Destino: Medellín (Directo)</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold block text-slate-700">Salida: 19:30</span>
                <span className="text-[10px] font-bold text-slate-400">Ocupación: 32 / 40 Pasajes</span>
              </div>
            </div>

            <div className="border-t pt-3 flex gap-2">
              <Button onClick={() => setSeccion('alistamiento')} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex-1">
                Iniciar Revisión de Seguridad
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta de Autobús ya Despachado */}
        <Card className="bg-white border-slate-200 shadow-sm relative overflow-hidden opacity-75">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
          <CardContent className="p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase flex items-center gap-1 w-fit">
                  <CheckCircle2 className="w-3 h-3" /> Ruta en Tránsito
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">Bus 102 — Línea Confort</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> Destino: Bucaramanga</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold block text-slate-400">Salió: 16:15</span>
                <span className="text-[10px] font-bold text-slate-400">Manifiesto: #MN-9082</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔬 2. SUBVISTA: ALISTAMIENTO Y ALCOHOLIMETRÍA
// ─────────────────────────────────────────────────────────────────────────────
function SubViewAlistamiento() {
  const [gradoAlcohol, setGradoAlcohol] = useState('0.0');
  const [loading, setLoading] = useState(false);

  const handleDespacharBus = () => {
    if (parseFloat(gradoAlcohol) > 0.0) {
      toast.error("ALERTA CRÍTICA: Conductor no apto. Bloqueo de seguridad activado.", { duration: 5000 });
      return;
    }
    setLoading(true);
    toast.loading("Generando Manifiesto Único y firmando despacho digital...");
    setTimeout(() => {
      toast.dismiss();
      setLoading(false);
      toast.success("¡Vehículo Autorizado! Planilla de ruta enviada al correo del operador.");
    }, 1500);
  };

  return (
    <Card className="bg-white border-slate-200 shadow-sm max-w-2xl mx-auto animate-in fade-in duration-200">
      <CardHeader>
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
          <ClipboardCheck className="w-4 h-4 text-purple-600" /> Checklist de Alistamiento Legal (Vigía)
        </CardTitle>
        <CardDescription className="text-xs">Validación obligatoria pre-despacho según reglamentación vial.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Bloque Conductor */}
        <div className="p-4 border rounded-xl bg-slate-50 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center"><User className="w-4 h-4" /></div>
            <div>
              <p className="text-xs font-black text-slate-900">Operador: Jairo Alberto Ruiz</p>
              <p className="text-[10px] text-slate-400 font-mono">Licencia: C3 - Activa</p>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-black text-slate-500 uppercase">Resultado Alcoholímetro (mg/L)</Label>
            <Input type="number" step="0.1" value={gradoAlcohol} onChange={e => setGradoAlcohol(e.target.value)} className="h-9 font-mono font-bold text-xs" />
          </div>
        </div>

        {/* Checkbox Visuales Simulados */}
        <div className="space-y-2 border-t pt-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Inspección de Periferia</span>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
            <label className="flex items-center gap-2 p-2 border rounded-lg bg-white"><input type="checkbox" defaultChecked className="rounded text-purple-600" /> Presión de Llantas OK</label>
            <label className="flex items-center gap-2 p-2 border rounded-lg bg-white"><input type="checkbox" defaultChecked className="rounded text-purple-600" /> Luces & Frenos OK</label>
            <label className="flex items-center gap-2 p-2 border rounded-lg bg-white"><input type="checkbox" defaultChecked className="rounded text-purple-600" /> Botiquín & Extintor al día</label>
            <label className="flex items-center gap-2 p-2 border rounded-lg bg-white"><input type="checkbox" defaultChecked className="rounded text-purple-600" /> GPS SACTel En Línea</label>
          </div>
        </div>

        <Button onClick={handleDespacharBus} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black text-xs h-10 shadow mt-2">
          AUTORIZAR SALIDA DE VEHÍCULO
        </Button>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 📄 3. SUBVISTA: HISTORIAL DE MANIFIESTOS
// ─────────────────────────────────────────────────────────────────────────────
function SubViewManifiestos() {
  return (
    <Card className="bg-white border-slate-200 shadow-sm animate-in fade-in duration-200">
      <CardHeader>
        <CardTitle className="text-sm font-bold text-slate-900">Libro de Ruta Digital (Hoy)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-xl overflow-hidden text-xs font-mono">
          <div className="bg-slate-50 p-3 font-bold border-b grid grid-cols-4 text-slate-500">
            <span>Hora</span>
            <span>Placa / Interno</span>
            <span>Destino</span>
            <span>Estado</span>
          </div>
          <div className="p-3 grid grid-cols-4 border-b items-center bg-white text-slate-600">
            <span>15:40</span>
            <span className="font-bold text-slate-900">SST-901 (Interno 24)</span>
            <span>Ibague - Tolima</span>
            <span className="text-emerald-600 font-bold">DESPACHADO</span>
          </div>
          <div className="p-3 grid grid-cols-4 items-center bg-white text-slate-600">
            <span>14:10</span>
            <span className="font-bold text-slate-900">ZZK-004 (Interno 89)</span>
            <span>Girardot</span>
            <span className="text-emerald-600 font-bold">DESPACHADO</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}