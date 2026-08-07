import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { travelsoftService, formatHora, DashboardCajeroData, VehiculoEstado, EnTransitoItem, OridesOption, ConductorOption, VehiculoOption, SillasData, TicketVenta, FormaPago, EstadoImpresora, EstadoSitio, ESTADO_SITIO_LABEL, RutaTipoOption, VentaCajero } from '@/services/travelsoftService';
import { useTicketFiscal } from '@/hooks/useTicketFiscal';
import { manifiestoListadoTexto, manifiestoTotalesTexto } from '@/services/ticketFiscalService';
import { hoyISO, FORMA_PAGO_LABEL } from '@/stores/turnoSateliteStore';
import { detectarImpresoraBle, imprimirTestBle, imprimirTestRawBt, isAndroidDevice, soportaBluetoothEscPos, obtenerImpresoraBlePredeterminada, limpiarImpresoraBlePredeterminada, obtenerImpresoraPdaGuardada, impresoraPdaFijada, guardarImpresoraPda } from '@/utils/ticketFormatter';
import { esDispositivoSunmi, imprimirTestSunmi, validarImpresoraSunmi, reiniciarCacheSunmi, IMPRESORA_INTEGRADA_LABEL } from '@/services/sunmiPrinter';
import { imprimirTestPdaWs, servicioPdaDisponible, PDA_WS_LABEL, reiniciarCachePda } from '@/services/pdaWebSocketService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from '@/lib/utils';
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
  Menu, X, Printer,
} from 'lucide-react';
import { toast } from 'sonner';

type CajeroSection = 'inicio' | 'ventas' | 'reservas' | 'informes' | 'cierre' | 'despacho' | 'llegadas';

