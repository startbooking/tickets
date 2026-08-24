import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { travelsoftService, OridesOption, HorarioOption, VehiculoOption, ConductorOption, VehiculoConductoresRespuesta, horaDurationAMinutos, formatHora } from '@/services/travelsoftService';
import {
  Bus, FileText, ShieldCheck, ClipboardCheck, LogOut,
  Clock, CheckCircle2, AlertTriangle, Gauge, User, MapPin, Menu, X, Plus, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

type DespachadorSection = 'programacion' | 'alistamiento' | 'manifiestos';

const menuItems = [
  { id: 'programacion' as const, label: 'Vehículos en Andén', icon: <Clock className="w-4 h-4" /> },
  { id: 'alistamiento' as const, label: 'Seguridad y Alcoholimetría', icon: <ShieldCheck className="w-4 h-4" /> },
  { id: 'manifiestos' as const, label: 'Historial de Despachos', icon: <FileText className="w-4 h-4" /> },
];

export default function DespachadorDashboard() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<DespachadorSection>('programacion');
  const [menuAbierto, setMenuAbierto] = useState(false);

  const [destinos, setDestinos] = useState<OridesOption[]>([]);
  const [horarios, setHorarios] = useState<HorarioOption[]>([]);
  const [vehiculos, setVehiculos] = useState<VehiculoOption[]>([]);
  const [conductoresVehiculo, setConductoresVehiculo] = useState<ConductorOption[]>([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(false);

  const nombreUsuario = user?.name || "Néstor Fabián Chaux";
  const correoUsuario = user?.email || "despacho.salitre@tickets.com";

  // Catálogos: destinos (orides, agencia_orides=1, desc != MANTENIN) y horarios
  useEffect(() => {
    const cargar = async () => {
      setCargandoCatalogos(true);
      try {
        const [d, h, v] = await Promise.all([
          travelsoftService.getDestinosFiltrados(),
          travelsoftService.getHorarios(),
          travelsoftService.getVehiculosDropdown(),
        ]);
        setDestinos(d);
        setVehiculos(v.filter((x) => (x.estado_vehi ?? '1') === '1'));
        setHorarios(
          h
            .filter((x) => x.hora_time !== null)
            .sort((a, b) => horaDurationAMinutos(a.hora_time) - horaDurationAMinutos(b.hora_time))
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'No se pudieron cargar los catálogos.');
      } finally {
        setCargandoCatalogos(false);
      }
    };
    void cargar();
  }, []);

  const getIniciales = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  };

  const toggleMenu = (close = false) => {
    setMenuAbierto(close === undefined ? !menuAbierto : close);
  };

  const SeleccionarSeccion = (id: DespachadorSection) => {
    setActiveSection(id);
    setMenuAbierto(false);
  };

  // Cerrar menú con Escape y bloquear scroll del body cuando está abierto (móvil)
  useEffect(() => {
    if (!menuAbierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAbierto(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuAbierto]);

  return (
    <div className="flex h-screen-dyn bg-slate-100 font-sans antialiased overflow-hidden text-slate-800">
      
      {/* ─── BARRA LATERAL IZQUIERDA (IDENTIDAD MORADA LOGÍSTICA) · desktop ≥768px ─── */}
      <aside className="hidden md:flex w-72 bg-slate-950 text-slate-200 flex-col justify-between border-r border-slate-900 shadow-xl z-20 shrink-0">
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
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => SeleccionarSeccion(item.id)}
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

      {/* ─── DRAWER MENÚ MÓVIL (hamburguesa, <768px) ─── */}
      {menuAbierto && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
            onClick={() => toggleMenu(false)}
            aria-hidden="true"
          />
          <aside
            className={cn(
              "fixed top-0 left-0 h-screen-dyn w-72 max-w-[80vw] bg-slate-950 text-slate-200 flex flex-col justify-between shadow-2xl z-50 md:hidden overflow-y-auto",
              "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left motion-safe:duration-300 motion-safe:ease-out"
            )}
          >
            <div>
              {/* Header del drawer con botón de cerrar */}
              <div className="p-5 flex items-center justify-between bg-slate-950 border-b border-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-md">
                    <Bus className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h1 className="font-black text-lg tracking-wide text-white">SACTel.Cloud</h1>
                    <span className="text-[10px] font-bold text-purple-400 tracking-widest uppercase block">CONTROL DE ANDÉN</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleMenu(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 touch-list min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Cerrar menú"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Perfil del Despachador */}
              <div className="p-5 flex items-center gap-3 bg-slate-950/40 border-b border-slate-900">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center font-bold text-sm text-slate-200 tracking-wider shrink-0">
                  {getIniciales(nombreUsuario)}
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-bold text-sm text-slate-100 truncate">{nombreUsuario}</h4>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{correoUsuario}</p>
                </div>
              </div>
              <div className="border-b border-slate-900 mb-2" />

              {/* Menú Operativo */}
              <nav className="p-3 space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => SeleccionarSeccion(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all touch-list min-h-[48px]",
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
        </>
      )}

      {/* ─── ÁREA DE CONTENIDO DINÁMICO (DERECHA) ─── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 md:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 md:px-8 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-400 font-bold tracking-wider uppercase">
            <button
              type="button"
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 touch-list min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => toggleMenu(true)}
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="truncate">Módulo Logístico / <span className="text-purple-600 font-black">{activeSection}</span></span>
          </div>
          <Badge className="bg-purple-50 text-purple-700 border border-purple-200 font-mono font-bold hidden sm:inline-flex">
            Pista 02 Activa
          </Badge>
        </header>

        <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 bg-slate-50/50">
          {(() => {
            switch (activeSection) {
              case 'programacion':
                return <SubViewProgramacion setSeccion={setActiveSection} destinos={destinos} horarios={horarios} vehiculos={vehiculos} cargandoCatalogos={cargandoCatalogos} />;
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
function SubViewProgramacion({
  setSeccion,
  destinos,
  horarios,
  vehiculos,
  cargandoCatalogos,
}: {
  setSeccion: React.Dispatch<React.SetStateAction<DespachadorSection>>;
  destinos: OridesOption[];
  horarios: HorarioOption[];
  vehiculos: VehiculoOption[];
  cargandoCatalogos: boolean;
}) {
  const [destinoSel, setDestinoSel] = useState<number | ''>('');
  const [idHorarioSel, setIdHorarioSel] = useState<string>('');
  const [placaSel, setPlacaSel] = useState<string>('');
  const [conductorSel, setConductorSel] = useState<string>('');
  const [conductoresVehiculo, setConductoresVehiculo] = useState<ConductorOption[]>([]);
  const [cargandoConductores, setCargandoConductores] = useState(false);
  const [viajesProgramados, setViajesProgramados] = useState<
    Array<{ id: number; cod_ruta: number; destino: string; hora: string; placa: string; conductor: string; ocupacion: string }>
  >([]);
  const [guardando, setGuardando] = useState(false);

  const horaAMinutos = horaDurationAMinutos;

  // Conductores asignados a la placa (tabla vehiculo_conductor)
  useEffect(() => {
    if (!placaSel) {
      setConductoresVehiculo([]);
      setConductorSel('');
      setCargandoConductores(false);
      return;
    }
    setConductorSel('');
    setCargandoConductores(true);
    travelsoftService
      .getConductoresVehiculo(placaSel)
      .then((data: VehiculoConductoresRespuesta) => {
        setConductoresVehiculo(
          data.conductores.map((x) => ({
            cedula_conduc: x.cedula_conduc,
            nombre_conduc: x.nombre_conduc ?? x.cedula_conduc,
            estado_conduc: x.estado_conduc ?? '1',
          }))
        );
        const titular = data.conductores.find((x) => Number(x.titular) === 1);
        setConductorSel(
          titular?.cedula_conduc ??
            data.conductores.find((x) => x.cedula_conduc === data.ultimo_conduc)
              ?.cedula_conduc ??
            ''
        );
      })
      .catch((err) => {
        setConductoresVehiculo([]);
        console.error('No se pudieron cargar los conductores del vehículo:', err);
      })
      .finally(() => setCargandoConductores(false));
  }, [placaSel]);

  const handleProgramar = async () => {
    if (!destinoSel || !idHorarioSel || !placaSel) {
      toast.error('Seleccione destino, hora y placa.');
      return;
    }
    const destino = destinos.find((d) => d.id_orides === Number(destinoSel));
    const horario = horarios.find((h) => String(h.id_horario) === idHorarioSel);
    const conductor = conductoresVehiculo.find((c) => c.cedula_conduc === conductorSel);
    const horaTime = horario?.hora_time ?? null;
    const horaRuta = horaTime ? horaAMinutos(horaTime) : 0;
    const horaProgramada = horaTime ? formatHora(horaAMinutos(horaTime)) : undefined;

    setGuardando(true);
    try {
      const res = await travelsoftService.crearRuta({
        destino_ruta: Number(destinoSel),
        hora_ruta: horaRuta,
        id_horario: horario?.id_horario ?? undefined,
        hora_programada: horaProgramada,
        placa_vehi: placaSel,
        cedula_conduc: conductorSel || undefined,
      });
      const cod_ruta = (res.cod_ruta as number) ?? (res.id_ruta as number) ?? 0;
      const nuevo = {
        id: viajesProgramados.length + 1,
        cod_ruta,
        destino: destino?.desc_orides ?? String(destinoSel),
        hora: horario?.hora_horario ?? horaProgramada ?? '',
        placa: placaSel,
        conductor: conductor?.nombre_conduc ?? conductorSel,
        ocupacion: '0 / 42 Pasajes',
      };
      setViajesProgramados([nuevo, ...viajesProgramados]);
      toast.success(`Salida programada a ${nuevo.destino} en ruta #${cod_ruta}.`);
      setDestinoSel('');
      setIdHorarioSel('');
      setPlacaSel('');
      setConductorSel('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo programar la salida.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Programación de Vehículos en Andén</h2>
          <p className="text-xs text-slate-500">Monitoree la ocupación de pasajeros y autorice el alistamiento técnico.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs font-bold gap-2"
          onClick={() => setSeccion('alistamiento')}
        >
          <ShieldCheck className="w-4 h-4" />
          Manual de Alistamiento
        </Button>
      </div>

      {/* Formulario: Programar nueva salida */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-900">
            <Plus className="w-4 h-4 text-blue-600" />
            Programar Nueva Salida
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cargandoCatalogos ? (
            <p className="text-sm text-slate-500">Cargando catálogos...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-600">Destino</Label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
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
                 <Label className="text-[11px] font-bold text-slate-600">Hora de salida</Label>
                 <select
                   className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 disabled:opacity-60"
                   value={idHorarioSel}
                   onChange={(e) => setIdHorarioSel(e.target.value)}
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
                <Label className="text-[11px] font-bold text-slate-600">Placa del Bus</Label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 disabled:opacity-60"
                  value={placaSel}
                  onChange={(e) => setPlacaSel(e.target.value)}
                  disabled={cargandoCatalogos || guardando}
                >
                  <option value="">Seleccione la placa</option>
                  {vehiculos.map((v) => (
                    <option key={v.placa_vehi} value={v.placa_vehi}>
                      {v.placa_vehi}{v.marca_vehi ? ` · ${v.marca_vehi}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-600">Conductor</Label>
                <select
                  className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 disabled:opacity-60 transition-colors ${cargandoConductores ? 'cursor-wait' : ''}`}
                  value={conductorSel}
                  onChange={(e) => setConductorSel(e.target.value)}
                  disabled={cargandoCatalogos || guardando || !placaSel || cargandoConductores}
                >
                  <option value="">
                    {cargandoConductores
                      ? 'Cargando conductores...'
                      : placaSel
                        ? 'Seleccione el conductor'
                        : 'Primero elija la placa'}
                  </option>
                  {!cargandoConductores && conductoresVehiculo.map((c) => (
                    <option key={c.cedula_conduc} value={c.cedula_conduc}>
                      {c.nombre_conduc} ({c.cedula_conduc})
                    </option>
                  ))}
                </select>
                {placaSel && !cargandoConductores && conductoresVehiculo.length === 0 && (
                  <p className="text-[10px] text-slate-400 italic">El vehículo no tiene conductores asignados.</p>
                )}
              </div>
            </div>
          )}
          <div className="mt-3">
               <Button
               onClick={handleProgramar}
               disabled={cargandoCatalogos || !destinoSel || !idHorarioSel || !placaSel || guardando}
               size="sm"
               className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2"
             >
               {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
               {guardando ? 'Programando...' : 'Agregar a Andén'}
             </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tarjetas de viajes programados (si los hay) */}
      {viajesProgramados.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1">
          {viajesProgramados.map((v) => (
            <Card key={v.id} className="bg-white border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase">Espera Alistamiento</span>
                    <h3 className="text-base font-black text-slate-900 mt-1 flex items-center gap-1">
                      <Bus className="w-4 h-4" /> {v.placa}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> Destino: {v.destino}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3" /> Conductor: {v.conductor}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold block text-slate-700">Salida: {v.hora}</span>
                    <span className="text-[10px] font-bold text-slate-400">{v.ocupacion}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}


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