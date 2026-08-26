import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { travelsoftService, formatHora, horaSalidaVehiculo, horaDurationAMinutos, DashboardCajeroData, VehiculoEstado, ProgramacionVehiculosData, EnTransitoItem, OridesOption, ConductorOption, VehiculoOption,   SillasData, TicketVenta, FormaPago, EstadoImpresora, EstadoSitio, ESTADO_SITIO_LABEL, RutaTipoOption, VentaCajero, HorarioOption, VehiculoConductoresRespuesta, ConduceOption, RecorridoOption,   VehiculoSACTel, ConductorSACTel } from '@/services/travelsoftService';
import { useTicketFiscal } from '@/hooks/useTicketFiscal';
import { EMPRESA_NIT, EMPRESA_NOMBRE } from '@/services/ticketFiscalService';
import { buildWhatsAppCard } from '@/utils/whatsappShare';
import { type PasajeroLibro } from '@/utils/libroDeViajePdf';

import { hoyISO, FORMA_PAGO_LABEL } from '@/stores/turnoSateliteStore';
import { fechaHoyColombia, horaColombiaCorta } from '@/utils/tiempo';
import { isAndroidDevice, soportaBluetoothEscPos, generarInformeDespachoTXT } from '@/utils/ticketFormatter';
import { esDispositivoSunmi, IMPRESORA_INTEGRADA_LABEL } from '@/services/sunmiPrinter';
import { useImpresoraLocal } from '@/hooks/useImpresoraLocal';
import { imprimirLocal } from '@/services/impresoraLocal';
import { obtenerLogoEscPos } from '@/utils/escPosImage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from '@/lib/utils';
import {
  Tooltip, TooltipTrigger, TooltipContent,
} from '@/components/ui/tooltip';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Ticket, CalendarDays, BarChart3, LogOut, 
  Coins, ArrowUpRight, Building2, BookmarkCheck,
  TrendingUp, Bus, Loader2, AlertTriangle, RefreshCcw,
  Send, MapPin, Plus, Banknote, CreditCard, QrCode,
  User, Phone, Mail, Armchair, CheckCircle2, Clock,
   Menu, X, Printer, Eye, FileDown,
} from 'lucide-react';
import { toast } from 'sonner';

type CajeroSection = 'inicio' | 'ventas' | 'reservas' | 'informes' | 'cierre' | 'despacho' | 'llegadas';

export default function CajeroDashboard() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<CajeroSection>('inicio');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const impresora = useImpresoraLocal();
  const etiquetaImpresora = (e: typeof impresora.estado): string => {
    switch (e) {
      case 'pda': return 'Servicio local (PDA/PC)';
      case 'sunmi': return 'Integrada Sunmi';
      case 'usb': return 'Impresora USB local';
      case 'ble': return 'Bluetooth';
      case 'rawbt': return 'Bluetooth (RawBT)';
      case 'print': return 'Navegador (impresora del equipo)';
      case 'error': return 'Sin impresora';
      default: return 'Detectando…';
    }
  };

  // ─── ESTADOS DE CAJA Y TIQUETERÍA ───
  const [totalCajaTurno, setTotalCajaTurno] = useState<number>(145000);

  // ─── ESTADO DE VEHÍCULOS DEL DÍA (via travelsoft.backend.lan) ───
  const [dashboard, setDashboard] = useState<DashboardCajeroData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Vehículo seleccionado en Despacho para saltar a la Taquilla a vender ticket
  const [ventaInicial, setVentaInicial] = useState<VehiculoEstado | null>(null);

  const cargarDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      const data = await travelsoftService.getDashboardCajero();
      setDashboard(data);
    } catch (err) {
      setDashboard(null);
      console.error('Error al cargar estadísticas de vehículos:', err);
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  useEffect(() => {
    void cargarDashboard();
  }, [cargarDashboard]);

  const nombreUsuario = user?.nombreCompleto || user?.name || "Carlos Eduardo Mendoza";
  const correoUsuario = user?.email || "cajero.salitre@tickets.com";
  const nombreAgencia = String(user?.agencia ?? "") || dashboard?.agencia || "Agencia";
  const nivelUsuario = Number(user?.nivel_usuario ?? user?.nivel) || 2;

  // Roles finos Bogotá: 4=Rodamiento (solo Programación), 5=Taquilla (solo Ventas),
  // 6=Rodamiento+Taquilla (todo). Nivel 2 (CAJERO general) y default ven todo.
  const esTaquilla = nivelUsuario === 5;       // venta de tiquetes, sin despacho
  const esRodamiento = nivelUsuario === 4;      // programación, sin taquilla
  const puedeDespacho = dashboard?.tipo_agencia === 'principal' && !esTaquilla;

  const getIniciales = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  };

  // Items de navegación (reutilizables en sidebar desktop y drawer móvil)
  const navItems: { id: CajeroSection; label: string; icon: React.ReactNode }[] = useMemo(() => [
    { id: 'inicio', label: 'Inicio / Resumen Diario', icon: <BarChart3 className="w-5 h-5" /> },
    ...(puedeDespacho
      ? [
          { id: 'despacho' as CajeroSection, label: 'Programación de Vehículos', icon: <Send className="w-5 h-5" /> },
          { id: 'llegadas' as CajeroSection, label: 'Llegadas a la Agencia', icon: <MapPin className="w-5 h-5" /> },
        ]
      : []),
    ...(!esRodamiento
      ? [
          { id: 'ventas' as CajeroSection, label: 'Taquilla de Ventas', icon: <Ticket className="w-5 h-5" /> },
          { id: 'reservas' as CajeroSection, label: 'Control de Reservas', icon: <CalendarDays className="w-5 h-5" /> },
          { id: 'cierre' as CajeroSection, label: 'Cierre de Cajero', icon: <Coins className="w-5 h-5" /> },
        ]
      : []),
    { id: 'informes', label: 'Informes y Métricas', icon: <ArrowUpRight className="w-5 h-5" /> },
  ], [puedeDespacho, esRodamiento]);

  const toggleMenu = (close = false) => {
    setMenuAbierto(close === undefined ? !menuAbierto : close);
  };

  const SeleccionarSeccion = (id: CajeroSection) => {
    setActiveSection(id);
    setMenuAbierto(false);
  };

  // Cerrar menú con Escape y bloquear scroll del body cuando está abierto (PDA)
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
      
      {/* ─── BARRA LATERAL IZQUIERDA (desktop ≥640px) ─── */}
      <aside className="hidden sm:block w-72 bg-slate-950 text-slate-200 flex flex-col justify-between border-r border-slate-900 shadow-xl z-20 shrink-0">
        <div>
          {/* Encabezado Corporativo */}
          <div className="p-5 flex items-center gap-4 bg-slate-950">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-md">
              <Building2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-wide text-white">SACTel</h1>
              <span className="text-[11px] font-bold text-emerald-400 tracking-widest uppercase block mt-0.5">
                TAQUILLA OPERATIVA
              </span>
            </div>
          </div>

          <div className="border-b border-slate-900" />

          {/* Perfil del Cajero */}
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

          {/* Menú de Navegación */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all",
                  "min-h-[44px]",
                  activeSection === item.id 
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/50" 
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Botón de Salida */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-900">
          <Button 
            className="w-full justify-start text-xs text-slate-400 hover:bg-red-950/30 hover:text-red-400 gap-2 h-12 font-bold touch-list" 
            onClick={logout} 
            variant="ghost"
          >
            <LogOut className="w-4 h-4" /> Salir del Turno
          </Button>
        </div>
      </aside>

      {/* ─── OVERLAY MENÚ MÓVIL (PDA: drawer con backdrop) ─── */}
      {menuAbierto && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 sm:hidden motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
            onClick={() => toggleMenu(false)}
            aria-hidden="true"
          />
          <aside
            className={cn(
              "fixed top-0 left-0 h-screen-dyn w-72 max-w-[80vw] bg-slate-950 text-slate-200 flex flex-col justify-between shadow-2xl z-50 sm:hidden overflow-y-auto",
              "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left motion-safe:duration-300 motion-safe:ease-out"
            )}
          >
            <div>
              {/* Header del drawer con botón de cerrar */}
              <div className="p-4 flex items-center justify-between bg-slate-950 border-b border-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shrink-0">
                    <Building2 className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h1 className="font-black text-lg tracking-wide text-white">SACTel</h1>
                    <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase block">TAQUILLA</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleMenu(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 touch-list min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Cerrar menú"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Perfil del Cajero */}
              <div className="p-4 flex items-center gap-3 bg-slate-950/40 border-b border-slate-900">
                <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center font-bold text-slate-200 tracking-wider shrink-0">
                  {getIniciales(nombreUsuario)}
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-bold text-sm text-slate-100 truncate">{nombreUsuario}</h4>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{correoUsuario}</p>
                </div>
              </div>

              {/* Menú de Navegación */}
              <nav className="p-3 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => SeleccionarSeccion(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all touch-list",
                      "min-h-[48px]",
                      activeSection === item.id 
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/50" 
                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Botón de Salida del drawer móvil */}
            <div className="p-4 bg-slate-950/60 border-t border-slate-900">
              <Button 
                className="w-full justify-center text-xs text-slate-400 hover:bg-red-950/30 hover:text-red-400 gap-2 h-12 font-bold touch-list" 
                onClick={logout} 
                variant="ghost"
              >
                <LogOut className="w-5 h-5" /> Salir del Turno
              </Button>
            </div>
          </aside>
        </>
      )}

      {/* ─── ÁREA DE CONTENIDO DINÁMICO ─── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Cabecera Superior */}
        <header className="h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-8 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-2">
            {/* Botón hamburguesa solo en PDA (oculto en desktop) */}
            <button
              className="sm:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 touch-list min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => toggleMenu(true)}
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold tracking-wider uppercase">
              Terminal {nombreAgencia} / <span className="text-emerald-600 font-black">{activeSection}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 border-l pl-4">
            {/* Estado de impresion local (autodeteccion) */}
            <div className="flex items-center gap-1.5">
              <span
                className={`h-10 px-2 inline-flex items-center gap-1 text-[9px] font-bold rounded-md border ${
                  impresora.detectando
                    ? 'text-slate-500 border-slate-200 bg-slate-50'
                    : impresora.disponible
                      ? 'text-emerald-700 border-emerald-200 bg-emerald-50'
                      : 'text-amber-700 border-amber-200 bg-amber-50'
                }`}
                title={
                  impresora.disponible
                    ? `Impresora local detectada: ${etiquetaImpresora(impresora.estado)}`
                    : 'No se detecto impresora local. Verifique el servicio de impresion o el Bluetooth del equipo.'
                }
              >
                <span className={`w-2 h-2 rounded-full ${impresora.disponible ? 'bg-emerald-500' : 'bg-amber-500'} ${impresora.detectando ? 'animate-pulse' : ''}`} />
                {impresora.detectando
                  ? 'Impresion…'
                  : impresora.disponible
                    ? etiquetaImpresora(impresora.estado)
                    : 'Sin impresora local'}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-10 px-2 gap-1 text-[9px] font-bold text-slate-600 border-slate-300 hover:bg-slate-100 touch-list"
                onClick={() => void impresora.test()}
                disabled={impresora.testeando}
                title="Probar la impresora local detectada"
              >
                {impresora.testeando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                Test Impresora
              </Button>
            </div>

            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-600">
              Caja: ${totalCajaTurno.toLocaleString('es-CO')}
            </span>
          </div>
        </header>

        {/* Inyección de Subvistas */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-8 bg-slate-50/50 touch-list">
          {(() => {
            switch (activeSection) {
              case 'inicio':
                return <SubViewInicio setSeccion={setActiveSection} total={totalCajaTurno} dashboard={dashboard} loading={loadingDashboard} onRetry={cargarDashboard} esRodamiento={esRodamiento} />;
              case 'despacho':
                return <SubViewDespacho />;
              case 'llegadas':
                return <SubViewLlegadas />;
              case 'ventas':
                return <SubViewVentas setTotalCaja={setTotalCajaTurno} ventaInicial={ventaInicial} onVentaInicialConsumida={() => setVentaInicial(null)} />;
              case 'reservas':
                return <SubViewReservas />;
              case 'informes':
                return <SubViewInformes />;
              case 'cierre':
                return <SubViewCierre total={totalCajaTurno} />;
              default:
                return <SubViewInicio setSeccion={setActiveSection} total={totalCajaTurno} dashboard={dashboard} loading={loadingDashboard} onRetry={cargarDashboard} esRodamiento={esRodamiento} />;
            }
          })()}
        </div>
      </main>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 📊 1. SUBVISTA: INICIO / RESUMEN
// ─────────────────────────────────────────────────────────────────────────────
function SubViewInicio({
  total, setSeccion, dashboard, loading, onRetry, esRodamiento,
}: {
  total: number;
  setSeccion: (s: CajeroSection) => void;
  dashboard: DashboardCajeroData | null;
  loading: boolean;
  onRetry: () => void;
  esRodamiento: boolean;
}) {
  const resumen = dashboard?.resumen;
  const vehiculos = dashboard?.vehiculos;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Resumen General del Día </h2>
        <p className="text-xs text-slate-500">
          {dashboard
            ? `Operación de vehículos al ${new Date(dashboard.fecha + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`
            : "Métricas acumuladas de tiquetería expedida durante el turno vigente."}
        </p>
      </div>

      {/* Carga */}
      {loading && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6 sm:p-8 flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
            <span className="text-xs font-bold tracking-wide">Consultando estado de vehículos...</span>
          </CardContent>
        </Card>
      )}

      {/* Error de conexión */}
      {!loading && !dashboard && (
        <Card className="bg-white border-rose-200 shadow-sm">
          <CardContent className="p-6 sm:p-8 flex flex-col items-center gap-3 text-center">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
            <div>
              <h3 className="text-sm font-black text-slate-900">No se pudo consultar el backend</h3>
              <p className="text-xs text-slate-500 mt-1">Verifica que el servicio travelsoft esté disponible e inténtalo de nuevo.</p>
            </div>
            <Button size="sm" variant="outline" className="text-xs font-bold gap-2 h-11 touch-list" onClick={onRetry}>
              <RefreshCcw className="w-3.5 h-3.5" /> Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Agencia satélite: solo venta, no reporta vehículos */}
      {!loading && dashboard?.tipo_agencia === 'satelite' && (
        <Card className="bg-gradient-to-br from-slate-950 to-slate-900 text-white p-6 border-none rounded-2xl shadow-lg">
          <CardContent className="p-0">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-800 text-amber-400 rounded-xl shrink-0"><Building2 className="w-6 h-6" /></div>
              <div>
                <h3 className="font-bold text-sm mb-1">Agencia satélite — solo venta de tiquetes</h3>
                <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                  Esta es una agencia intermedia dentro de las rutas de transporte. Genera tiquetes desde esta
                  agencia (o la anterior) hasta el destino final, pero <strong className="text-slate-200">no reporta
                  salida ni llegada de vehículos</strong>. La operación de despacho se registra en la agencia principal.
                </p>
                <Button onClick={() => setSeccion('ventas')} size="sm" className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                  Ir a Taquilla de Ventas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agencia principal: estadísticas reales de vehículos */}
      {!loading && dashboard?.tipo_agencia === 'principal' && resumen && vehiculos && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => setSeccion('despacho')}
              className="text-left group bg-white border border-slate-200 shadow-sm rounded-xl hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer"
            >
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Programados</span>
                  <h3 className="text-xl font-black text-slate-900">{resumen.programados}</h3>
                  <span className="text-[10px] font-bold text-emerald-600 group-hover:underline">Ver programación →</span>
                </div>
                <div className="p-3 bg-slate-50 text-slate-500 rounded-xl"><Clock className="w-5 h-5" /></div>
              </CardContent>
            </button>
            <button
              type="button"
              onClick={() => setSeccion('despacho')}
              className="text-left group bg-white border border-slate-200 shadow-sm rounded-xl hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer"
            >
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Por Despachar</span>
                  <h3 className="text-xl font-black text-slate-900">{resumen.en_plataforma}</h3>
                  <span className="text-[10px] font-bold text-emerald-600 group-hover:underline">Ver programación →</span>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Bus className="w-5 h-5" /></div>
              </CardContent>
            </button>
            <button
              type="button"
              onClick={() => setSeccion('despacho')}
              className="text-left group bg-white border border-slate-200 shadow-sm rounded-xl hover:shadow-md hover:border-amber-300 transition-all cursor-pointer"
            >
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Próximos a Salir</span>
                  <h3 className="text-xl font-black text-slate-900">{resumen.proximos}</h3>
                  <span className="text-[10px] font-bold text-amber-600 group-hover:underline">Ver programación →</span>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
              </CardContent>
            </button>
            <button
              type="button"
              onClick={() => setSeccion('despacho')}
              className="text-left group bg-slate-900 text-white border-none shadow-md rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
            >
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Despachados (Salió)</span>
                  <h3 className="text-xl font-black text-emerald-400">{resumen.despachados}</h3>
                  <span className="text-[10px] font-bold text-emerald-400 group-hover:underline">Ver programación →</span>
                </div>
                <div className="p-3 bg-slate-800 text-emerald-400 rounded-xl"><ArrowUpRight className="w-5 h-5" /></div>
              </CardContent>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ListaVehiculos
              titulo="Por Despachar"
              descripcion="Vendiendo Tiquetes (habilitadas)"
              items={vehiculos.en_plataforma}
              vacio="Sin vehículos en plataforma."
              badgeClass="bg-emerald-100 text-emerald-800 border-emerald-200"
              mostrarTickets
            />
            <ListaVehiculos
              titulo="Próximos a Salir"
              descripcion="En agencia, sin enturnar/despachar"
              items={vehiculos.proximos}
              vacio="Sin vehículos programados."
              badgeClass="bg-amber-100 text-amber-800 border-amber-200"
            />
            <ListaVehiculos
              titulo="Despachados"
              descripcion="Ya salieron de la agencia"
              items={vehiculos.despachados}
              vacio="Ningún vehículo ha salido."
              badgeClass="bg-slate-100 text-slate-700 border-slate-200"
            />
          </div>
        </>
      )}

      {!esRodamiento && (
        <Card className="bg-gradient-to-br from-slate-950 to-slate-900 text-white p-6 border-none rounded-2xl shadow-lg">
          <h3 className="font-bold text-sm mb-1">¿Listo para atender un cliente?</h3>
          <p className="text-xs text-slate-400 max-w-lg mb-4">Despache pasajes de forma inmediata vinculando croquis de sillas y facturación XML directa ante la DIAN.</p>
          <Button onClick={() => setSeccion('ventas')} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
            Ir a Taquilla de Ventas
          </Button>
        </Card>
      )}
    </div>
  );
}