export default function CajeroDashboard() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<CajeroSection>('inicio');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [testeandoImpresora, setTesteandoImpresora] = useState(false);
  const [impresoraPredeterminada, setImpresoraPredeterminada] = useState<string | null>(() =>
    obtenerImpresoraPdaGuardada()
      ?? (esDispositivoSunmi()
        ? IMPRESORA_INTEGRADA_LABEL
        : isAndroidDevice() || soportaBluetoothEscPos()
          ? obtenerImpresoraBlePredeterminada()?.nombre ?? null
          : null)
  );
  const [impresoraFijada, setImpresoraFijada] = useState<boolean>(() =>
    impresoraPdaFijada()
  );

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

  const getIniciales = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  };

  // Items de navegación (reutilizables en sidebar desktop y drawer móvil)
  const navItems: { id: CajeroSection; label: string; icon: React.ReactNode }[] = useMemo(() => [
    { id: 'inicio', label: 'Inicio / Resumen Diario', icon: <BarChart3 className="w-5 h-5" /> },
    ...(dashboard?.tipo_agencia === 'principal'
      ? [
          { id: 'despacho' as CajeroSection, label: 'Despacho de Vehículos', icon: <Send className="w-5 h-5" /> },
          { id: 'llegadas' as CajeroSection, label: 'Llegadas a la Agencia', icon: <MapPin className="w-5 h-5" /> },
        ]
      : []),
    { id: 'ventas', label: 'Taquilla de Ventas', icon: <Ticket className="w-5 h-5" /> },
    { id: 'reservas', label: 'Control de Reservas', icon: <CalendarDays className="w-5 h-5" /> },
    { id: 'informes', label: 'Informes y Métricas', icon: <ArrowUpRight className="w-5 h-5" /> },
    { id: 'cierre', label: 'Cierre de Cajero', icon: <Coins className="w-5 h-5" /> },
  ], [dashboard?.tipo_agencia]);

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

  // Validar y testear impresora local de la PDA
  const handleTestImpresora = useCallback(async () => {
    // En la PDA Android la impresión directa (sin diálogos) se intenta así:
    //   1) Servicio Web Socket local (app "PDA Print Service") — prioridad.
    //   2) Impresora integrada Sun (plugin JS USDK).
    //   3) RawBT (SPP) — alcanza a "InnerPrinter" (SPP, no alcanzable por BLE).
    if (esDispositivoSunmi() || isAndroidDevice()) {
      setTesteandoImpresora(true);
      try {
        // 1) Servicio local WebSocket
        reiniciarCachePda();
        const pdaOk = await servicioPdaDisponible();
        if (pdaOk) {
          const r = await imprimirTestPdaWs();
          if (r.ok) {
            setImpresoraPredeterminada(PDA_WS_LABEL);
            guardarImpresoraPda(PDA_WS_LABEL, true);
            setImpresoraFijada(true);
            toast.success(`Ticket de prueba impreso en "${r.dispositivo}".`);
          }
          return;
        }

        // 2) Impresora integrada (plugin JS USDK)
        const disponible = await validarImpresoraSunmi();
        if (disponible) {
          const result = await imprimirTestSunmi();
          if (result.ok) {
            setImpresoraPredeterminada(IMPRESORA_INTEGRADA_LABEL);
            guardarImpresoraPda(IMPRESORA_INTEGRADA_LABEL, true);
            setImpresoraFijada(true);
            toast.success(`Ticket de prueba impreso en "${result.dispositivo}".`);
          }
          return;
        }

        // 3) RawBT (SPP/InnerPrinter)
        setImpresoraPredeterminada(IMPRESORA_INTEGRADA_LABEL);
        guardarImpresoraPda(IMPRESORA_INTEGRADA_LABEL, true);
        setImpresoraFijada(true);
        imprimirTestRawBt();
        toast.info(
          'Prueba enviada por Bluetooth (InnerPrinter). Si se abrió la Play Store, instale la app RawBT y vuelva a probar.',
          { duration: 7000 }
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al validar la impresora local.');
      } finally {
        setTesteandoImpresora(false);
      }
      return;
    }

    // Escritorio: validación a través de Web Bluetooth
    if (!soportaBluetoothEscPos()) {
      toast.error('Este navegador no soporta impresión en local (Bluetooth).');
      return;
    }
    setTesteandoImpresora(true);
    try {
      // 2) Detectar impresora emparejada
      const deteccion = await detectarImpresoraBle();
      toast(deteccion.mensaje);
      // 3) Actualizar estado de predeterminada
      setImpresoraPredeterminada(deteccion.impresoraConectada && deteccion.dispositivo
        ? deteccion.dispositivo
        : (obtenerImpresoraBlePredeterminada()?.nombre ?? null));
      // 4) Si está conectada, imprimir ticket de prueba
      if (deteccion.impresoraConectada) {
        const result = await imprimirTestBle();
        if (result.ok) {
          toast.success(`Ticket de prueba impreso en "${result.dispositivo ?? 'Impresora Térmica'}".`);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al validar impresora.');
    } finally {
      setTesteandoImpresora(false);
    }
  }, []);

  // Limpiar la impresora predeterminada guardada (bloqueado si está fijada)
  const handleLimpiarImpresora = useCallback(() => {
    if (impresoraFijada) {
      toast.error('La impresora está configurada y no se puede eliminar.');
      return;
    }
    limpiarImpresoraBlePredeterminada();
    reiniciarCacheSunmi();
    setImpresoraPredeterminada(null);
    toast.info('Impresora predeterminada eliminada. Se pedirá seleccionar una nueva.');
  }, [impresoraFijada]);

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
            {/* Botón test impresora: visible en PDA Sunmi / Android / BLE */}
            {(esDispositivoSunmi() || isAndroidDevice() || soportaBluetoothEscPos()) && (
              <div className="flex items-center gap-1.5">
                {impresoraPredeterminada && !esDispositivoSunmi() && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-10 px-2 gap-1 text-[9px] font-bold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 touch-list"
                    onClick={() => void handleLimpiarImpresora()}
                    disabled={impresoraFijada}
                    title={impresoraFijada
                      ? 'Impresora configurada (no se puede eliminar)'
                      : 'Quitar impresora predeterminada'}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {impresoraPredeterminada.length > 12
                      ? impresoraPredeterminada.slice(0, 12) + '…'
                      : impresoraPredeterminada}
                  </Button>
                )}
                {impresoraPredeterminada && esDispositivoSunmi() && (
                  <span
                    className="h-10 px-2 inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 border border-emerald-200 bg-emerald-50 rounded-md"
                    title={`Impresora integrada activa (${IMPRESORA_INTEGRADA_LABEL})`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {impresoraPredeterminada.length > 12
                      ? impresoraPredeterminada.slice(0, 12) + '…'
                      : impresoraPredeterminada}
                  </span>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 px-2 gap-1 text-[9px] font-bold text-slate-600 border-slate-300 hover:bg-slate-100 touch-list"
                  onClick={() => void handleTestImpresora()}
                  disabled={testeandoImpresora}
                  title="Validar impresora local de la PDA"
                >
                  {testeandoImpresora ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                  Test Impresora
                </Button>
              </div>
            )}
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
                return <SubViewInicio setSeccion={setActiveSection} total={totalCajaTurno} dashboard={dashboard} loading={loadingDashboard} onRetry={cargarDashboard} />;
              case 'despacho':
                return <SubViewDespacho onVenderTicket={(v) => { setVentaInicial(v); setActiveSection('ventas'); }} />;
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
                return <SubViewInicio setSeccion={setActiveSection} total={totalCajaTurno} dashboard={dashboard} loading={loadingDashboard} onRetry={cargarDashboard} />;
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
  total, setSeccion, dashboard, loading, onRetry,
}: {
  total: number;
  setSeccion: (s: CajeroSection) => void;
  dashboard: DashboardCajeroData | null;
  loading: boolean;
  onRetry: () => void;
}) {
  const resumen = dashboard?.resumen;
  const vehiculos = dashboard?.vehiculos;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Resumen General del Día</h2>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">En Plataforma</span>
                  <h3 className="text-xl font-black text-slate-900">{resumen.en_plataforma}</h3>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Bus className="w-5 h-5" /></div>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Próximos a Salir</span>
                  <h3 className="text-xl font-black text-slate-900">{resumen.proximos}</h3>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 text-white border-none shadow-md">
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Despachados (Salió)</span>
                  <h3 className="text-xl font-black text-emerald-400">{resumen.despachados}</h3>
                </div>
                <div className="p-3 bg-slate-800 text-emerald-400 rounded-xl"><ArrowUpRight className="w-5 h-5" /></div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ListaVehiculos
              titulo="En Plataforma"
              descripcion="Vendiendo tiquetes (habilitadas)"
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

      <Card className="bg-gradient-to-br from-slate-950 to-slate-900 text-white p-6 border-none rounded-2xl shadow-lg">
        <h3 className="font-bold text-sm mb-1">¿Listo para atender un cliente?</h3>
        <p className="text-xs text-slate-400 max-w-lg mb-4">Despache pasajes de forma inmediata vinculando croquis de sillas y facturación XML directa ante la DIAN.</p>
        <Button onClick={() => setSeccion('ventas')} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
          Ir a Taquilla de Ventas
        </Button>
      </Card>
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
                    {v.placa_vehi || "SIN PLACA"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {v.destino || "—"}
                    {v.conductor ? ` · ${v.conductor}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-bold text-slate-600 font-mono">
                    {v.hora_despacho || formatHora(v.hora_ruta)}
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
function SubViewDespacho({ onVenderTicket }: { onVenderTicket: (v: VehiculoEstado) => void }) {
  const [dashboard, setDashboard] = useState<DashboardCajeroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [despachando, setDespachando] = useState<number | null>(null);
  const [imprimiendo, setImprimiendo] = useState<number | null>(null);
  const [dialogoNuevaRuta, setDialogoNuevaRuta] = useState(false);
  const { imprimirTexto } = useTicketFiscal();

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      setDashboard(await travelsoftService.getDashboardCajero());
    } catch (err) {
      setDashboard(null);
      console.error('Error al cargar rutas para despacho:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const despachables = useMemo(() => {
    const v = dashboard?.vehiculos;
    if (!v) return [];
    return [...v.en_plataforma, ...v.proximos].sort(
      (a, b) => (a.hora_ruta ?? 0) - (b.hora_ruta ?? 0)
    );
  }, [dashboard]);

  const placasConRutaHoy = useMemo(() => {
    const v = dashboard?.vehiculos;
    const placas = new Set<string>();
    if (!v) return placas;
    [...v.en_plataforma, ...v.proximos, ...v.despachados].forEach((x) => {
      if (x.placa_vehi) placas.add(x.placa_vehi);
    });
    return placas;
  }, [dashboard]);

  const handleDespachar = async (v: VehiculoEstado) => {
    setDespachando(v.cod_ruta);
    try {
      const res = await travelsoftService.despacharVehiculo(v.cod_ruta, v.fecha_ruta ?? undefined);
      toast.success(`Vehículo ${v.placa_vehi || v.cod_ruta} despachado${res?.hora_despacho ? ` a las ${res.hora_despacho}` : ""}.`);
      await cargar();
      void imprimirManifiesto(v);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al despachar el vehículo.");
    } finally {
      setDespachando(null);
    }
  };

  const imprimirManifiesto = async (v: VehiculoEstado) => {
    setImprimiendo(v.cod_ruta);
    try {
      const manifiesto = await travelsoftService.getManifiestoDespacho(v.cod_ruta, v.fecha_ruta ?? undefined);
      if (!manifiesto) {
        toast.error("No se pudo obtener el manifiesto de despacho.");
        return;
      }
      toast.loading("Imprimiendo listado de pasajeros...", { id: `mani-${v.cod_ruta}` });
      const r1 = await imprimirTexto(manifiestoListadoTexto(manifiesto));
      toast.dismiss(`mani-${v.cod_ruta}`);
      toast.loading("Imprimiendo documento de despacho...", { id: `mani2-${v.cod_ruta}` });
      await imprimirTexto(manifiestoTotalesTexto(manifiesto));
      toast.dismiss(`mani2-${v.cod_ruta}`);
      toast.success(`Manifiesto impreso${r1 ? ` (${r1})` : ""}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo imprimir el manifiesto.");
    } finally {
      setImprimiendo(null);
    }
  };

  const confirmarDespacho = (v: VehiculoEstado) => {
    toast(`Despachar ${v.placa_vehi || "vehículo"} hacia ${v.destino || "destino"}?`, {
      action: {
        label: "Despachar",
        onClick: () => void handleDespachar(v),
      },
    });
  };

  if (loading) {
    return (
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-6 sm:p-8 flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
          <span className="text-xs font-bold tracking-wide">Cargando rutas del día...</span>
        </CardContent>
      </Card>
    );
  }

  if (!dashboard) {
    return (
      <Card className="bg-white border-rose-200 shadow-sm">
        <CardContent className="p-6 sm:p-8 flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
          <div>
            <h3 className="text-sm font-black text-slate-900">No se pudieron cargar las rutas</h3>
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
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Despacho de Vehículos</h2>
          <p className="text-xs text-slate-500">
            Seleccione el vehículo listo en andén para marcar su salida hacia el destino.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px] font-bold">
            {despachables.length} por despachar
          </Badge>
          <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] gap-1.5" onClick={() => setDialogoNuevaRuta(true)}>
            <Plus className="w-3.5 h-3.5" /> Adicionar Ruta
          </Button>
        </div>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-bold uppercase text-emerald-600">Rutas del Día</CardTitle>
          <CardDescription className="text-[11px]">Vehiculos habilitados y programados para salir hoy.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {despachables.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">No hay vehículos pendientes de despacho.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {despachables.map((v) => (
                <div key={v.cod_ruta} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className={cn(
                        "p-2.5 rounded-xl shrink-0",
                        v.habilitada_ruta === "1" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                      )}>
                        <Bus className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 font-mono truncate">{v.placa_vehi || "SIN PLACA"}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {v.destino || "—"}
                          {v.conductor ? ` · ${v.conductor}` : ""}
                        </p>
                      </div>
                    </div>
                    <Badge className={cn(
                      "text-[10px] font-bold border shrink-0",
                      v.habilitada_ruta === "1"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-amber-100 text-amber-800 border-amber-200"
                    )}>
                      {v.habilitada_ruta === "1" ? "En plataforma" : "Programada"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 font-mono">{formatHora(v.hora_ruta)}</span>
                    <span className="flex items-center gap-3">
                      {v.capacidad ? (
                        <span className="text-slate-500 flex items-center gap-1">
                          <Armchair className="w-3 h-3" /> {v.capacidad}
                        </span>
                      ) : null}
                      <span className="flex items-center gap-1 font-bold text-emerald-700">
                        <Ticket className="w-3 h-3" /> {v.tickets_vendidos ?? 0} vendidos
                      </span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <Button
                      size="sm"
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] gap-1.5"
                      disabled={despachando === v.cod_ruta || imprimiendo === v.cod_ruta}
                      onClick={() => confirmarDespacho(v)}
                    >
                      {despachando === v.cod_ruta ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : imprimiendo === v.cod_ruta ? <Printer className="w-3.5 h-3.5 animate-pulse" /> : <Send className="w-3.5 h-3.5" />}
                      {imprimiendo === v.cod_ruta ? "Imprimiendo..." : "Despachar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold text-[11px] gap-1.5"
                      onClick={() => onVenderTicket(v)}
                    >
                      <Ticket className="w-3.5 h-3.5" /> Vender Ticket
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {dialogoNuevaRuta && (
        <NuevaRutaDialog
          open={dialogoNuevaRuta}
          onOpenChange={setDialogoNuevaRuta}
          idOrigen={dashboard.id_orides}
          nombreOrigen={dashboard.agencia ?? 'Agencia'}
          placasConRutaHoy={placasConRutaHoy}
          onCreada={() => void cargar()}
        />
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
  const [conductores, setConductores] = useState<ConductorOption[]>([]);
  const [vehiculos, setVehiculos] = useState<VehiculoOption[]>([]);
  const [tiposServicio, setTiposServicio] = useState<RutaTipoOption[]>([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [destino, setDestino] = useState('');
  const [horaSalida, setHoraSalida] = useState('');
  const [placa, setPlaca] = useState('');
  const [tipoServicio, setTipoServicio] = useState('');
  const [conductor, setConductor] = useState('');
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [conductorAux, setConductorAux] = useState('');
  const [auxiliarViaje, setAuxiliarViaje] = useState('');
  const [conduce, setConduce] = useState('');

  const cargarCatalogos = useCallback(async () => {
    setCargandoCatalogos(true);
    try {
      const [o, c, v] = await Promise.all([
        travelsoftService.getOrides(),
        travelsoftService.getConductores(),
        travelsoftService.getVehiculosDropdown(),
      ]);
      setOrides(o);
      setConductores(c.filter((x) => (x.estado_conduc ?? '1') === '1'));
      setVehiculos(v.filter((x) => (x.estado_vehi ?? '1') === '1'));
      setTiposServicio(await travelsoftService.getRutasTipos());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudieron cargar los catálogos.');
    } finally {
      setCargandoCatalogos(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setMostrarErrores(false);
      void cargarCatalogos();
    }
  }, [open, cargarCatalogos]);

  const destinoOptions = useMemo(
    () => orides.filter((o) => o.id_orides !== idOrigen && (o.desc_orides || '').trim()),
    [orides, idOrigen]
  );

  const vehiculosDisponibles = useMemo(
    () => vehiculos.filter((v) => !placasConRutaHoy.has(v.placa_vehi)),
    [vehiculos, placasConRutaHoy]
  );

  useEffect(() => {
    if (placa && !vehiculosDisponibles.some((v) => v.placa_vehi === placa)) {
      setPlaca('');
    }
  }, [vehiculosDisponibles, placa]);

  const horaAMinutos = (value: string): number => {
    const [h, m] = value.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return 0;
    return h * 60 + m;
  };

  const erroresRuta = useMemo<string[]>(() => {
    const e: string[] = [];
    if (!destino) e.push('Seleccione el destino.');
    if (!horaSalida) e.push('Ingrese la hora de salida.');
    if (!placa) e.push('Seleccione el vehículo.');
    if (!conduce.trim()) e.push('Debe asignar el número de conduce.');
    return e;
  }, [destino, horaSalida, placa, conduce]);

  const handleGuardar = async () => {
    if (erroresRuta.length > 0) {
      setMostrarErrores(true);
      toast.error(erroresRuta[0]);
      return;
    }
    setMostrarErrores(false);

    setGuardando(true);
    try {
      const res = await travelsoftService.crearRuta({
        destino_ruta: Number(destino),
        hora_ruta: horaAMinutos(horaSalida),
        hora_programada: horaSalida || undefined,
        placa_vehi: placa,
        id_ruta_tipo: tipoServicio ? Number(tipoServicio) : undefined,
        cedula_conduc: conductor || undefined,
        cedula_conduc2: conductorAux || undefined,
        cedula_auxi: auxiliarViaje || undefined,
        conduce_ruta: conduce.trim().toUpperCase() || undefined,
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
              <Label className="text-[11px] font-bold text-slate-600">Hora de salida</Label>
              <Input
                type="time"
                value={horaSalida}
                onChange={(e) => setHoraSalida(e.target.value)}
                className={cn(mostrarErrores && !horaSalida && "border-red-400 ring-1 ring-red-300 bg-red-50")}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-600">Vehículo</Label>
              <Select value={placa} onValueChange={setPlaca}>
                <SelectTrigger className={cn(mostrarErrores && !placa && "border-red-400 ring-1 ring-red-300 bg-red-50")}>
                  <SelectValue placeholder="Seleccione el vehículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehiculosDisponibles.length === 0 && (
                    <div className="px-3 py-2 text-xs text-slate-400 italic">Todos los vehículos ya tienen ruta hoy.</div>
                  )}
                  {vehiculosDisponibles.map((v) => (
                    <SelectItem key={v.placa_vehi} value={v.placa_vehi}>
                      {v.placa_vehi}{v.marca_vehi ? ` · ${v.marca_vehi}` : ''}{v.modelo_vehi ? ` ${v.modelo_vehi}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {placasConRutaHoy.size > 0 && (
                <p className="text-[10px] text-slate-400">Se ocultan los vehículos que ya tienen ruta creada hoy.</p>
              )}
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
              <Select value={conductor} onValueChange={setConductor}>
                <SelectTrigger><SelectValue placeholder="Seleccione el conductor" /></SelectTrigger>
                <SelectContent>
                  {conductores.map((c) => (
                    <SelectItem key={c.cedula_conduc} value={c.cedula_conduc}>
                      {c.nombre_conduc} ({c.cedula_conduc})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-600">Conductor auxiliar <span className="text-slate-400 font-normal">(opcional)</span></Label>
              <Select value={conductorAux} onValueChange={(v) => setConductorAux(v === '__none__' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Ninguno" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Ninguno</SelectItem>
                  {conductores.map((c) => (
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
                  {conductores.map((c) => (
                    <SelectItem key={c.cedula_conduc} value={c.cedula_conduc}>
                      {c.nombre_conduc} ({c.cedula_conduc})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-600">N° Conduce <span className="text-red-500">*</span> <span className="text-slate-400 font-normal">(documento de tránsito exigido al conductor)</span></Label>
              <Input
                value={conduce}
                onChange={(e) => setConduce(e.target.value)}
                placeholder="Ej: 120000345"
                className={cn(mostrarErrores && !conduce.trim() && "border-red-400 ring-1 ring-red-300 bg-red-50")}
              />
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
    const hh = ahora.getHours().toString().padStart(2, "0");
    const mm = ahora.getMinutes().toString().padStart(2, "0");
    setFechaLlegada(ahora.toISOString().slice(0, 10));
    setHora(`${hh}:${mm}`);
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
                        <p className="text-xs font-black text-slate-900 font-mono truncate">{v.placa_vehi || "SIN PLACA"}</p>
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
                        <p className="text-xs font-black text-slate-900 font-mono truncate">{v.placa_vehi || "SIN PLACA"}</p>
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
  const [dashboard, setDashboard] = useState<DashboardCajeroData | null>(null);
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
      setDashboard(await travelsoftService.getDashboardCajero());
    } catch {
      setDashboard(null);
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  useEffect(() => {
    void cargarDashboard();
  }, [cargarDashboard]);

  const porDespachar = useMemo(() => {
    const v = dashboard?.vehiculos;
    if (!v) return [];
    return [...v.en_plataforma, ...v.proximos].sort(
      (a, b) => (a.hora_ruta ?? 0) - (b.hora_ruta ?? 0)
    );
  }, [dashboard]);

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
        void imprimirTicket(ticket);
        reiniciar();
      }, 400);
      return () => window.clearTimeout(t);
    }
  }, [ticket, imprimirTicket, reiniciar]);

  const formasPago: { id: FormaPago; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'EFECTIVO', label: 'Efectivo', desc: 'Pago en caja', icon: <Banknote className="w-5 h-5" /> },
    { id: 'TARJETA', label: 'Tarjeta', desc: 'Débito / crédito', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'QR', label: 'Código QR', desc: 'Pago por QR', icon: <QrCode className="w-5 h-5" /> },
  ];

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
      });

      // Modo de impresión según parámetro de la compañía:
      //  - "un tiquete por silla" (por defecto): cada silla se imprime por separado.
      //  - "tiquete consolidado": un solo tiquete con todas las sillas.
      if (venta.consolidado) {
        // Emisión fiscal ante la DIAN (CUFE + QR). Si el Core no responde,
        // el tiquete se imprime igualmente con la numeración de la resolución local.
        const ticketFinal = await emitirConDian(venta.data, (msg) => toast.warning(msg));
        setTicket(ticketFinal);
        if (venta.total) setTotalCaja((p) => p + venta.total);
        toast.success(`${venta.cantidad} tiquete(s) generados, imprimiendo...`);
      } else {
        // Un tiquete por cada silla vendida.
        for (const t of venta.tiquetes) {
          const ticketFinal = await emitirConDian(t, (msg) => toast.warning(msg));
          void imprimirTicket(ticketFinal);
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

  if (!dashboard) {
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
        {/* 1. Vehículo por despachar */}
        <Card className={cn("bg-white shadow-sm", mostrarErrores && !vehiculoSel ? "border-red-400 ring-1 ring-red-300" : "border-slate-200")}>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold uppercase text-emerald-600">1. Vehículo por Despachar</CardTitle>
            <CardDescription className="text-[11px]">Seleccione el vehículo en plataforma o programado.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {          porDespachar.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-dashed text-xs text-slate-400 italic text-center">
                No hay vehículos por despachar hoy.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {porDespachar.map((r) => {
                  const activo = vehiculoSel?.cod_ruta === r.cod_ruta;
                  const enPlataforma = (r.habilitada_ruta ?? '0') === '1';
                  return (
                    <button
                      key={r.cod_ruta}
                      type="button"
                      onClick={() => handleSeleccionarVehiculo(r.cod_ruta)}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-all min-h-[72px] sm:min-h-[80px] touch-list",
                        activo
                          ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20"
                          : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-slate-900 font-mono">{r.placa_vehi || 'SIN PLACA'}</span>
                        <Badge
                          className={cn(
                            "text-[9px] font-bold border",
                            enPlataforma
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-amber-100 text-amber-800 border-amber-200"
                          )}
                        >
                          {enPlataforma ? 'EN PLATAFORMA' : 'PROGRAMADO'}
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
                    </button>
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
              disabled={generando}
              onClick={() => void handleGenerar()}
            >
              {generando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
              GENERAR TICKET DE VENTA
            </Button>

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