// Lista compacta de vehículos por grupo de estado
function ListaVehiculos({
  titulo, descripcion, items, vacio, badgeClass, mostrarTickets,
}: {
  titulo: string;
  descripcion: string;
  items: VehiculoEstado[];
  vacio: string;
  badgeClass: string;
  mostrarTickets?: boolean;
}) {
  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xs font-bold uppercase flex items-center justify-between text-slate-900">
          {titulo}
          <Badge className={cn("text-[10px] font-bold border", badgeClass)}>{items.length}</Badge>
        </CardTitle>
        <CardDescription className="text-[11px]">{descripcion}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-3">{vacio}</p>
        ) : (
          <ul className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
            {items.map((v) => (
              <li key={v.cod_ruta} className="py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 font-mono truncate">
                    {v.orden_vehi || v.placa_vehi || "SIN ORDEN"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {v.destino || "—"}
                    {v.conductor ? ` · ${v.conductor}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-bold text-slate-600 font-mono">
                    {horaSalidaVehiculo(v)}
                  </span>
                  {mostrarTickets && (
                    <span className="flex items-center justify-end gap-1 text-[10px] font-bold text-emerald-700 mt-0.5">
                      <Ticket className="w-3 h-3" /> {v.tickets_vendidos ?? 0} vendidos
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 🚌 1b. SUBVISTA: DESPACHO DE VEHÍCULOS (solo agencia principal)
// ─────────────────────────────────────────────────────────────────────────────
function SubViewDespacho() {
  const [programacion, setProgramacion] = useState<ProgramacionVehiculosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogoNuevaRuta, setDialogoNuevaRuta] = useState(false);
  const [tabVehiculos, setTabVehiculos] = useState<'plataforma' | 'despachados'>('plataforma');

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      setProgramacion(await travelsoftService.getProgramacionVehiculos());
    } catch (err) {
      setProgramacion(null);
      console.error('Error al cargar la programación de vehículos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const [vehiculoConsulta, setVehiculoConsulta] = useState<VehiculoEstado | null>(null);
  const [vehiculoDetalle, setVehiculoDetalle] = useState<VehiculoSACTel | null>(null);
  const [cargandoVehiculo, setCargandoVehiculo] = useState(false);

  useEffect(() => {
    setVehiculoDetalle(null);
    if (!vehiculoConsulta?.placa_vehi) return;
    let activo = true;
    setCargandoVehiculo(true);
    travelsoftService
      .getVehiculo(vehiculoConsulta.placa_vehi)
      .then((d) => { if (activo) setVehiculoDetalle(d); })
      .catch(() => { if (activo) setVehiculoDetalle(null); })
      .finally(() => { if (activo) setCargandoVehiculo(false); });
    return () => { activo = false; };
  }, [vehiculoConsulta]);

  const despachables = useMemo(() => {
    const v = programacion?.vehiculos;
    if (!v) return [];
    return [...v.programados].sort(
      (a, b) => (a.hora_ruta ?? 0) - (b.hora_ruta ?? 0)
    );
  }, [programacion]);

  const despachadosTab = useMemo(() => {
    const v = programacion?.vehiculos;
    if (!v) return [];
    return [...v.despachados].sort(
      (a, b) => (a.hora_ruta ?? 0) - (b.hora_ruta ?? 0)
    );
  }, [programacion]);

  const todos = useMemo(() => {
    const v = programacion?.vehiculos;
    if (!v) return [];
    const base = tabVehiculos === 'plataforma' ? v.programados : v.despachados;
    return [...base].sort(
      (a, b) => (a.hora_ruta ?? 0) - (b.hora_ruta ?? 0)
    );
  }, [programacion, tabVehiculos]);

  const placasConRutaHoy = useMemo(() => {
    const v = programacion?.vehiculos;
    const placas = new Set<string>();
    if (!v) return placas;
    [...v.programados, ...v.despachados].forEach((x) => {
      if (x.placa_vehi) placas.add(x.placa_vehi);
    });
    return placas;
  }, [programacion]);

  if (loading) {
    return (
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-6 sm:p-8 flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
          <span className="text-xs font-bold tracking-wide">Cargando programación del día...</span>
        </CardContent>
      </Card>
    );
  }

  if (!programacion) {
    return (
      <Card className="bg-white border-rose-200 shadow-sm">
        <CardContent className="p-6 sm:p-8 flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
          <div>
            <h3 className="text-sm font-black text-slate-900">No se pudieron cargar los vehículos</h3>
            <p className="text-xs text-slate-500 mt-1">Verifica el backend e inténtalo de nuevo.</p>
          </div>
          <Button size="sm" variant="outline" className="text-xs font-bold gap-2 h-11 touch-list" onClick={() => void cargar()}>
            <RefreshCcw className="w-3.5 h-3.5" /> Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Programación de Vehículos</h2>
          <p className="text-xs text-slate-500">
            Los vehículos habilitados en plataforma pueden vender tiquetes; al despachar quedan en tránsito.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px] font-bold">
            {despachables.length} en plataforma
          </Badge>
          <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] gap-1.5" onClick={() => setDialogoNuevaRuta(true)}>
            <Plus className="w-3.5 h-3.5" /> Adicionar Ruta
          </Button>
        </div>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="p-4 pb-2 space-y-3">
          <CardTitle className="text-xs font-bold uppercase text-emerald-600">Vehículos y Rutas del Día</CardTitle>
          <CardDescription className="text-[11px]">
            Vehículos habilitados de la agencia. Los de plataforma venden tiquetes; los en tránsito ya salieron.
          </CardDescription>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant={tabVehiculos === 'plataforma' ? 'default' : 'outline'}
              className={cn(
                "text-[11px] font-bold gap-1.5 h-9",
                tabVehiculos === 'plataforma'
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              )}
              onClick={() => setTabVehiculos('plataforma')}
            >
              <Bus className="w-3.5 h-3.5" /> Por Despachar
              <Badge className={cn("ml-1", tabVehiculos === 'plataforma' ? "bg-white/20 text-white border-white/30" : "bg-emerald-100 text-emerald-800 border-emerald-200")}> {despachables.length}</Badge>
            </Button>
            <Button
              size="sm"
              variant={tabVehiculos === 'despachados' ? 'default' : 'outline'}
              className={cn(
                "text-[11px] font-bold gap-1.5 h-9",
                tabVehiculos === 'despachados'
                  ? "bg-sky-600 hover:bg-sky-700 text-white"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              )}
              onClick={() => setTabVehiculos('despachados')}
            >
              <Send className="w-3.5 h-3.5" /> Despachados
              <Badge className={cn("ml-1", tabVehiculos === 'despachados' ? "bg-white/20 text-white border-white/30" : "bg-sky-100 text-sky-800 border-sky-200")}> {despachadosTab.length}</Badge>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {todos.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">
              {tabVehiculos === 'plataforma'
                ? 'No hay vehículos en plataforma hoy. Use "Adicionar Ruta" para crear uno.'
                : 'No hay vehículos despachados hoy.'}
            </p>
          ) : (
            <div className="overflow-x-auto max-h-[calc(100vh-20rem)] overflow-y-auto">
              <table className="w-full text-left border-collapse min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400">
                    <th className="px-3 py-2 font-bold">Nº Orden</th>
                    <th className="px-3 py-2 font-bold">Hora Despacho</th>
                    <th className="px-3 py-2 font-bold">Recorrido</th>
                    <th className="px-3 py-2 font-bold">Hora Salida</th>
                    <th className="px-3 py-2 font-bold">Estado</th>
                    <th className="px-3 py-2 font-bold text-right">Consulta</th>
                  </tr>
                </thead>
                <tbody>
                  {todos.map((v) => {
                    const habilitada = v.habilitada_ruta === '1';
                    const despachado = v.despachada_ruta === '1';
                    const enPlataforma = habilitada && !despachado;
                    const enTransito = habilitada && despachado;
                    const anulada = v.anulada === '1';
                    const estadoLabel = anulada ? "Anulada" : enTransito ? "En Tránsito" : enPlataforma ? "Por Despachar" : "No Habilitado";
                    const badgeClass = anulada
                      ? "bg-rose-100 text-rose-800 border-rose-200"
                      : enTransito
                        ? "bg-sky-100 text-sky-800 border-sky-200"
                        : enPlataforma
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200";
                    return (
                      <tr
                        key={`${v.cod_ruta}-${(v as { cod_adicional?: number }).cod_adicional ?? ''}`}
                        className="border-b border-slate-100 hover:bg-slate-50/70"
                      >
                        <td className="px-3 py-2.5">
                          <p className="text-xs font-black text-slate-900 font-mono truncate">{v.orden_vehi || v.placa_vehi || "SIN ORDEN"}</p>
                        </td>
                        <td className="px-3 py-2.5 text-[11px] font-bold text-slate-700 font-mono whitespace-nowrap">
                            {horaSalidaVehiculo(v)}
                          </td>
                        <td className="px-3 py-2.5 min-w-[240px]">
                          <p className="text-[11px] text-slate-600 truncate">
                            {v.origen || "—"} <span className="text-slate-400">→</span> {v.destino || "—"}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {v.recorrido || ""}
                          </p>
                          {v.conductor && (
                            <p className="text-[10px] text-slate-500 truncate">
                              <User className="w-3 h-3 inline mr-1 text-slate-400" />{v.conductor}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-[11px] font-bold text-slate-700 font-mono whitespace-nowrap">
                            {formatHora(v.hora_ruta)}
                          </td>
                        <td className="px-3 py-2.5">
                          <Badge className={cn("text-[10px] font-bold border whitespace-nowrap", badgeClass)}>
                            {estadoLabel}
                          </Badge>
                          {!anulada && (
                            <span className="block mt-1 text-[10px] font-bold text-emerald-700">
                              <Ticket className="w-3 h-3 inline mr-0.5 -mt-0.5" /> {v.tickets_vendidos ?? 0} vendidos
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7 border-slate-300 text-slate-700 hover:bg-slate-100 font-bold"
                                onClick={() => setVehiculoConsulta(v)}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Consulta del Vehículo</TooltipContent>
                          </Tooltip>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {dialogoNuevaRuta && (
        <NuevaRutaDialog
          open={dialogoNuevaRuta}
          onOpenChange={setDialogoNuevaRuta}
          idOrigen={programacion.id_orides}
          nombreOrigen={programacion.agencia ?? 'Agencia'}
          placasConRutaHoy={placasConRutaHoy}
          onCreada={() => void cargar()}
        />
      )}

      {vehiculoConsulta && (
        <Dialog open onOpenChange={(open) => { if (!open) setVehiculoConsulta(null); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900">
                <Bus className="w-4 h-4 text-emerald-600" /> Consulta del Vehículo
              </DialogTitle>
              <DialogDescription>
                Detalle del vehículo y de la ruta programada para hoy.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vehículo</p>
                {cargandoVehiculo ? (
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 py-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Consultando vehículo...
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-black text-slate-900 font-mono">
                      {vehiculoDetalle?.placa_vehi || vehiculoConsulta.placa_vehi || "SIN PLACA"}
                    </p>
                    {vehiculoDetalle?.orden_vehi && (
                      <p className="text-[11px] text-slate-600">Nº Orden: <strong>{vehiculoDetalle.orden_vehi}</strong></p>
                    )}
                    {vehiculoDetalle?.marca_vehi && (
                      <p className="text-[11px] text-slate-600">Marca: <strong>{vehiculoDetalle.marca_vehi}</strong></p>
                    )}
                    {vehiculoDetalle?.tipo_vehi && (
                      <p className="text-[11px] text-slate-600">Tipo: <strong>{vehiculoDetalle.tipo_vehi}</strong></p>
                    )}
                    {vehiculoDetalle?.modelo_vehi != null && (
                      <p className="text-[11px] text-slate-600">Modelo: <strong>{vehiculoDetalle.modelo_vehi}</strong></p>
                    )}
                    {vehiculoDetalle?.pasajeros_vehi != null && (
                      <p className="text-[11px] text-slate-600">Cupo: <strong>{vehiculoDetalle.pasajeros_vehi} pasajeros</strong></p>
                    )}
                  </>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ruta</p>
                <p className="text-[11px] text-slate-700">
                  {vehiculoConsulta.origen || "—"} <span className="text-slate-400">→</span> {vehiculoConsulta.destino || "—"}
                </p>
                {vehiculoConsulta.recorrido && (
                  <p className="text-[11px] text-slate-500">{vehiculoConsulta.recorrido}</p>
                )}
                <p className="text-[11px] text-slate-600">Hora Despacho: <strong className="font-mono">{horaSalidaVehiculo(vehiculoConsulta)}</strong></p>
                <p className="text-[11px] text-slate-600">Hora Salida: <strong className="font-mono">{formatHora(vehiculoConsulta.hora_ruta)}</strong></p>
                {vehiculoConsulta.conductor && (
                  <p className="text-[11px] text-slate-600">Conductor: <strong>{vehiculoConsulta.conductor}</strong></p>
                )}
                <p className="text-[11px] text-emerald-700 font-bold">
                  <Ticket className="w-3 h-3 inline mr-1" /> {vehiculoConsulta.tickets_vendidos ?? 0} vendidos
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-[11px] font-bold"
                onClick={() => setVehiculoConsulta(null)}
              >
                Cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ➕ DIÁLOGO: ADICIONAR RUTA (origen = agencia del usuario; estado "por despachar")
// ─────────────────────────────────────────────────────────────────────────────
function NuevaRutaDialog({
  open, onOpenChange, idOrigen, nombreOrigen, placasConRutaHoy, onCreada,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idOrigen: number;
  nombreOrigen: string;
  placasConRutaHoy: Set<string>;
  onCreada: () => void;
}) {
  const [orides, setOrides] = useState<OridesOption[]>([]);
  const [conductoresVehiculo, setConductoresVehiculo] = useState<ConductorOption[]>([]);
  const [vehiculos, setVehiculos] = useState<VehiculoOption[]>([]);
  const [horarios, setHorarios] = useState<HorarioOption[]>([]);
  const [concedes, setConcedes] = useState<ConduceOption[]>([]);
  const [recorridos, setRecorridos] = useState<RecorridoOption[]>([]);
  const [tiposServicio, setTiposServicio] = useState<RutaTipoOption[]>([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [cargandoConductores, setCargandoConductores] = useState(false);

  const [destino, setDestino] = useState('');
  const [idHorario, setIdHorario] = useState('');
  const [numeroOrden, setNumeroOrden] = useState('');
  const [placa, setPlaca] = useState('');
  const [tipoServicio, setTipoServicio] = useState('');
  const [conductor, setConductor] = useState('');
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [conductorAux, setConductorAux] = useState('');
  const [auxiliarViaje, setAuxiliarViaje] = useState('');
  const [conduceId, setConduceId] = useState('');
  const [recorridoId, setRecorridoId] = useState('');
  const [destinosRecorrido, setDestinosRecorrido] = useState<OridesOption[]>([]);

  const cargarCatalogos = useCallback(async () => {
    setCargandoCatalogos(true);
    try {
      const [o, v, hh, dr, rr, cc] = await Promise.all([
        travelsoftService.getOrides(),
        travelsoftService.getVehiculosDropdown(),
        travelsoftService.getHorarios(),
        travelsoftService.getRecorridoDestinos(idOrigen),
        travelsoftService.getRecorridos(),
        travelsoftService.getConduces(),
      ]);
      setOrides(o);
      setVehiculos(v.filter((x) => (x.estado_vehi ?? '1') === '1'));
      setHorarios(
        hh
          .filter((x) => x.hora_time !== null && x.hora_time !== '')
          .sort((a, b) => horaDurationAMinutos(a.hora_time) - horaDurationAMinutos(b.hora_time))
      );
      setConcedes(
        (cc ?? [])
          .filter((c) => c.id_conduce != null && (c.desc_conduce ?? '').trim() !== '')
          .sort((a, b) =>
            (a.desc_conduce ?? '').localeCompare(b.desc_conduce ?? '', 'es', { sensitivity: 'base' })
          )
      );
      const tipos = await travelsoftService.getRutasTipos();
      setTiposServicio(tipos);
      const sinAire =
        tipos.find((t) => t.id_ruta_tipo === 1) ??
        tipos.find((t) => (t.desc_ruta_tipo ?? '').toUpperCase().includes('SIN AIRE'));
      if (sinAire) setTipoServicio(String(sinAire.id_ruta_tipo));
      setDestinosRecorrido(dr);
      setRecorridos(rr);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudieron cargar los catálogos.');
    } finally {
      setCargandoCatalogos(false);
    }
  }, [idOrigen]);

  useEffect(() => {
    if (open) {
      setMostrarErrores(false);
      setIdHorario('');
      setConductor('');
      setConductorAux('');
      setAuxiliarViaje('');
      setPlaca('');
      setConduceId('');
      setRecorridoId('');
      setConductoresVehiculo([]);
      void cargarCatalogos();
    }
  }, [open, cargarCatalogos]);

  const destinoOptions = useMemo(() => {
    return destinosRecorrido.length > 0
      ? destinosRecorrido.filter((o) => o.id_orides !== idOrigen && (o.desc_orides || '').trim())
      : orides.filter((o) => o.id_orides !== idOrigen && (o.desc_orides || '').trim());
  }, [destinosRecorrido, orides, idOrigen]);

  // Recorridos cuyo origen y destino coinciden con los de la ruta (sentido 0 = salida)
  const recorridosDeRuta = useMemo(() => {
    if (!destino) return [];
    return recorridos
      .filter(
        (r) =>
          Number(r.origen) === idOrigen &&
          Number(r.destino) === Number(destino) &&
          Number(r.sentido) === 0
      )
      .sort((a, b) => (a.desc_recorrido ?? '').localeCompare(b.desc_recorrido ?? ''));
  }, [recorridos, idOrigen, destino]);

  useEffect(() => {
    setRecorridoId('');
  }, [destino, idOrigen]);

  const vehiculosDisponibles = useMemo(
    () => vehiculos.filter((v) => !placasConRutaHoy.has(v.placa_vehi)),
    [vehiculos, placasConRutaHoy]
  );

  // Números de orden disponibles = orden_vehi de los vehículos activos sin ruta hoy.
  const ordenesDisponibles = useMemo(
    () =>
      vehiculosDisponibles
        .filter((v) => (v.orden_vehi ?? '').trim() !== '')
        .sort((a, b) => Number(a.orden_vehi) - Number(b.orden_vehi)),
    [vehiculosDisponibles]
  );

  const vehiculoSelOrden = useMemo(
    () => ordenesDisponibles.find((v) => (v.orden_vehi ?? '') === numeroOrden) ?? null,
    [ordenesDisponibles, numeroOrden]
  );

  useEffect(() => {
    if (numeroOrden && !vehiculoSelOrden) {
      setNumeroOrden('');
      setPlaca('');
    }
  }, [numeroOrden, vehiculoSelOrden]);

  useEffect(() => {
    if (placa) {
      const vehiculo = vehiculosDisponibles.find((v) => v.placa_vehi === placa);
      setNumeroOrden(vehiculo?.orden_vehi ?? '');
      setConductor('');
      setConductorAux('');
      setAuxiliarViaje('');
      setConductoresVehiculo([]);
      setCargandoConductores(true);
      travelsoftService
        .getConductoresVehiculo(placa)
        .then((data: VehiculoConductoresRespuesta) => {
          setConductoresVehiculo(
            data.conductores.map((x) => ({
              cedula_conduc: x.cedula_conduc,
              nombre_conduc: x.nombre_conduc ?? x.cedula_conduc,
              estado_conduc: x.estado_conduc ?? '1',
            }))
          );
          const titular = data.conductores.find((x) => Number(x.titular) === 1);
          const preseleccion =
            titular?.cedula_conduc ??
            data.conductores.find((x) => x.cedula_conduc === data.ultimo_conduc)
              ?.cedula_conduc ??
            '';
          setConductor(preseleccion);
        })
        .catch((err) => {
          setConductoresVehiculo([]);
          console.error('No se pudieron cargar los conductores del vehículo:', err);
        })
        .finally(() => setCargandoConductores(false));
    } else {
      setNumeroOrden('');
      setConductoresVehiculo([]);
      setCargandoConductores(false);
    }
  }, [placa, vehiculosDisponibles]);

  // Al elegir el número de orden se autocompleta la placa y se cargan sus conductores.
  const handleSeleccionarOrden = (orden: string) => {
    setNumeroOrden(orden);
    const vehiculo = ordenesDisponibles.find((v) => (v.orden_vehi ?? '') === orden);
    setPlaca(vehiculo?.placa_vehi ?? '');
  };

  const horaAMinutos = horaDurationAMinutos;

  const erroresRuta = useMemo<string[]>(() => {
    const e: string[] = [];
    if (!destino) e.push('Seleccione el destino.');
    if (!recorridoId) e.push('Seleccione el recorrido.');
    if (!idHorario) e.push('Ingrese la hora de salida.');
    if (!numeroOrden) e.push('Seleccione el número de orden del vehículo.');
    if (!conduceId) e.push('Debe asignar el número de conduce.');
    return e;

  }, [destino, recorridoId, idHorario, numeroOrden, conduceId]);

  const handleGuardar = async () => {
    if (erroresRuta.length > 0) {
      setMostrarErrores(true);
      toast.error(erroresRuta[0]);
      return;
    }
     setMostrarErrores(false);

    const horarioSel = horarios.find((x) => String(x.id_horario) === idHorario);
    const horaTime = horarioSel?.hora_time ?? null;
    const horaRuta = horaTime ? horaAMinutos(horaTime) : 0;
    const horaProgramada = (horarioSel?.hora_horario || '').trim() || undefined;

     const concedeSel = concedes.find((c) => String(c.id_conduce) === conduceId);

    setGuardando(true);
    try {
      const res = await travelsoftService.crearRuta({
        destino_ruta: Number(destino),
        id_recorrido: recorridoId ? Number(recorridoId) : undefined,
        hora_ruta: horaRuta,
        id_horario: horarioSel?.id_horario ?? undefined,
        hora_programada: horaProgramada,
        placa_vehi: placa,
        numero_orden: (numeroOrden || '').trim().replace(/\D/g, '').slice(0, 6) || undefined,
        id_ruta_tipo: tipoServicio ? Number(tipoServicio) : undefined,
        cedula_conduc: conductor || undefined,
        cedula_conduc2: conductorAux || undefined,
        cedula_auxi: auxiliarViaje || undefined,
        id_conduce: concedeSel?.id_conduce ?? undefined,
      });
      toast.success(`Ruta ${res.cod_ruta} creada en estado por despachar.`);
      onOpenChange(false);
      onCreada();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo crear la ruta.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-black flex items-center gap-2 text-slate-900">
            <Plus className="w-4 h-4 text-emerald-600" /> Adicionar Ruta
          </DialogTitle>
          <DialogDescription className="text-xs">
            La ruta quedará en estado <strong>por despachar</strong> para la agencia {nombreOrigen}.
          </DialogDescription>
        </DialogHeader>

        {cargandoCatalogos ? (
          <div className="py-8 flex items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> Cargando catálogos...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mostrarErrores && erroresRuta.length > 0 && (
              <div className="md:col-span-2 p-3 bg-red-50 border border-red-300 rounded-lg text-[11px] font-semibold text-red-700 space-y-1">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Complete la siguiente información:
                </div>
                <ul className="list-disc pl-4 space-y-0.5">
                  {erroresRuta.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-600">Origen (fijo)</Label>
              <Input value={nombreOrigen} disabled readOnly />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-600">Destino</Label>
              <Select value={destino} onValueChange={setDestino}>
                <SelectTrigger className={cn(mostrarErrores && !destino && "border-red-400 ring-1 ring-red-300 bg-red-50")}>
                  <SelectValue placeholder="Seleccione el destino" />
                </SelectTrigger>
                <SelectContent>
                  {destinoOptions.map((o) => (
                    <SelectItem key={o.id_orides} value={String(o.id_orides)}>{o.desc_orides}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-600">Recorrido <span className="text-red-500">*</span></Label>
              <Select value={recorridoId} onValueChange={setRecorridoId} disabled={!destino}>
                <SelectTrigger className={cn(
                  "transition-colors",
                  mostrarErrores && !recorridoId && "border-red-400 ring-1 ring-red-300 bg-red-50"
                )}>
                  <SelectValue placeholder={destino ? "Seleccione el recorrido" : "Primero elija el destino"} />
                </SelectTrigger>
                <SelectContent>
                  {recorridosDeRuta.length === 0 && (
                    <div className="px-3 py-2 text-xs text-slate-400 italic">
                      {destino ? "No hay recorridos para este origen/destino." : "Elija primero el destino."}
                    </div>
                  )}
                  {recorridosDeRuta.map((r) => (
                    <SelectItem key={r.Id_recorrido} value={String(r.Id_recorrido)}>{r.desc_recorrido}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {destino && recorridosDeRuta.length > 0 && (
                <p className="text-[10px] text-slate-400">Recorridos que coinciden con el origen y destino de la ruta.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-600">Hora de salida</Label>
              <Select value={idHorario} onValueChange={setIdHorario}>
                <SelectTrigger className={cn(mostrarErrores && !idHorario && "border-red-400 ring-1 ring-red-300 bg-red-50")}>
                  <SelectValue placeholder="Seleccione la hora de salida" />
                </SelectTrigger>
                <SelectContent>
                  {horarios.map((x) => (
                    <SelectItem key={x.id_horario} value={String(x.id_horario)}>{x.hora_horario}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-600">Número de orden <span className="text-red-500">*</span> <span className="text-slate-400 font-normal">(del vehículo)</span></Label>
              <Select value={numeroOrden} onValueChange={handleSeleccionarOrden}>
                <SelectTrigger className={cn(
                  "transition-colors",
                  mostrarErrores && !numeroOrden && "border-red-400 ring-1 ring-red-300 bg-red-50"
                )}>
                  <SelectValue placeholder="Seleccione el número de orden" />
                </SelectTrigger>
                <SelectContent>
                  {ordenesDisponibles.length === 0 && (
                    <div className="px-3 py-2 text-xs text-slate-400 italic">Sin vehículos disponibles con número de orden.</div>
                  )}
                  {ordenesDisponibles.map((v) => (
                    <SelectItem key={`${v.orden_vehi}-${v.placa_vehi}`} value={String(v.orden_vehi)}>
                      {v.orden_vehi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {placasConRutaHoy.size > 0 && (
                <p className="text-[10px] text-slate-400">Se ocultan los vehículos que ya tienen ruta creada hoy.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-600">Vehículo</Label>
              <Input
                value={vehiculoSelOrden ? `${vehiculoSelOrden.placa_vehi}${vehiculoSelOrden.marca_vehi ? ` · ${vehiculoSelOrden.marca_vehi}` : ''}${vehiculoSelOrden.modelo_vehi ? ` ${vehiculoSelOrden.modelo_vehi}` : ''}` : ''}
                readOnly
                placeholder={numeroOrden ? "Placa del vehículo" : "Se asigna al elegir el número de orden"}
                className="bg-slate-100 text-slate-700 font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-600">Tipo de servicio <span className="text-slate-400 font-normal">(básico, premium, etc.)</span></Label>
              <Select value={tipoServicio} onValueChange={setTipoServicio}>
                <SelectTrigger><SelectValue placeholder="Seleccione el tipo de servicio" /></SelectTrigger>
                <SelectContent>
                  {tiposServicio.map((t) => (
                    <SelectItem key={t.id_ruta_tipo} value={String(t.id_ruta_tipo)}>{t.desc_ruta_tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-600">Conductor</Label>
              <Select value={conductor} onValueChange={setConductor} disabled={cargandoConductores}>
                <SelectTrigger className={cn(
                  "transition-colors",
                  cargandoConductores && "cursor-wait",
                  mostrarErrores && !conductor && "border-red-400 ring-1 ring-red-300 bg-red-50"
                )}>
                  <SelectValue placeholder={numeroOrden ? "Seleccione el conductor" : "Primero elija el número de orden"} />
                </SelectTrigger>
                <SelectContent>
                  {cargandoConductores && (
                    <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500 font-semibold">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" /> Cargando conductores de la placa...
                    </div>
                  )}
                  {!cargandoConductores && conductoresVehiculo.length === 0 && (
                    <div className="px-3 py-2 text-xs text-slate-400 italic">
                      {placa ? "Este vehículo no tiene conductores asignados." : "Elija primero el número de orden."}
                    </div>
                  )}
                  {!cargandoConductores && conductoresVehiculo.map((c) => (
                    <SelectItem key={c.cedula_conduc} value={c.cedula_conduc}>
                      {c.nombre_conduc} ({c.cedula_conduc})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* TODO(2026-08-15): Campos "Conductor auxiliar" y "Auxiliar de viaje"
                comentarizados para habilitarse más adelante. Se conservan los estados
                conductorAux/auxiliarViaje y su envío en crearRuta (cedula_conduc2/cedula_auxi)
                para cuando se reactiven.
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-600">Conductor auxiliar <span className="text-slate-400 font-normal">(opcional)</span></Label>
              <Select value={conductorAux} onValueChange={(v) => setConductorAux(v === '__none__' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Ninguno" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Ninguno</SelectItem>
                  {conductoresVehiculo.map((c) => (
                    <SelectItem key={c.cedula_conduc} value={c.cedula_conduc}>
                      {c.nombre_conduc} ({c.cedula_conduc})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-600">Auxiliar de viaje <span className="text-slate-400 font-normal">(opcional)</span></Label>
              <Select value={auxiliarViaje} onValueChange={(v) => setAuxiliarViaje(v === '__none__' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Ninguno" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Ninguno</SelectItem>
                  {conductoresVehiculo.length === 0 && !placa && (
                    <div className="px-3 py-2 text-xs text-slate-400 italic">Elija primero el vehículo.</div>
                  )}
                  {conductoresVehiculo.map((c) => (
                    <SelectItem key={c.cedula_conduc} value={c.cedula_conduc}>
                      {c.nombre_conduc} ({c.cedula_conduc})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-600">N° Conduce <span className="text-red-500">*</span> <span className="text-slate-400 font-normal">(documento de tránsito exigido al conductor)</span></Label>
              <Select value={conduceId} onValueChange={setConduceId}>
                <SelectTrigger className={cn(mostrarErrores && !conduceId && "border-red-400 ring-1 ring-red-300 bg-red-50")}>
                  <SelectValue placeholder="Seleccione el conduce" />
                </SelectTrigger>
                <SelectContent>
                  {concedes.length === 0 && (
                    <div className="px-3 py-2 text-xs text-slate-400 italic">Sin concedes disponibles.</div>
                  )}
                  {concedes.map((c) => (
                    <SelectItem key={c.id_conduce} value={String(c.id_conduce)}>{c.desc_conduce}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" className="text-xs font-bold" onClick={() => onOpenChange(false)} disabled={guardando}>
            Cancelar
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5" onClick={() => void handleGuardar()} disabled={guardando || cargandoCatalogos}>
            {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Crear Ruta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function SitioBadge({ estado }: { estado?: string | null }) {
  if (!estado) return null;
  const label = ESTADO_SITIO_LABEL[estado as EstadoSitio] ?? estado;
  const esParqueadero = estado === "EN_PARQUEADERO";
  return (
    <Badge className={cn(
      "text-[10px] font-bold border shrink-0",
      esParqueadero
        ? "bg-sky-100 text-sky-800 border-sky-200"
        : "bg-emerald-100 text-emerald-800 border-emerald-200"
    )}>
      {label}
    </Badge>
  );
}

function DialogoRegistrarLlegada({ vehiculo, onClose, onConfirm, reportando }: {
  vehiculo: EnTransitoItem | null;
  onClose: () => void;
  onConfirm: (opciones: { fecha_llegada: string; hora: string; conductor?: string; novedad?: string; estado_sitio: EstadoSitio }) => void;
  reportando: boolean;
}) {
  const [fechaLlegada, setFechaLlegada] = useState("");
  const [hora, setHora] = useState("");
  const [conductor, setConductor] = useState("");
  const [novedad, setNovedad] = useState("");
  const [estado, setEstado] = useState<EstadoSitio>("EN_SITIO");

  useEffect(() => {
    const ahora = new Date();
    setFechaLlegada(fechaHoyColombia(ahora));
    setHora(horaColombiaCorta(ahora));
    setConductor(vehiculo?.conductor ?? "");
    setNovedad("");
    setEstado("EN_SITIO");
  }, [vehiculo]);

  const abierto = vehiculo !== null;

  return (
    <Dialog open={abierto} onOpenChange={(open) => { if (!open && !reportando) onClose(); }}>
      <DialogContent className="max-w-[95vw] sm:max-w-md sm:max-h-[90vh] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <MapPin className="w-4 h-4 text-emerald-600" />
            Registrar llegada · <span className="font-mono">{vehiculo?.placa_vehi || "SIN PLACA"}</span>
          </DialogTitle>
          <DialogDescription className="text-[11px]">
            {vehiculo
              ? <>Desde <strong>{vehiculo.origen || "—"}</strong> · Salida {vehiculo.hora_despacho || formatHora(vehiculo.hora_ruta)}</>
              : " "}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-700">Fecha de llegada</Label>
            <Input type="date" value={fechaLlegada} onChange={(e) => setFechaLlegada(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-700">Hora de llegada</Label>
            <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-700">Estado del vehículo</Label>
          <Select value={estado} onValueChange={(v) => setEstado(v as EstadoSitio)}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Seleccione el estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EN_SITIO">En Sitio</SelectItem>
              <SelectItem value="EN_PARQUEADERO">En Parqueadero</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-slate-500">El vehículo quedará disponible para ser despachado más adelante.</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-700">Conductor</Label>
          <Input value={conductor} onChange={(e) => setConductor(e.target.value)} placeholder="Nombre del conductor" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-bold text-slate-700">Novedades de la llegada</Label>
          <Textarea value={novedad} onChange={(e) => setNovedad(e.target.value)} rows={3} placeholder="Ej: retraso por derrumbe, avería mecánica, pasajeros en espera..." />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button size="sm" variant="outline" className="text-xs font-bold" onClick={onClose} disabled={reportando}>
            Cancelar
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] gap-1.5"
            disabled={reportando || !fechaLlegada || !hora || !estado}
            onClick={() => onConfirm({ fecha_llegada: fechaLlegada, hora, conductor, novedad, estado_sitio: estado })}
          >
            {reportando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Registrar Llegada
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SubViewLlegadas() {
  const [data, setData] = useState<EnTransitoItem[] | null>(null);
  const [llegados, setLlegados] = useState<EnTransitoItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportando, setReportando] = useState<number | null>(null);
  const [vehiculoDialogo, setVehiculoDialogo] = useState<EnTransitoItem | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await travelsoftService.getLlegadas();
      setData(res.en_transito);
      setLlegados(res.llegados);
    } catch (err) {
      setData(null);
      setLlegados(null);
      console.error('Error al cargar llegadas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const handleReportar = async (
    v: EnTransitoItem,
    opciones: { fecha_llegada: string; hora: string; conductor?: string; novedad?: string; estado_sitio: EstadoSitio }
  ) => {
    setReportando(v.cod_ruta);
    try {
      const res = await travelsoftService.reportarLlegada(v.cod_ruta, v.origen_ruta, {
        fecha: v.fecha_ruta ?? undefined,
        fecha_llegada: opciones.fecha_llegada,
        hora: opciones.hora,
        conductor: opciones.conductor,
        novedad: opciones.novedad,
        estado_sitio: opciones.estado_sitio,
      });
      toast.success(`Llegada de ${v.placa_vehi || v.cod_ruta} registrada a las ${res?.hora_llegada ?? opciones.hora}.`);
      await cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al reportar la llegada.");
    } finally {
      setReportando(null);
      setVehiculoDialogo(null);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-6 sm:p-8 flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
          <span className="text-xs font-bold tracking-wide">Consultando vehículos en tránsito...</span>
        </CardContent>
      </Card>
    );
  }

  if (!data || !llegados) {
    return (
      <Card className="bg-white border-rose-200 shadow-sm">
        <CardContent className="p-6 sm:p-8 flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
          <div>
            <h3 className="text-sm font-black text-slate-900">No se pudieron cargar las llegadas</h3>
            <p className="text-xs text-slate-500 mt-1">Verifica el backend e inténtalo de nuevo.</p>
          </div>
          <Button size="sm" variant="outline" className="text-xs font-bold gap-2 h-11 touch-list" onClick={() => void cargar()}>
            <RefreshCcw className="w-3.5 h-3.5" /> Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Llegadas a la Agencia</h2>
        <p className="text-xs text-slate-500">
          Vehículos despachados desde otras agencias con destino a esta agencia.
        </p>
      </div>

      <Card className="bg-white border-amber-200 shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-bold uppercase text-amber-700 flex items-center justify-between">
            En Tránsito
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-bold">{data.length}</Badge>
          </CardTitle>
          <CardDescription className="text-[11px]">Registre la llegada cuando el vehículo esté en andén.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {data.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">No hay vehículos en tránsito hacia esta agencia.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {data.map((v) => (
                <div key={v.cod_ruta} className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                        <Bus className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 font-mono truncate">{v.orden_vehi || v.placa_vehi || "SIN ORDEN"}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          Desde <strong className="text-slate-700">{v.origen || "—"}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Salida</p>
                      <p className="text-[11px] font-bold text-slate-700 font-mono">{v.hora_despacho || formatHora(v.hora_ruta)}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {v.conductor ? <><User className="w-3 h-3 inline mr-1 text-slate-400" />{v.conductor}</> : "Sin conductor"}
                  </p>
                  <Button
                    size="sm"
                    className="mt-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] gap-1.5"
                    disabled={reportando === v.cod_ruta}
                    onClick={() => setVehiculoDialogo(v)}
                  >
                    {reportando === v.cod_ruta ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                    Registrar Llegada
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-bold uppercase text-slate-900 flex items-center justify-between">
            Llegados · Listos para despachar
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">{llegados.length}</Badge>
          </CardTitle>
          <CardDescription className="text-[11px]">Vehículos que llegaron hoy y quedaron en parqueadero o en sitio.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {llegados.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">Aún no se reportan llegadas hoy.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {llegados.map((v) => (
                <div key={v.cod_ruta} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                        <Bus className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 font-mono truncate">{v.orden_vehi || v.placa_vehi || "SIN ORDEN"}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          Desde <strong className="text-slate-700">{v.origen || "—"}</strong>
                        </p>
                      </div>
                    </div>
                    <SitioBadge estado={v.estado_sitio} />
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 font-bold text-emerald-700">
                      <Clock className="w-3 h-3" /> Llegó {v.hora_llegada || "—"}
                    </span>
                    <span className="text-slate-500 font-mono">{v.fecha_llegada || v.fecha_ruta || ""}</span>
                  </div>
                  {v.novedad_llegada && (
                    <p className="text-[11px] text-slate-600 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 line-clamp-2">
                      {v.novedad_llegada}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500 truncate">
                    {v.conductor ? <><User className="w-3 h-3 inline mr-1 text-slate-400" />{v.conductor}</> : "Sin conductor"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DialogoRegistrarLlegada
        vehiculo={vehiculoDialogo}
        reportando={reportando !== null}
        onClose={() => setVehiculoDialogo(null)}
        onConfirm={(opciones) => {
          if (vehiculoDialogo) void handleReportar(vehiculoDialogo, opciones);
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 🎫 2. SUBVISTA: TAQUILLA DE VENTAS
// ─────────────────────────────────────────────────────────────────────────────
function SubViewVentas({
  setTotalCaja,
  ventaInicial,
  onVentaInicialConsumida,
}: {
  setTotalCaja: React.Dispatch<React.SetStateAction<number>>;
  ventaInicial?: VehiculoEstado | null;
  onVentaInicialConsumida?: () => void;
}) {
  const { user } = useAuth();
  const nombreAgencia = String(user?.agencia ?? "") || "Agencia";
  const [programacion, setProgramacion] = useState<ProgramacionVehiculosData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const [vehiculoSel, setVehiculoSel] = useState<VehiculoEstado | null>(null);
  const [sillas, setSillas] = useState<SillasData | null>(null);
  const [cargandoSillas, setCargandoSillas] = useState(false);
  const [sillasSel, setSillasSel] = useState<number[]>([]);

  const [documento, setDocumento] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [buscandoPasajero, setBuscandoPasajero] = useState(false);
  const [pasajeroExiste, setPasajeroExiste] = useState(false);

  const [formaPago, setFormaPago] = useState<FormaPago>('EFECTIVO');
  const [ticket, setTicket] = useState<TicketVenta | null>(null);
  const [generando, setGenerando] = useState(false);
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const impresoRef = useRef(false);

  const impresora = useImpresoraLocal();

  const [impresoraInfo, setImpresoraInfo] = useState<EstadoImpresora | null>(null);

  // Estado de la impresora térmica USB del servidor (pyusb, sin intervención).
  const cargarEstadoImpresora = useCallback(async () => {
    try {
      setImpresoraInfo(await travelsoftService.getEstadoImpresora());
    } catch {
      setImpresoraInfo(null);
    }
  }, []);

  useEffect(() => {
    void cargarEstadoImpresora();
  }, [cargarEstadoImpresora]);



  const cargarDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      setProgramacion(await travelsoftService.getProgramacionVehiculos());
    } catch {
      setProgramacion(null);
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  useEffect(() => {
    void cargarDashboard();
  }, [cargarDashboard]);

  // console.log(dashboard)

  // La taquilla vende tiquetes de los vehículos habilitados que aún están en
  // plataforma (habilitada_adicional='1' y despachada_adicional='0'). Los que
  // ya fueron despachados (despachada='1') están en tránsito y terminó su venta.
  const porDespachar = useMemo(() => {
    const v = programacion?.vehiculos;
    if (!v) return [];
    return [...v.programados]
       .filter((r) => r.habilitada_ruta === '1')
      .sort((a, b) => (a.hora_ruta ?? 0) - (b.hora_ruta ?? 0));
  }, [programacion]);

  // Preselecciona el vehículo cuando se llega a la taquilla desde "Vender Ticket" de Despacho
  useEffect(() => {
    if (ventaInicial) {
      const ruta = porDespachar.find((r) => r.cod_ruta === ventaInicial.cod_ruta);
      if (ruta) {
        setVehiculoSel(ruta);
        void cargarSillas(ruta);
      }
      onVentaInicialConsumida?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ventaInicial, porDespachar]);

  const cargarSillas = useCallback(async (ruta: VehiculoEstado) => {
    setCargandoSillas(true);
    setSillasSel([]);
    setTicket(null);
    impresoRef.current = false;
    try {
      setSillas(await travelsoftService.getSillas(ruta.cod_ruta, ruta.fecha_ruta ?? undefined));
    } catch (err) {
      setSillas(null);
      toast.error(err instanceof Error ? err.message : 'No se pudieron cargar las sillas.');
    } finally {
      setCargandoSillas(false);
    }
  }, []);

  const handleSeleccionarVehiculo = (codRuta: number) => {
    const ruta = porDespachar.find((r) => r.cod_ruta === codRuta);
    if (!ruta) return;
    setVehiculoSel(ruta);
    void cargarSillas(ruta);
  };

  // Despachar el vehículo y generar el "Libro de Ruta" en PDF (jsPDF).
  const handleDespacharLibroRuta = async (r: VehiculoEstado) => {
    let pasajeros: PasajeroLibro[] = [];
    let totalValor = 0;
    let conductor: ConductorSACTel | null = null;
    try {
      const manifiesto = await travelsoftService.getManifiestoDespacho(
        r.cod_ruta,
        r.fecha_ruta || undefined
      );
      const destino = manifiesto?.destino || r.destino || "—";
      const cedula = manifiesto?.conductores?.[0]?.cedula;
      if (cedula) {
        try {
          conductor = await travelsoftService.getConductor(cedula);
        } catch {
          conductor = null;
        }
      }
      const lista = manifiesto?.pasajeros ?? [];
      pasajeros = lista
        .map((p) => ({
          nombre: p.nombre || "—",
          documento: p.documento || "—",
          asiento: p.puesto ?? null,
          tiquete: p.consecutivo_pasajero != null ? String(p.consecutivo_pasajero) : "—",
          valor: p.valor ?? 0,
          destino,
        }))
        .sort((a, b) => (a.asiento ?? 0) - (b.asiento ?? 0));
      totalValor = lista.reduce((s, p) => s + (p.valor ?? 0), 0);
    } catch {
      pasajeros = [];
    }
    const texto = generarInformeDespachoTXT({
      empresa: EMPRESA_NOMBRE,
      nit: EMPRESA_NIT,
      agencia: nombreAgencia,
      planilla: r.consecutivo_planilla ?? null,
      numeroVehiculo: r.orden_vehi ?? null,
      placa: r.placa_vehi || undefined,
      rutaNro: r.cod_ruta,
      desdeHasta: [r.origen, r.destino].filter(Boolean).join(" -> "),
      fecha: r.fecha_ruta || new Date().toISOString().slice(0, 10),
      horaSalida: r.hora_ruta != null ? formatHora(r.hora_ruta) : "—",
      conductor: r.conductor || conductor?.nombre_conduc || undefined,
      licencia: conductor?.numero_licencia ?? null,
      celularConductor: conductor?.celular_conduc ?? null,
      deudaProducidos: conductor?.deuda_producidos ?? null,
      agente: user?.nombreCompleto || user?.nombre || "—",
      pasajeros,
      totalValor,
    });
    let logo: string | null = null;
    try {
      logo = await obtenerLogoEscPos();
    } catch {
      logo = null;
    }
    const resultado = await imprimirLocal(texto, undefined, logo ?? undefined);
    if (resultado === "error") {
      toast.error("No se pudo imprimir el Libro de Ruta en ninguna impresora local.");
    } else {
      toast.success("Libro de Ruta enviado a la impresora.");
    }
  };

  // Limpia la taquilla de ventas y la regresa al estado inicial (cards de vehículos).
  const reiniciar = useCallback(() => {
    setTicket(null);
    setVehiculoSel(null);
    setSillas(null);
    setSillasSel([]);
    setDocumento('');
    setNombres('');
    setApellidos('');
    setCorreo('');
    setTelefono('');
    setPasajeroExiste(false);
    setFormaPago('EFECTIVO');
    impresoRef.current = false;
  }, []);

  // Impresión directa al generar el tiquete (sin que el usuario pulse imprimir):
  // 1. Impresora USB del servidor vía pyusb (impresión silenciosa, sin diálogos).
  // 2. Bluetooth directo (Web Bluetooth) → Android, sin app intermedia.
  // 3. RawBT (Android con app) → window.print() (escritorio).
  // Lógica de impresión / emisión fiscal compartida con el panel satélite:
  const { imprimirTicket, emitirConDian } = useTicketFiscal();

  // Impresión automática del tiquete al generarlo: imprime, limpia la pantalla
  // de datos y regresa la taquilla al estado inicial (cards de vehículos).
  useEffect(() => {
    if (ticket && !impresoRef.current) {
      impresoRef.current = true;
      const t = window.setTimeout(() => {
        reiniciar();
      }, 400);
      return () => window.clearTimeout(t);
    }
  }, [ticket, imprimirTicket, reiniciar]);

  // ── WhatsApp share card (estilo soyllanero.com) ────────────────────────
  const compartirWhatsApp = () => {
    const card = buildWhatsAppCard({
      title: 'Viaje Confirmado',
      empresa: EMPRESA_NOMBRE,
      ruta: ticket?.cod_ruta != null ? String(ticket.cod_ruta) : '-',
      origen: ticket?.origen ?? '-',
      destino: ticket?.destino ?? '-',
      hora: ticket?.hora_tiquete || formatHora(ticket?.hora_ruta),
      asiento: ticket?.puesto != null ? String(ticket.puesto) : (ticket?.sillas?.join(', ') ?? '-'),
      precio: ticket?.total != null
        ? `$${ticket.total.toLocaleString('es-CO')}`
        : (ticket?.valor != null ? `$${ticket.valor.toLocaleString('es-CO')}` : '-'),
      url: window.location.origin,
      qrData: ticket?.cufe ?? '',
    });
    window.open(card.link, '_blank', 'noopener,noreferrer,width=600,height=800');
  };

  const formasPago: { id: FormaPago; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'EFECTIVO', label: 'Efectivo', desc: 'Pago en caja', icon: <Banknote className="w-5 h-5" /> },
    { id: 'TARJETA', label: 'Tarjeta', desc: 'Débito / crédito', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'QR', label: 'Código QR', desc: 'Pago por QR', icon: <QrCode className="w-5 h-5" /> },
  ];

  const BotonWhatsApp = () => (
    <button
      type="button"
      onClick={compartirWhatsApp}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-xl text-white bg-[#2d5a3d] hover:bg-[#4a7c59] transition-transform hover:scale-105"
      title="Compartir ticket por WhatsApp"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12.04 2.01C6.5 2.01 2 6.21 2 11.29c0 2.46 1.63 4.55 3.9 5.28l-.6.46c-.33.25-.45.7-.23 1.05l1.7 2.92c.22.37.7.5 1.08.32l1.9-1c.93.36 1.92.57 2.95.57 5.54 0 10.04-4.2 10.04-9.72S17.58 2.01 12.04 2.01zm5.43 7.64-4.5 3.13c-.3.21-.65.31-.99.29-.34-.02-.6-.14-.78-.39l-1.5-1.99c-.21-.28-.17-.68.09-.9 0 0 0 0 .01-.01.26-.23.66-.2 1.03.03.1.06.21.11.31.17l.49 3.93c.05.48.28 1 .68 1.33l1.45 1.04c.43.31.99.36 1.48.12l3.36-1.47c.3-.13.59-.36.76-.66.16-.27.22-.6.11-.9-.1-.3-.33-.53-.61-.67z"/>
      </svg>
    </button>
  );

  const errores = useMemo<string[]>(() => {
    const e: string[] = [];
    if (!vehiculoSel) e.push('Seleccione un vehículo por despachar.');
    if (sillasSel.length === 0) e.push('Seleccione al menos una silla desocupada.');
    if (documento.trim() && !nombres.trim()) e.push('Ingrese los nombres del pasajero.');
    return e;
  }, [vehiculoSel, sillasSel.length, documento, nombres]);

  const buscarPasajero = async () => {
    const doc = documento.trim();
    if (!doc || buscandoPasajero) return;
    setBuscandoPasajero(true);
    try {
      const p = await travelsoftService.getPasajero(doc);
      if (p) {
        setNombres(p.nombres);
        setApellidos(p.apellidos);
        setCorreo(p.correo ?? '');
        setTelefono(p.telefono ?? '');
        setPasajeroExiste(true);
        toast.success('Pasajero encontrado. Datos cargados.');
      } else {
        setPasajeroExiste(false);
        toast.info('Pasajero no registrado: se creará su perfil al generar el ticket.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo consultar el pasajero.');
    } finally {
      setBuscandoPasajero(false);
    }
  };

  const handleGenerar = async () => {
    if (impresora.disponible !== true) {
      toast.error('Conecte una impresora local para generar el tiquete (PC: servicio de impresión; PDA: impresora integrada/Bluetooth).');
      return;
    }
    if (errores.length > 0) {
      setMostrarErrores(true);
      toast.error(errores[0]);
      return;
    }
    setMostrarErrores(false);

    // Sin número de identificación: pasajero por defecto "CONSUMIDOR FINAL"
    const sinDocumento = !documento.trim();
    const docFinal = sinDocumento ? '222222222222' : documento.trim();
    const nombresFinal = sinDocumento ? 'CONSUMIDOR' : nombres.trim();
    const apellidosFinal = sinDocumento ? 'FINAL' : apellidos.trim();
    const correoFinal = sinDocumento ? 'tickets@sactel.net' : (correo.trim() || undefined);
    if (sinDocumento) {
      setDocumento(docFinal);
      setNombres(nombresFinal);
      setApellidos(apellidosFinal);
      setCorreo(correoFinal);
    }

    setGenerando(true);
    try {
      const venta = await travelsoftService.venderTiquete({
        cod_ruta: vehiculoSel!.cod_ruta,
        puesto: sillasSel[0],
        puestos: sillasSel,
        numero_documento: docFinal,
        nombres: nombresFinal,
        apellidos: apellidosFinal,
        correo: correoFinal,
        telefono: telefono.trim() || undefined,
        forma_pago: formaPago,
        fecha: vehiculoSel.fecha_ruta ?? undefined,
        consecutivo_planilla: vehiculoSel.consecutivo_planilla ?? undefined,
      });

      // Modo de impresión según parámetro de la compañía:
      //  - "un tiquete por silla" (por defecto): cada silla se imprime por separado.
      //  - "tiquete consolidado": un solo tiquete con todas las sillas.
      if (venta.consolidado) {
        // Emisión fiscal ante la DIAN (CUFE + QR). Si el Core no responde,
        // el tiquete se imprime igualmente con la numeración de la resolución local.
        const ticketFinal = await emitirConDian(venta.data, (msg) => toast.warning(msg));
        await imprimirTicket(ticketFinal).then((medio) => {
          if (medio === 'pda') toast.success('Ticket impreso en impresora local (silenciosa).');
          else if (medio === 'print') toast.info('Abriendo diálogo de impresión del navegador (impresora del equipo).');
          else if (medio === 'ble') toast.success('Ticket impreso en impresora Bluetooth.');
          else if (medio === 'sunmi') toast.success('Ticket impreso en impresora integrada (PDA).');
          else if (medio === 'rawbt') toast.success('Ticket impreso vía RawBT (PDA).');
        });
        setTicket(ticketFinal);
        if (venta.total) setTotalCaja((p) => p + venta.total);
        toast.success(`${venta.cantidad} tiquete(s) generados, imprimiendo...`);
      } else {
        // Un tiquete por cada silla vendida.
        for (const t of venta.tiquetes) {
          const ticketFinal = await emitirConDian(t, (msg) => toast.warning(msg));
          await imprimirTicket(ticketFinal).then((medio) => {
          if (medio === 'pda') toast.success('Ticket impreso en impresora local (silenciosa).');
          else if (medio === 'print') toast.info('Abriendo diálogo de impresión del navegador (impresora del equipo).');
          else if (medio === 'ble') toast.success('Ticket impreso en impresora Bluetooth.');
          else if (medio === 'sunmi') toast.success('Ticket impreso en impresora integrada (PDA).');
          else if (medio === 'rawbt') toast.success('Ticket impreso vía RawBT (PDA).');
        });
        }
        setTicket(venta.tiquetes[0] ?? venta.data);
        if (venta.total) setTotalCaja((p) => p + venta.total);
        toast.success(`${venta.cantidad} tiquete(s) generados, imprimiendo...`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo generar el tiquete.');
    } finally {
      setGenerando(false);
    }
  };

  const disponibles = sillas?.sillas.filter((s) => s.estado === 'disponible').length ?? 0;

  if (loadingDashboard) {
    return (
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-6 sm:p-8 flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
          <span className="text-xs font-bold tracking-wide">Cargando vehículos por despachar...</span>
        </CardContent>
      </Card>
    );
  }

  if (!programacion) {
    return (
      <Card className="bg-white border-rose-200 shadow-sm">
        <CardContent className="p-6 sm:p-8 flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
          <div>
            <h3 className="text-sm font-black text-slate-900">No se pudo cargar la taquilla</h3>
            <p className="text-xs text-slate-500 mt-1">Verifica el backend e inténtalo de nuevo.</p>
          </div>
          <Button size="sm" variant="outline" className="text-xs font-bold gap-2 h-11 touch-list" onClick={() => void cargarDashboard()}>
            <RefreshCcw className="w-3.5 h-3.5" /> Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 animate-in fade-in duration-200">
      <div className="lg:col-span-2 space-y-3 sm:space-y-4">
        {/* 1. Vehículo despachado */}
        <Card className={cn("bg-white shadow-sm", mostrarErrores && !vehiculoSel ? "border-red-400 ring-1 ring-red-300" : "border-slate-200")}>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold uppercase text-emerald-600">1. Vehículo Disponible</CardTitle>
            <CardDescription className="text-[11px]">Venta de tiquetes de los vehículos habilitados que aún están en plataforma.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {          porDespachar.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-dashed text-xs text-slate-400 italic text-center">
                No hay vehículos habilitados en plataforma hoy. Adicione una ruta desde Programación para vender sus tiquetes.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[calc(100vh-26rem)] overflow-y-auto pr-1">
                {porDespachar.map((r) => {
                  const activo = vehiculoSel?.cod_ruta === r.cod_ruta;
                  return (
                    <div
                      key={r.cod_ruta}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSeleccionarVehiculo(r.cod_ruta)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSeleccionarVehiculo(r.cod_ruta);
                        }
                      }}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-all min-h-[72px] sm:min-h-[80px] touch-list",
                        activo
                          ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20"
                          : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-slate-900 font-mono">{r.orden_vehi || r.placa_vehi || 'SIN ORDEN'}</span>
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[9px] font-bold border">
                          EN PLATAFORMA
                        </Badge>
                      </div>
                      <div className="mt-1.5 space-y-0.5 text-[11px]">
                        <p className="font-bold text-slate-700 truncate">{r.destino || '—'}</p>
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatHora(r.hora_ruta)}</span>
                          {r.capacidad ? <span className="flex items-center gap-1"><Armchair className="w-3 h-3" /> {r.capacidad}</span> : null}
                        </div>
                        <div className="flex items-center justify-between pt-0.5 border-t border-slate-100">
                          <span className="flex items-center gap-1 font-bold text-emerald-700">
                            <Ticket className="w-3 h-3" /> {r.tickets_vendidos ?? 0} vendidos
                          </span>
                          {r.tickets_vendidos && r.capacidad ? (
                            <span className="text-slate-400 font-mono">
                              {Math.round(((r.tickets_vendidos ?? 0) / r.capacidad) * 100)}%
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDespacharLibroRuta(r);
                        }}
                        className="mt-2 w-full flex items-center justify-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black py-1.5 shadow-sm"
                      >
                        <FileDown className="w-3.5 h-3.5" /> Despachar vehiculo
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {vehiculoSel && sillas && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-slate-50 border">
                  <span className="block text-slate-400 font-bold uppercase">Destino</span>
                  <span className="font-black text-slate-900">{sillas.destino || '—'}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border">
                  <span className="block text-slate-400 font-bold uppercase">Hora</span>
                  <span className="font-black text-slate-900 font-mono">{formatHora(sillas.hora_ruta)}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border">
                  <span className="block text-slate-400 font-bold uppercase">Capacidad</span>
                  <span className="font-black text-slate-900">{sillas.capacidad} sillas</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border">
                  <span className="block text-slate-400 font-bold uppercase">Tarifa</span>
                  <span className="font-black text-emerald-700">${(sillas.valor ?? 0).toLocaleString('es-CO')}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. Datos del Pasajero */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold uppercase text-emerald-600">2. Datos del Pasajero</CardTitle>
            <CardDescription className="text-[11px]">Sin identificación se asigna CONSUMIDOR FINAL (222222222222) con correo tickets@sactel.net.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="doc" className="text-[11px] font-bold text-slate-600">Número de identificación</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="doc"
                  value={documento}
                  onChange={(e) => {
                    setDocumento(e.target.value);
                    setPasajeroExiste(false);
                  }}
                  onBlur={() => void buscarPasajero()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void buscarPasajero();
                  }}
                  placeholder="Ej: 80.799.518-2"
                  className={cn(pasajeroExiste && "border-emerald-400 bg-emerald-50")}
                />
                {buscandoPasajero && <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />}
                {pasajeroExiste && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              </div>
              {pasajeroExiste && (
                <p className="text-[10px] text-emerald-700 font-medium">Pasajero registrado — datos cargados.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nombres" className="text-[11px] font-bold text-slate-600">Nombres</Label>
              <Input
                id="nombres"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                placeholder="Ej: Fredy Alberto"
                className={cn(mostrarErrores && documento.trim() && !nombres.trim() && "border-red-400 ring-1 ring-red-300 bg-red-50")}
              />
              {mostrarErrores && documento.trim() && !nombres.trim() && (
                <p className="text-[10px] text-red-600 font-medium">Los nombres son obligatorios cuando ingresa una identificación.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apellidos" className="text-[11px] font-bold text-slate-600">Apellidos</Label>
              <Input id="apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} placeholder="Ej: Parra Quitian" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="correo" className="text-[11px] font-bold text-slate-600">Correo electrónico</Label>
              <Input id="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="Ej: correo@ejemplo.com" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="telefono" className="text-[11px] font-bold text-slate-600">Teléfono <span className="text-slate-400 font-normal">(opcional)</span></Label>
              <Input id="telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej: 310 000 0000" />
            </div>
          </CardContent>
        </Card>

        {/* 3. Croquis de Sillas */}
        <Card className={cn("bg-white shadow-sm", mostrarErrores && sillasSel.length === 0 ? "border-red-400 ring-1 ring-red-300" : "border-slate-200")}>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold uppercase text-emerald-600 flex items-center justify-between">
              3. Sillas del Vehículo
              {sillas && (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                  {disponibles} disponibles · {sillas.ocupadas.length} ocupadas
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-[11px]">Las sillas grises están ocupadas.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {cargandoSillas && (
              <div className="py-8 flex items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> Cargando sillas...
              </div>
            )}
            {!cargandoSillas && !sillas && (
              <p className="text-xs text-slate-400 italic py-6 text-center">Seleccione un vehículo para ver el croquis.</p>
            )}
            {!cargandoSillas && sillas && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 border p-4 rounded-xl bg-slate-50 max-h-80 overflow-y-auto">
                {sillas.sillas.map((s) => {
                  const seleccionada = sillasSel.includes(s.numero);
                  return (
                    <button
                      key={s.numero}
                      disabled={s.estado === 'ocupada'}
                      onClick={() =>
                        setSillasSel((prev) =>
                          seleccionada ? prev.filter((n) => n !== s.numero) : [...prev, s.numero]
                        )
                      }
                      className={cn(
                        "h-12 rounded-lg text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5",
                        s.estado === 'ocupada'
                          ? "bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed"
                          : seleccionada
                            ? "bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-600/30"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300"
                      )}
                    >
                      <Armchair className="w-3.5 h-3.5" />
                      {s.numero}
                    </button>
                  );
                })}
              </div>
            )}
            {sillasSel.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <span>Sillas: {[...sillasSel].sort((a, b) => a - b).join(', ')}</span>
                <span>Cantidad: {sillasSel.length}</span>
                <span className="text-emerald-700">
                  Total: ${(Number(sillas?.valor ?? 0) * sillasSel.length).toLocaleString('es-CO')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recaudo */}
      <div className="space-y-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold uppercase text-slate-900 flex items-center justify-between">
              Impresora USB
              {impresoraInfo?.detectada ? (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                  Conectada
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] font-bold">
                  No detectada
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {impresoraInfo?.detectada ? (
              <p className="text-[11px] text-emerald-600 font-semibold">
                {impresoraInfo.impresora?.producto || 'Impresora térmica'} conectada. Los tiquetes se
                imprimirán directo al generar la venta, sin intervención del usuario.
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">
                No hay impresora térmica USB detectada en el servidor. Verifique que esté conectada y
                encendida, y que el usuario del servicio tenga acceso USB.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold uppercase text-slate-900">4. Forma de Pago</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-3 gap-2 touch-list">
              {formasPago.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormaPago(f.id)}
                  className={cn(
                    "p-3 rounded-xl border-2 text-center transition-all min-h-[72px]",
                    formaPago === f.id
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <span className={cn("mx-auto flex items-center justify-center", formaPago === f.id ? "text-emerald-600" : "text-slate-500")}>
                    {f.icon}
                  </span>
                  <span className="block text-[11px] font-black mt-1 text-slate-800">{f.label}</span>
                  <span className="block text-[9px] text-slate-400">{f.desc}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 p-3 bg-slate-900 text-slate-100 rounded-lg text-xs flex justify-between items-center">
              <span className="font-bold">Total Pasaje:</span>
              <span className="text-base font-black text-emerald-400">
                ${(sillas?.valor ?? 0).toLocaleString('es-CO')}
              </span>
            </div>

            {mostrarErrores && errores.length > 0 && (
              <div className="mt-3 p-3 bg-red-50 border border-red-300 rounded-lg text-[11px] font-semibold text-red-700 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Complete la siguiente información para generar el tiquete:
                </div>
                <ul className="list-disc pl-4 space-y-0.5">
                  {errores.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-12 mt-3 gap-2 touch-list"
              disabled={generando || impresora.disponible !== true}
              onClick={() => void handleGenerar()}
            >
              {generando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
              GENERAR TICKET DE VENTA
            </Button>

            {impresora.disponible === false && (
              <p className="mt-2 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-300 rounded-lg p-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Impresora local no detectada. Conecte el servicio de impresión (PC) o la impresora de la PDA para poder generar tiquetes.
              </p>
            )}
            {impresora.disponible === null && (
              <p className="mt-2 text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Verificando impresora local…
              </p>
            )}

            {ticket && (
              <Button variant="outline" className="w-full text-xs font-bold mt-2 gap-2" onClick={reiniciar}>
                <RefreshCcw className="w-3.5 h-3.5" /> Nueva Venta
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Comprobante / impresión */}
        {ticket && (
          <div id="ticket-print" className="bg-white border border-slate-300 rounded-lg p-4 font-mono text-[11px] leading-relaxed shadow-sm space-y-1.5">
            <div className="text-center mb-2">
              <img
                src="/images/logo_tiquete.jpg"
                alt="Flota San Vicente S.A."
                className="mx-auto h-12 w-auto object-contain"
                loading="eager"
              />
            </div>
            <div className="text-center font-black border-b border-dashed pb-1.5">
              <p className="text-xs">FLOTA SAN VICENTE S.A.</p>
              <p className="text-[10px] text-slate-500">SERVICIO PÚBLICO DE TRANSPORTE</p>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">TIQUETE N°</span>
              <span className="font-black">{ticket.consecutivo_pasajero}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">FECHA</span>
              <span>{ticket.fecha_ruta} {ticket.hora_tiquete || ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">RUTA</span>
              <span>{ticket.cod_ruta}</span>
            </div>
            <p className="text-center font-black border-y border-dashed py-1.5 my-1">
              {ticket.origen || '—'} → {ticket.destino || '—'}
            </p>
            <div className="flex justify-between">
              <span className="text-slate-500">SALIDA</span>
              <span>{formatHora(ticket.hora_ruta)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">VEHÍCULO</span>
              <span>{ticket.placa_vehi || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">SILLA</span>
              <span className="font-black">{ticket.puesto}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">PASAJERO</span>
              <span className="max-w-[55%] text-right">{ticket.pasajero.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">DOCUMENTO</span>
              <span>{ticket.pasajero.documento}</span>
            </div>
            {ticket.pasajero.correo && (
              <div className="flex justify-between">
                <span className="text-slate-500">CORREO</span>
                <span className="max-w-[55%] text-right break-all">{ticket.pasajero.correo}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-dashed pt-1.5 mt-1">
              <span className="text-slate-500">VALOR</span>
              <span className="font-black text-base">${(ticket.valor ?? 0).toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">FORMA DE PAGO</span>
              <span>{ticket.forma_pago}</span>
            </div>
            {ticket.mensaje && (
              <p className="text-center text-[9px] text-slate-400 border-t border-dashed pt-1.5 mt-1">{ticket.mensaje}</p>
            )}
            {ticket.resolucion_numero && (
              <div className="border-t border-dashed pt-1.5 mt-1 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">RESOLUCIÓN</span>
                  <span className="font-black text-[10px]">{ticket.resolucion_numero}</span>
                </div>
                {ticket.numero_factura && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">FACTURA</span>
                    <span className="font-black text-[10px]">{ticket.numero_factura}</span>
                  </div>
                )}
                {ticket.cufe && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">CUFE</span>
                    <span className="font-mono text-[9px] text-right break-all max-w-[60%]">{ticket.cufe}</span>
                  </div>
                )}
              </div>
            )}
            <hr className="border-t border-dashed border-slate-300 my-2" />
          </div>
        )}
        {ticket && <BotonWhatsApp />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 📅 3. SUBVISTA: RESERVAS
// ─────────────────────────────────────────────────────────────────────────────
function SubViewReservas() {
  return (
    <Card className="bg-white border-slate-200 shadow-sm animate-in fade-in duration-200">
      <CardHeader>
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
          <BookmarkCheck className="w-4 h-4 text-emerald-600" /> Reservas Activas de Andén
        </CardTitle>
        <CardDescription className="text-xs">Administración y efectivización de apartados telefónicos o web.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-xl overflow-hidden text-xs">
          <div className="bg-slate-50 p-3 font-bold border-b grid grid-cols-3 text-slate-500">
            <span>Cliente</span>
            <span>Ruta</span>
            <span>Vencimiento</span>
          </div>
          <div className="p-3 grid grid-cols-3 border-b items-center bg-white">
            <span className="font-semibold text-slate-900">Mariana Restrepo</span>
            <span className="text-slate-600">Bogotá a Cali</span>
            <Badge className="bg-amber-100 text-amber-800 w-fit text-[10px] font-bold border-amber-200">Faltan 15m</Badge>
          </div>
          <div className="p-3 grid grid-cols-3 items-center bg-white">
            <span className="font-semibold text-slate-900">Jorge Barón</span>
            <span className="text-slate-600">Bogotá a Ibagué</span>
            <Badge className="bg-red-100 text-red-800 w-fit text-[10px] font-bold border-red-200">Expirado</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 📈 4. SUBVISTA: INFORMES
// ─────────────────────────────────────────────────────────────────────────────
function SubViewInformes() {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-900">Rendimiento Técnico de Venta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>Cumplimiento de Meta de Andén</span>
              <span>72%</span>
            </div>
            <Progress className="h-2 bg-slate-100" value={72} />
          </div>

          <div className="p-3 rounded-lg border bg-slate-50 text-xs space-y-1">
            <p className="font-bold text-slate-700">Métricas Consolidadas:</p>
            <p className="text-slate-500">• Transacciones Exitosas DIAN: <strong className="text-slate-900">14 XML</strong></p>
            <p className="text-slate-500">• Ticket Promedio del Turno: <strong className="text-slate-900">$85,000 COP</strong></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 💵 5. SUBVISTA: CIERRE DE CAJERO
// ─────────────────────────────────────────────────────────────────────────────
function SubViewCierre({ total }: { total: number }) {
  const [cierreProcesado, setCierreProcesado] = useState(false);
  const [fecha, setFecha] = useState<string>(hoyISO());
  const [ventas, setVentas] = useState<VentaCajero[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarVentas = useCallback(async (fechaSel?: string) => {
    setCargando(true);
    setError(null);
    try {
      setVentas(await travelsoftService.getVentasCajero(fechaSel || undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las ventas.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarVentas(fecha);
  }, [fecha, cargarVentas]);

  // Agrupación por vehículo (placa)
  const porVehiculo = useMemo(() => {
    const mapa = new Map<string, VentaCajero[]>();
    for (const v of ventas) {
      const key = v.placa_vehi || 'SIN PLACA';
      const arr = mapa.get(key) ?? [];
      arr.push(v);
      mapa.set(key, arr);
    }
    return Array.from(mapa.entries()).map(([placa, tiquetes]) => {
      const totalVehiculo = tiquetes.reduce((s, t) => s + (t.valor ?? 0), 0);
      return {
        placa,
        marca: tiquetes[0]?.marca_vehi ?? null,
        origen: tiquetes[0]?.origen ?? null,
        destino: tiquetes[0]?.destino ?? null,
        cod_ruta: tiquetes[0]?.cod_ruta ?? 0,
        cantidad: tiquetes.length,
        total: totalVehiculo,
        tiquetes: [...tiquetes].sort(
          (a, b) => (a.hora_tiquete ?? '').localeCompare(b.hora_tiquete ?? '')
        ),
      };
    });
  }, [ventas]);

  // Resumen por forma de pago, desglosado por vehículo
  const porFormaPago = useMemo(() => {
    const formas: FormaPago[] = ['EFECTIVO', 'TARJETA', 'QR'];
    return formas.map((forma) => {
      const tiquetes = ventas.filter((v) => (v.forma_pago || 'EFECTIVO').toUpperCase() === forma);
      const total = tiquetes.reduce((s, t) => s + (t.valor ?? 0), 0);
      // Desglose por vehículo
      const porVehiculoArr = Array.from(
        tiquetes.reduce((m, t) => {
          const key = t.placa_vehi || 'SIN PLACA';
          const arr = m.get(key) ?? [];
          arr.push(t);
          m.set(key, arr);
          return m;
        }, new Map<string, VentaCajero[]>()).entries()
      ).map(([placa, arr]) => ({
        placa,
        cantidad: arr.length,
        total: arr.reduce((s, t) => s + (t.valor ?? 0), 0),
      }));
      return { forma, cantidad: tiquetes.length, total, porVehiculo: porVehiculoArr };
    });
  }, [ventas]);

  // Total general por forma de pago
  const totalGeneral = useMemo(
    () => porFormaPago.reduce((s, f) => s + f.total, 0),
    [porFormaPago]
  );

  const totalVentas = useMemo(
    () => ventas.reduce((s, t) => s + (t.valor ?? 0), 0),
    [ventas]
  );

  const ejecutarArqueo = () => {
    setCierreProcesado(true);
    toast.success("Arqueo cuadrado. Tirilla Z expedida.");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Card className="bg-white border-slate-200 shadow-sm p-6 space-y-4 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Arqueo y Bloqueo de Terminal</h3>
              <p className="text-xs text-slate-400 mt-0.5">Balance de cajero · lista tiquetes y resumen por vehículo y forma de pago.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={fecha}
              onChange={(e) => { if (e.target.value) setFecha(e.target.value); }}
              className="h-9 w-40 text-xs font-bold"
            />
            <Button variant="outline" size="sm" className="h-9 px-2" onClick={() => void cargarVentas(fecha)} title="Actualizar">
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border space-y-2 text-sm font-mono text-left">
          <div className="flex justify-between border-b pb-1 text-slate-500">
            <span>Monto Registrado:</span>
            <span className="font-bold text-slate-900">${total.toLocaleString('es-CO')}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Tiquetes del cajero ({fecha}):</span>
            <span className="font-bold text-slate-900">{ventas.length}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Total ventas del cajero:</span>
            <span className="font-bold text-emerald-600">${totalVentas.toLocaleString('es-CO')}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Estado Fiscal:</span>
            <span className="text-emerald-600 font-bold">CUADRADO (100%)</span>
          </div>
        </div>

        <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-10 shadow" disabled={cierreProcesado} onClick={ejecutarArqueo}>
          {cierreProcesado ? "TURNO CLAUSURADO" : "CONFIRMAR ARQUEO & IMPRIMIR TIRILLA Z"}
        </Button>
      </Card>

      {/* ── Informe ─────────────────────────────────────────────── */}
      {cargando ? (
        <Card className="bg-white border-slate-200 shadow-sm p-10 flex flex-col items-center gap-2 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="text-xs font-bold">Cargando ventas del cajero...</span>
        </Card>
      ) : error ? (
        <Card className="bg-white border-red-200 shadow-sm p-6 text-center">
          <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-xs text-red-600 font-semibold">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => void cargarVentas(fecha)}>
            <RefreshCcw className="w-3.5 h-3.5" /> Reintentar
          </Button>
        </Card>
      ) : ventas.length === 0 ? (
        <Card className="bg-white border-slate-200 shadow-sm p-10 text-center">
          <BarChart3 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-600">No hay tiquetes vendidos en esta fecha</p>
          <p className="text-xs text-slate-400 mt-1">Selecciona otra fecha o espera nuevas ventas.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* 1. Listado detallado de tiquetes */}
          <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Ticket className="w-4 h-4 text-emerald-600" /> Tiquetes generados ({ventas.length})
              </CardTitle>
              <CardDescription className="text-[11px]">Detalle por tiquete del cajero actual</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 bg-slate-50 border-y border-slate-200">
                    <th className="px-3 py-2 font-bold">#</th>
                    <th className="px-3 py-2 font-bold">Hora</th>
                    <th className="px-3 py-2 font-bold">Vehículo</th>
                    <th className="px-3 py-2 font-bold">Origen → Destino</th>
                    <th className="px-3 py-2 font-bold">Silla</th>
                    <th className="px-3 py-2 font-bold">Pasajero</th>
                    <th className="px-3 py-2 font-bold">Pago</th>
                    <th className="px-3 py-2 font-bold text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ventas.map((t, i) => (
                    <tr key={t.id_planilla} className="hover:bg-slate-50">
                      <td className="px-3 py-1.5 font-mono text-slate-500">{t.consecutivo_pasajero}</td>
                      <td className="px-3 py-1.5 font-mono">{t.hora_tiquete ?? '—'}</td>
                      <td className="px-3 py-1.5 font-bold">{t.placa_vehi ?? '—'}</td>
                      <td className="px-3 py-1.5">{t.origen ?? '—'} → {t.destino ?? '—'}</td>
                      <td className="px-3 py-1.5">{t.puesto}</td>
                      <td className="px-3 py-1.5">{t.pasajero?.nombre ?? '—'}</td>
                      <td className="px-3 py-1.5">
                        <Badge className={cn(
                          "text-[9px] font-bold border",
                          t.forma_pago === 'EFECTIVO' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                          t.forma_pago === 'TARJETA' && "bg-blue-50 text-blue-700 border-blue-200",
                          t.forma_pago === 'QR' && "bg-purple-50 text-purple-700 border-purple-200"
                        )}>
                          {t.forma_pago}
                        </Badge>
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono font-bold">${(t.valor ?? 0).toLocaleString('es-CO')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-200 font-black">
                    <td className="px-3 py-2" colSpan={7}>TOTAL</td>
                    <td className="px-3 py-2 text-right">${totalVentas.toLocaleString('es-CO')}</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

          {/* 2. Resumen consolidado por vehículo */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bus className="w-4 h-4 text-emerald-600" /> Resumen por vehículo
              </CardTitle>
              <CardDescription className="text-[11px]">Consolidado de tiquetes vendidos por vehículo</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 bg-slate-50 border-y border-slate-200">
                    <th className="px-3 py-2 font-bold">Vehículo</th>
                    <th className="px-3 py-2 font-bold">Ruta</th>
                    <th className="px-3 py-2 font-bold">Tramo</th>
                    <th className="px-3 py-2 font-bold text-center">Tiquetes</th>
                    <th className="px-3 py-2 font-bold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {porVehiculo.map((g) => (
                    <tr key={g.placa} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-bold">
                        {g.placa}
                        {g.marca ? <span className="font-normal text-slate-500"> · {g.marca}</span> : null}
                      </td>
                      <td className="px-3 py-2">Ruta {g.cod_ruta}</td>
                      <td className="px-3 py-2">{g.origen ?? '—'} → {g.destino ?? '—'}</td>
                      <td className="px-3 py-2 text-center font-black">{g.cantidad}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold">${g.total.toLocaleString('es-CO')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-200 font-black">
                    <td className="px-3 py-2" colSpan={3}>TOTAL GENERAL</td>
                    <td className="px-3 py-2 text-center">{porVehiculo.reduce((s, g) => s + g.cantidad, 0)}</td>
                    <td className="px-3 py-2 text-right">${totalGeneral.toLocaleString('es-CO')}</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

          {/* 3. Informe por forma de pago (resumido por vehículo) */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" /> Informe por forma de pago
              </CardTitle>
              <CardDescription className="text-[11px]">Resumen de cada forma de pago desglosado por vehículo</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 bg-slate-50 border-y border-slate-200">
                    <th className="px-3 py-2 font-bold">Forma de pago</th>
                    <th className="px-3 py-2 font-bold">Vehículo</th>
                    <th className="px-3 py-2 font-bold text-center">Tiquetes</th>
                    <th className="px-3 py-2 font-bold text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {porFormaPago.filter((f) => f.cantidad > 0).map((f) =>
                    f.porVehiculo.map((pv, idx) => (
                      <tr key={`${f.forma}-${pv.placa}`} className="hover:bg-slate-50">
                        {idx === 0 && (
                          <td className="px-3 py-2 align-top font-black" rowSpan={f.porVehiculo.length}>
                            {FORMA_PAGO_LABEL[f.forma]}
                          </td>
                        )}
                        <td className="px-3 py-2 font-bold">{pv.placa}</td>
                        <td className="px-3 py-2 text-center font-black">{pv.cantidad}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold">${pv.total.toLocaleString('es-CO')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-200 font-black">
                    <td className="px-3 py-2" colSpan={3}>TOTAL GENERAL POR FORMA DE PAGO</td>
                    <td className="px-3 py-2 text-right">${totalGeneral.toLocaleString('es-CO')}</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

          {/* 4. Informe general: cantidad de pasajes por vehículo */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> Cantidad de pasajes por vehículo
              </CardTitle>
              <CardDescription className="text-[11px]">Pasajes vendidos (cantidad) por vehículo</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {porVehiculo.map((g) => (
                  <div key={g.placa} className="flex items-center justify-between px-3 py-2 text-xs">
                    <span className="font-bold">{g.placa}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">{g.cantidad} pasaje(s)</span>
                      <Progress value={porVehiculo.length ? (g.cantidad / Math.max(...porVehiculo.map((x) => x.cantidad))) * 100 : 0} className="w-24 h-1.5" />
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 text-xs font-black">
                  <span>TOTAL</span>
                  <span>{porVehiculo.reduce((s, g) => s + g.cantidad, 0)} pasaje(s)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. Total general por forma de pago */}
          <Card className="bg-white border-emerald-200 shadow-sm">
            <CardContent className="p-4">
              <h4 className="text-xs font-black text-slate-700 mb-2">TOTAL GENERAL POR FORMA DE PAGO</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {porFormaPago.filter((f) => f.cantidad > 0).map((f) => (
                  <div key={f.forma} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {f.forma === 'EFECTIVO' && <Banknote className="w-4 h-4 text-emerald-600" />}
                      {f.forma === 'TARJETA' && <CreditCard className="w-4 h-4 text-blue-600" />}
                      {f.forma === 'QR' && <QrCode className="w-4 h-4 text-purple-600" />}
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">{FORMA_PAGO_LABEL[f.forma]}</p>
                        <p className="text-[10px] text-slate-400">{f.cantidad} tiquete(s)</p>
                      </div>
                    </div>
                    <span className="font-mono font-black text-slate-900">${f.total.toLocaleString('es-CO')}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <span className="text-xs font-black text-emerald-800">TOTAL GENERAL</span>
                <span className="font-mono font-black text-emerald-700">${totalGeneral.toLocaleString('es-CO')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}