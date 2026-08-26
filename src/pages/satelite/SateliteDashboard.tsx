import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  travelsoftService,
  formatHora,
  getDashboardPorNivel,
  SateliteDashboardData,
  SateliteVehiculo,
  SateliteSegmento,
  TurnoSateliteVenta,
  TicketVenta,
  SillasData,
  FormaPago,
  EstadoImpresora,
  EstadoVehiculoSatelite,
} from '@/services/travelsoftService';
import { useTicketFiscal } from '@/hooks/useTicketFiscal';
import { servicioPdaDisponible } from '@/services/pdaWebSocketService';
import { isAndroidDevice, soportaBluetoothEscPos } from '@/utils/ticketFormatter';
import { esDispositivoSunmi } from '@/services/sunmiPrinter';
import {
  cargarTurno,
  guardarTurno,
  limpiarTurno,
  totalTurno as totalTurnoCompute,
  desglosePorFormaPago,
  hoyISO,
  FORMA_PAGO_LABEL,
  type TurnoSatelite,
} from '@/stores/turnoSateliteStore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import {
  Bus, Clock, Ticket, LogOut, User, MapPin, Armchair,
  Loader2, AlertTriangle, RefreshCcw, Banknote, CreditCard,
  QrCode, CheckCircle2, Printer, ChevronLeft, Coins, X, Phone, Mail,
  CalendarDays, History,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { horaColombiaCorta } from '@/utils/tiempo';

export default function SateliteDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [turno, setTurno] = useState<TurnoSatelite | null>(cargarTurno);
  const [ahora, setAhora] = useState(() => new Date());

  const [dashboard, setDashboard] = useState<SateliteDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorRed, setErrorRed] = useState<string | null>(null);

  const [vista, setVista] = useState<'en_ruta' | 'despachados'>('en_ruta');
  const [despachados, setDespachados] = useState<SateliteDashboardData | null>(null);
  const [cargandoDespachados, setCargandoDespachados] = useState(false);

  const [vehiculoSel, setVehiculoSel] = useState<SateliteVehiculo | null>(null);
  const [segmento, setSegmento] = useState<SateliteSegmento | null>(null);

  const [sillas, setSillas] = useState<SillasData | null>(null);
  const [cargandoSillas, setCargandoSillas] = useState(false);
  const [vehiculosArrivados, setVehiculosArrivados] = useState<Set<number>>(new Set());
  const [puestosSel, setPuestosSel] = useState<number[]>([]);

  const [documento, setDocumento] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [buscandoPasajero, setBuscandoPasajero] = useState(false);
  const [pasajeroExiste, setPasajeroExiste] = useState(false);
  const [formaPago, setFormaPago] = useState<FormaPago>('EFECTIVO');
  const [valor, setValor] = useState('');
  const [generando, setGenerando] = useState(false);

  // Impresión 100% local: no se genera tiquete sin una impresora local
  // disponible (servicio WS en el equipo, o impresora integrada/Bluetooth en la PDA).
  const [impresoraLocalLista, setImpresoraLocalLista] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let ok = await servicioPdaDisponible();
      if (!ok && isAndroidDevice()) {
        ok = esDispositivoSunmi() || soportaBluetoothEscPos();
      }
      if (!cancelled) setImpresoraLocalLista(ok);
    })();
    return () => { cancelled = true; };
  }, []);

  const [impresoraInfo, setImpresoraInfo] = useState<EstadoImpresora | null>(null);
  const [cierreAbierto, setCierreAbierto] = useState(false);
  const [listaTiquetesAbierta, setListaTiquetesAbierta] = useState(false);
  const [guardandoCierre, setGuardandoCierre] = useState(false);

  const [fechaSel, setFechaSel] = useState(hoyISO);

  const nombreAgencia = String(user?.agencia ?? '') || dashboard?.agencia || 'Agencia Satélite';
  const nombreOperador = turno?.operador || user?.nombreCompleto || user?.nombre || 'Operador';

  // Reloj del terminal (PDA)
  useEffect(() => {
    const t = window.setInterval(() => setAhora(new Date()), 30000);
    return () => window.clearInterval(t);
  }, []);

  const cargarDashboard = useCallback(async (fecha?: string) => {
    setLoading(true);
    setErrorRed(null);
    try {
      const data = await travelsoftService.getDashboardSatelite(fecha ?? undefined);
      setDashboard(data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        toast.error('Esta cuenta no pertenece a una agencia satélite.');
        navigate(getDashboardPorNivel(user ?? {}), { replace: true });
        return;
      }
      setErrorRed(err instanceof Error ? err.message : 'No se pudieron cargar los vehículos.');
    } finally {
      setLoading(false);
    }
  }, [navigate, user]);

  const cargarDespachados = useCallback(async (fecha?: string) => {
    setCargandoDespachados(true);
    try {
      const data = await travelsoftService.getDespachosSatelite(fecha ?? undefined);
      setDespachados(data);
    } catch {
      setDespachados(null);
    } finally {
      setCargandoDespachados(false);
    }
  }, []);

  const despacharSalida = async (cod_ruta: number) => {
    try {
      await travelsoftService.despacharSalidaSatelite(cod_ruta, fechaSel);
      toast.success('Salida del satélite registrada.');
      void cargarDashboard(fechaSel);
      if (vista === 'despachados') void cargarDespachados(fechaSel);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo registrar la salida.');
    }
  };

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

  useEffect(() => {
    if (turno) void cargarDashboard(fechaSel);
  }, [turno, cargarDashboard, fechaSel]);

  useEffect(() => {
    if (turno && vista === 'despachados') void cargarDespachados(fechaSel);
  }, [turno, vista, fechaSel, cargarDespachados]);

   // ─── Turno ────────────────────────────────────────────────────────────────
   // El operador ya no se pide al usuario: se toma del usuario autenticado.
   const iniciarTurno = () => {
    const nuevo: TurnoSatelite = { operador: nombreOperador, inicio: new Date().toISOString(), ventas: [] };
    guardarTurno(nuevo);
    setTurno(nuevo);
    toast.success(`Turno iniciado. Bienvenido(a), ${nombreOperador}.`);
  };

  const cerrarTurno = async () => {
    if (!turno) return;
    setGuardandoCierre(true);
    try {
      const porForma = desglosePorFormaPago(turno.ventas);
      await travelsoftService.cerrarTurnoSatelite({
        operador: turno.operador,
        inicio: turno.inicio,
        cierre: new Date().toISOString(),
        tiquetes: turno.ventas.length,
        total: totalTurnoCompute(turno.ventas),
        efectivo: porForma.EFECTIVO,
        tarjeta: porForma.TARJETA,
        qr: porForma.QR,
        ventas: turno.ventas,
      });
      limpiarTurno();
      setTurno(null);
      setVehiculoSel(null);
      setSegmento(null);
      setSillas(null);
      setCierreAbierto(false);
      setListaTiquetesAbierta(false);
      toast.success('Turno cerrado. Resumen guardado en el servidor.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar el cierre en el servidor.');
    } finally {
      setGuardandoCierre(false);
    }
  };

  const totalTurno = useMemo(
    () => totalTurnoCompute(turno?.ventas || []),
    [turno]
  );

  const guardarVenta = (v: TicketVenta) => {
    if (!turno) return;
    const nueva: TurnoSateliteVenta = {
      id_planilla: v.id_planilla,
      consecutivo: v.consecutivo_pasajero,
      hora: v.hora_tiquete || formatHora(v.hora_ruta),
      cod_ruta: v.cod_ruta,
      placa: v.placa_vehi || '',
      origen: v.origen || '',
      destino: v.destino || '',
      asiento: v.puesto,
      pasajero: v.pasajero.nombre,
      documento: v.pasajero.documento,
      valor: v.valor ?? 0,
      forma_pago: v.forma_pago,
      numero_factura: v.numero_factura,
      resolucion_numero: v.resolucion_numero,
      cufe: v.cufe,
      qr_dian: v.qr_dian || v.qr_code_url,
      nit_emisor: v.nit_emisor,
      fecha_ruta: v.fecha_ruta,
      hora_ruta: v.hora_ruta,
      mensaje: v.mensaje || undefined,
    };
    const actualizado: TurnoSatelite = { ...turno, ventas: [...turno.ventas, nueva] };
    guardarTurno(actualizado);
    setTurno(actualizado);
  };

  // ─── Selección de vehículo y tramo ────────────────────────────────────────
  const seleccionarTramo = async (v: SateliteVehiculo, s: SateliteSegmento) => {
    if (v.estado === 'LLEGADO') {
      toast.error('Este vehículo ya llegó a su destino final; no se puede vender en este tramo.');
      return;
    }
    setVehiculoSel(v);
    setSegmento(s);
    setPuestosSel([]);
    setSillas(null);
    setDocumento('');
    setNombres('');
    setApellidos('');
    setTelefono('');
    setCorreo('');
    setPasajeroExiste(false);
    setValor(s.valor ? String(s.valor) : '');
    setCargandoSillas(true);
    try {
      setSillas(await travelsoftService.getSillasSatelite(v.cod_ruta, v.fecha_ruta ?? undefined));
    } catch (err) {
      setSillas(null);
      toast.error(err instanceof Error ? err.message : 'No se pudieron cargar las sillas.');
    } finally {
      setCargandoSillas(false);
    }
  };

  // Marca un vehículo como "llegado a esta agencia satélite"
  const marcarArribe = (cod_ruta: number) => {
    setVehiculosArrivados(prev => new Set(prev).add(cod_ruta));
    toast.info('Vehículo marcado como llegado. Ya puede vender tiquetes desde esta agencia hasta el destino final.');
  };

  const reiniciarVenta = () => {
    setVehiculoSel(null);
    setSegmento(null);
setSillas(null);
    setPuestosSel([]);
    setDocumento('');
    setNombres('');
    setApellidos('');
    setTelefono('');
    setCorreo('');
    setPasajeroExiste(false);
    setFormaPago('EFECTIVO');
    void cargarDashboard(fechaSel);
  };

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

  // ─── Lógica de impresión / emisión fiscal compartida ────────────────────────
  const { imprimirTicket, reimprimirVenta: reimprimirRemoto, emitirConDian } = useTicketFiscal();

  const reimprimirVenta = useCallback(
    async (v: TurnoSateliteVenta) => {
      const r = await reimprimirRemoto(v);
      if (r === 'pda' || r === 'sunmi' || r === 'usb' || r === 'ble' || r === 'rawbt' || r === 'print') {
        toast.success(`Tiquete #${v.consecutivo} reimpreso.`);
      }
    },
    [reimprimirRemoto]
  );

  const handleGenerar = async () => {
    if (impresoraLocalLista !== true) {
      toast.error('Conecte una impresora local para generar el tiquete (PC: servicio de impresión; PDA: impresora integrada/Bluetooth).');
      return;
    }
    if (!vehiculoSel || !segmento || !sillas) {
      toast.error('Seleccione el vehículo y el destino del tramo.');
      return;
    }
    if (puestosSel.length === 0) {
      toast.error('Seleccione al menos una silla desocupada.');
      return;
    }
    const valorNum = Number(valor);
    if (Number.isNaN(valorNum) || valorNum < 0) {
      toast.error('Ingrese un valor válido del pasaje.');
      return;
    }

    const sinDocumento = !documento.trim();
    const docFinal = sinDocumento ? '222222222222' : documento.trim();
    const nombresFinal = sinDocumento ? 'CONSUMIDOR' : nombres.trim();
    const apellidosFinal = sinDocumento ? 'FINAL' : apellidos.trim();
    const correoFinal = sinDocumento ? 'tickets@sactel.net' : (correo.trim() || undefined);

    setGenerando(true);
    try {
      const venta = await travelsoftService.venderTiqueteSatelite({
        cod_ruta: vehiculoSel.cod_ruta,
        puesto: puestosSel[0],
        puestos: puestosSel,
        numero_documento: docFinal,
        nombres: nombresFinal,
        apellidos: apellidosFinal,
        correo: correoFinal,
        telefono: telefono.trim() || undefined,
        forma_pago: formaPago,
        fecha: vehiculoSel.fecha_ruta ?? undefined,
        origen_ruta: segmento.origen_ruta ?? vehiculoSel.origen_ruta ?? undefined,
        destino_ruta: segmento.destino_ruta,
        valor: valorNum,
        consecutivo_planilla: vehiculoSel.consecutivo_planilla ?? undefined,
      });

      // Modo de impresión según parámetro de la compañía:
      //  - "un tiquete por silla" (por defecto): cada silla se imprime por separado.
      //  - "tiquete consolidado": un solo tiquete con todas las sillas.
      if (venta.consolidado) {
        // Emisión fiscal ante la DIAN (CUFE + QR). Si el Core no responde,
        // el tiquete se imprime igualmente con la numeración de la resolución local.
        const ticketFinal = await emitirConDian(venta.data, (msg) => toast.warning(msg));
        guardarVenta(ticketFinal);
        toast.success(`${venta.cantidad} tiquete(s) generados, imprimiendo...`);
        void imprimirTicket(ticketFinal);
      } else {
        // Un tiquete por cada silla vendida.
        for (const t of venta.tiquetes) {
          const ticketFinal = await emitirConDian(t, (msg) => toast.warning(msg));
          guardarVenta(ticketFinal);
          void imprimirTicket(ticketFinal);
        }
      }
      reiniciarVenta();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo generar el tiquete.');
    } finally {
      setGenerando(false);
    }
  };

  const disponibles = sillas?.sillas.filter((s) => s.estado === 'disponible').length ?? 0;
  const formasPago: { id: FormaPago; label: string; icon: React.ReactNode }[] = [
    { id: 'EFECTIVO', label: 'Efectivo', icon: <Banknote className="w-5 h-5" /> },
    { id: 'TARJETA', label: 'Tarjeta', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'QR', label: 'QR', icon: <QrCode className="w-5 h-5" /> },
  ];

  const valorUnitario = Number(valor) || 0;
  const valorTotalMulti = valorUnitario * puestosSel.length;

  // ─── Inicio de turno (sin operador aún) ───────────────────────────────────
  if (!turno) {
    return <InicioTurno nombreAgencia={nombreAgencia} nombreOperador={nombreOperador} onIniciar={iniciarTurno} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      <div className="mx-auto max-w-md min-h-screen flex flex-col bg-slate-900 shadow-2xl">
        {/* Header */}
        <header className="bg-slate-950 border-b border-slate-800 px-4 py-3 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="font-black text-sm text-white truncate">SACTel.Cloud · {nombreAgencia}</h1>
              <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-widest">Agencia Satélite</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCierreAbierto(true)} className="text-[11px] text-red-300 hover:text-red-200 hover:bg-red-950/40 gap-1 h-9 px-2 font-bold">
              <Coins className="w-3.5 h-3.5" /> Cerrar Turno
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/'); }} className="text-[11px] text-slate-300 hover:text-white hover:bg-slate-800/40 gap-1 h-9 px-2 font-bold">
              <LogOut className="w-3.5 h-3.5" /> Cerrar Sesión
            </Button>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-800/70 rounded-lg px-2 py-1 min-w-0">
              <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate font-semibold">{nombreOperador}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-800/70 rounded-lg px-2 py-1 ml-auto font-mono">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              {horaColombiaCorta(ahora)}
            </div>
          </div>

          {/* Fecha del panel + tiquetes del turno */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-800/70 rounded-lg px-2 py-1 flex-1 min-w-0">
              <CalendarDays className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <input
                type="date"
                value={fechaSel}
                onChange={(e) => { if (e.target.value) setFechaSel(e.target.value); }}
                className="bg-transparent text-[11px] font-bold text-slate-200 w-full outline-none [color-scheme:dark]"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-slate-700 text-slate-300 text-[11px] font-bold gap-1.5 px-2"
              onClick={() => setListaTiquetesAbierta(true)}
            >
              <History className="w-3.5 h-3.5 text-emerald-400" />
              Tiquetes ({turno.ventas.length})
            </Button>
          </div>

          {/* Resumen del turno */}
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-800/70 rounded-lg py-1.5">
              <span className="block text-[9px] uppercase font-bold text-slate-400">Tiquetes</span>
              <span className="block text-sm font-black text-white">{turno.ventas.length}</span>
            </div>
            <div className="bg-slate-800/70 rounded-lg py-1.5 col-span-2">
              <span className="block text-[9px] uppercase font-bold text-slate-400">Vendido en el turno</span>
              <span className="block text-sm font-black text-emerald-400">${totalTurno.toLocaleString('es-CO')}</span>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-y-auto p-3 space-y-3">
          {!vehiculoSel ? (
            <>
              {/* Encabezado de lista + pestañas */}
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-sm font-black text-white">
                    {fechaSel === hoyISO() ? 'Vehículos de hoy' : 'Vehículos del día'}
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    Los que pasan por {nombreAgencia} · {new Date(fechaSel + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-slate-700 text-slate-300" onClick={() => {
                  if (vista === 'despachados') void cargarDespachados(fechaSel);
                  else void cargarDashboard(fechaSel);
                }} title="Actualizar">
                  <RefreshCcw className={cn("w-4 h-4", (loading || cargandoDespachados) && "animate-spin")} />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setVista('en_ruta')}
                  className={cn(
                    "py-2 rounded-xl border text-[11px] font-black transition-all",
                    vista === 'en_ruta'
                      ? "border-emerald-500 bg-emerald-950/50 text-emerald-300"
                      : "border-slate-700 bg-slate-900 text-slate-400 active:bg-slate-800"
                  )}
                >
                  En ruta
                </button>
                <button
                  onClick={() => setVista('despachados')}
                  className={cn(
                    "py-2 rounded-xl border text-[11px] font-black transition-all",
                    vista === 'despachados'
                      ? "border-sky-500 bg-sky-950/50 text-sky-300"
                      : "border-slate-700 bg-slate-900 text-slate-400 active:bg-slate-800"
                  )}
                >
                  Despachados que pasan por aquí
                </button>
              </div>

              {vista === 'en_ruta' ? (
                <>
                  {loading && (
                    <div className="py-12 flex flex-col items-center gap-2 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                      <span className="text-[11px] font-bold">Consultando vehículos...</span>
                    </div>
                  )}

                  {!loading && errorRed && (
                    <div className="rounded-xl border border-red-800 bg-red-950/40 p-4 text-center">
                      <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                      <p className="text-[11px] text-red-300 font-semibold">{errorRed}</p>
                      <Button size="sm" variant="outline" className="mt-3 text-[11px] border-red-800 text-red-300" onClick={() => void cargarDashboard(fechaSel)}>
                        <RefreshCcw className="w-3.5 h-3.5" /> Reintentar
                      </Button>
                    </div>
                  )}

                  {!loading && !errorRed && dashboard && dashboard.vehiculos.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-800/40 p-6 text-center">
                      <Bus className="w-7 h-7 text-slate-500 mx-auto mb-2" />
                      <p className="text-xs text-slate-300 font-bold">No hay vehículos programados para esta fecha</p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Las rutas que pasan por {nombreAgencia} se programan en la agencia principal.
                      </p>
                    </div>
                  )}

                  {dashboard?.vehiculos.map((v) => (
                    <TarjetaVehiculo
                      key={v.cod_ruta}
                      v={v}
                      arrivado={vehiculosArrivados.has(v.cod_ruta)}
                      onTramo={(s) => void seleccionarTramo(v, s)}
                      onMarcarArribe={() => marcarArribe(v.cod_ruta)}
                      onDespacharSalida={() => void despacharSalida(v.cod_ruta)}
                    />
                  ))}
                </>
              ) : (
                <>
                  {cargandoDespachados && (
                    <div className="py-12 flex flex-col items-center gap-2 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
                      <span className="text-[11px] font-bold">Consultando despachados...</span>
                    </div>
                  )}

                  {!cargandoDespachados && despachados && despachados.vehiculos.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-800/40 p-6 text-center">
                      <Bus className="w-7 h-7 text-slate-500 mx-auto mb-2" />
                      <p className="text-xs text-slate-300 font-bold">No hay vehículos despachados en tránsito</p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Aparecen aquí los buses ya despachados por la principal que pasan por {nombreAgencia} y aún no salen del satélite.
                      </p>
                    </div>
                  )}

                  {despachados?.vehiculos.map((v) => (
                    <TarjetaVehiculo
                      key={v.cod_ruta}
                      v={v}
                      arrivado={vehiculosArrivados.has(v.cod_ruta)}
                      onTramo={(s) => void seleccionarTramo(v, s)}
                      onMarcarArribe={() => marcarArribe(v.cod_ruta)}
                      onDespacharSalida={() => void despacharSalida(v.cod_ruta)}
                    />
                  ))}
                </>
              )}
            </>
          ) : (
            <>
              {/* Barra de navegación de la venta */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-300" onClick={reiniciarVenta}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Vendiendo tiquete</p>
                  <p className="text-xs font-black text-white truncate">
                    {vehiculoSel.placa_vehi} · {formatHora(vehiculoSel.hora_ruta)} · Ruta {vehiculoSel.cod_ruta}
                  </p>
                </div>
                <Badge className={cn(
                  "text-[9px] font-bold border shrink-0",
                  impresoraInfo?.detectada
                    ? "bg-emerald-900/40 text-emerald-300 border-emerald-700"
                    : "bg-amber-900/40 text-amber-300 border-amber-700"
                )}>
                  {impresoraInfo?.detectada ? <Printer className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {impresoraInfo?.detectada ? 'Impresora' : 'Sin impresora'}
                </Badge>
              </div>

              {/* Tramo seleccionado */}
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
                <div className="flex items-center justify-center gap-2 text-center">
                  <div className="flex-1">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Origen</span>
                    <span className="block text-xs font-black text-white">{vehiculoSel.origen || '—'}</span>
                  </div>
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="flex-1">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Destino</span>
                    <span className="block text-xs font-black text-white">{segmento?.destino || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Croquis de sillas */}
              <div className="rounded-xl bg-slate-800/50 border border-slate-800 p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-black uppercase text-emerald-400">Sillas del vehículo</h3>
                  <Badge className="bg-slate-900 text-slate-300 border-slate-700 text-[9px] font-bold">
                    {disponibles} libres · {sillas?.ocupadas.length ?? 0} ocupadas
                  </Badge>
                </div>

                {cargandoSillas && (
                  <div className="py-8 flex items-center justify-center text-slate-400 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-400" /> Cargando sillas...
                  </div>
                )}
                {!cargandoSillas && !sillas && (
                  <p className="text-[11px] text-slate-500 italic py-6 text-center">No se pudo cargar el croquis.</p>
                )}
                {!cargandoSillas && sillas && (
                  <div className="grid grid-cols-5 gap-1.5">
                    {sillas.sillas.map((s) => (
                      <button
                        key={s.numero}
                        disabled={s.estado === 'ocupada'}
                        onClick={() => setPuestosSel((prev) =>
                          prev.includes(s.numero)
                            ? prev.filter((n) => n !== s.numero)
                            : [...prev, s.numero]
                        )}
                        className={cn(
                          "h-12 rounded-lg text-[11px] font-bold border transition-all flex flex-col items-center justify-center gap-0.5",
                          s.estado === 'ocupada'
                            ? "bg-slate-800 text-slate-600 border-slate-800 cursor-not-allowed"
                            : puestosSel.includes(s.numero)
                              ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30"
                              : "bg-slate-900 text-slate-200 border-slate-700 active:bg-emerald-900"
                        )}
                      >
                        <Armchair className="w-3.5 h-3.5" />
                        {s.numero}
                      </button>
                    ))}
                  </div>
                )}

                {puestosSel.length > 0 && (
                  <div className="mt-3 rounded-xl bg-slate-950 border border-emerald-800 p-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold">
                    <span className="text-emerald-300">Sillas: {[...puestosSel].sort((a, b) => a - b).join(', ')}</span>
                    <span className="text-slate-300">Cantidad: {puestosSel.length}</span>
                    <span className="text-emerald-400 ml-auto">
                      Total: ${valorTotalMulti.toLocaleString('es-CO')}
                    </span>
                  </div>
                )}
              </div>

              {/* Datos del pasajero */}
              <div className="rounded-xl bg-slate-800/50 border border-slate-800 p-3 space-y-2.5">
                <h3 className="text-[11px] font-black uppercase text-emerald-400">Datos del pasajero</h3>

                <div className="space-y-1">
                  <Label htmlFor="doc" className="text-[10px] font-bold text-slate-400">N° de identificación</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="doc"
                      value={documento}
                      onChange={(e) => { setDocumento(e.target.value); setPasajeroExiste(false); }}
                      onBlur={() => void buscarPasajero()}
                      inputMode="numeric"
                      placeholder="Sin documento = Consumidor Final"
                      className="h-11 bg-slate-900 border-slate-700 text-sm text-white placeholder:text-slate-600"
                    />
                    {buscandoPasajero && <Loader2 className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />}
                    {pasajeroExiste && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="nombres" className="text-[10px] font-bold text-slate-400">Nombres</Label>
                    <Input id="nombres" value={nombres} onChange={(e) => setNombres(e.target.value)} placeholder="Nombres"
                      className="h-11 bg-slate-900 border-slate-700 text-sm text-white placeholder:text-slate-600" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="apellidos" className="text-[10px] font-bold text-slate-400">Apellidos</Label>
                    <Input id="apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} placeholder="Apellidos"
                      className="h-11 bg-slate-900 border-slate-700 text-sm text-white placeholder:text-slate-600" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="telefono" className="text-[10px] font-bold text-slate-400">Teléfono</Label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                      <Input id="telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} inputMode="tel"
                        className="h-11 pl-9 bg-slate-900 border-slate-700 text-sm text-white placeholder:text-slate-600" placeholder="Opcional" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="correo" className="text-[10px] font-bold text-slate-400">Correo</Label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                      <Input id="correo" value={correo} onChange={(e) => setCorreo(e.target.value)} inputMode="email" type="email"
                        className="h-11 pl-9 bg-slate-900 border-slate-700 text-sm text-white placeholder:text-slate-600" placeholder="Opcional" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Forma de pago y valor */}
              <div className="rounded-xl bg-slate-800/50 border border-slate-800 p-3 space-y-2.5">
                <h3 className="text-[11px] font-black uppercase text-emerald-400">Forma de pago y valor</h3>
                <div className="grid grid-cols-3 gap-2">
                  {formasPago.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFormaPago(f.id)}
                      className={cn(
                        "py-3 rounded-xl border-2 text-center transition-all",
                        formaPago === f.id
                          ? "border-emerald-500 bg-emerald-950/50"
                          : "border-slate-700 bg-slate-900 active:bg-slate-800"
                      )}
                    >
                      <span className={cn("mx-auto flex items-center justify-center", formaPago === f.id ? "text-emerald-400" : "text-slate-500")}>
                        {f.icon}
                      </span>
                      <span className="block text-[11px] font-black mt-1 text-slate-200">{f.label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="valor" className="text-[10px] font-bold text-slate-400">Valor del pasaje ($)</Label>
                  <Input
                    id="valor"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    inputMode="numeric"
                    className="h-11 bg-slate-900 border-slate-700 text-sm font-black text-emerald-300 placeholder:text-slate-600"
                  />
                </div>

                {impresoraLocalLista === false && (
                  <p className="text-[11px] font-bold text-amber-300 bg-amber-950/40 border border-amber-700 rounded-lg p-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    Impresora local no detectada. Conecte el servicio de impresión (PC) o la impresora de la PDA para poder generar tiquetes.
                  </p>
                )}
                {impresoraLocalLista === null && (
                  <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Verificando impresora local…
                  </p>
                )}
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm h-12 gap-2"
                  disabled={generando || impresoraLocalLista !== true}
                  onClick={() => void handleGenerar()}
                >
                  {generando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
                  GENERAR TICKET
                </Button>
              </div>
            </>
          )}
        </main>

        {/* Cierre de turno */}
        {cierreAbierto && (
          <CierreTurno
            turno={turno}
            agencia={nombreAgencia}
            guardando={guardandoCierre}
            onReimprimir={(v) => void reimprimirVenta(v)}
            onCerrar={() => void cerrarTurno()}
            onVolver={() => setCierreAbierto(false)}
          />
        )}

        {/* Lista de tiquetes del turno (reimpresión rápida) */}
        {listaTiquetesAbierta && !cierreAbierto && (
          <ListaTiquetes
            turno={turno}
            agencia={nombreAgencia}
            onReimprimir={(v) => void reimprimirVenta(v)}
            onCerrar={() => setListaTiquetesAbierta(false)}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inicio de turno: el operador ya está definido por el usuario autenticado,
// no se solicita un nombre nuevo. Solo se confirma el inicio.
// ─────────────────────────────────────────────────────────────────────────────
function InicioTurno({ nombreAgencia, nombreOperador, onIniciar }: {
  nombreAgencia: string;
  nombreOperador: string;
  onIniciar: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-3">
            <Bus className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-white">SACTel.Cloud</h1>
          <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">{nombreAgencia}</p>
          <p className="text-[11px] text-slate-400 mt-1">Agencia satélite · venta de tiquetes</p>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-2">
              <User className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-sm font-black text-white">Iniciar Turno</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Operador: <span className="font-semibold text-white">{nombreOperador}</span></p>
          </div>

          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm h-12 gap-2" onClick={onIniciar}>
            <Ticket className="w-4 h-4" /> INICIAR TURNO
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tarjeta de vehículo en tránsito con sus destinos/tarifas disponibles.
// ─────────────────────────────────────────────────────────────────────────────
function EstadoVehiculoBadge({ estado }: { estado?: EstadoVehiculoSatelite | null }) {
  if (!estado) return null;
  const cfg: Record<EstadoVehiculoSatelite, { label: string; cls: string }> = {
    POR_DESPACHAR: { label: 'Por despachar', cls: 'bg-slate-900 text-slate-300 border-slate-700' },
    EN_TRANSITO: { label: 'En tránsito', cls: 'bg-amber-900/40 text-amber-300 border-amber-700' },
    SALIO_SATELITE: { label: 'Salió del satélite', cls: 'bg-sky-900/40 text-sky-300 border-sky-700' },
    LLEGADO: { label: 'Ya llegó', cls: 'bg-emerald-900/40 text-emerald-300 border-emerald-700' },
  };
  const c = cfg[estado];
  return <Badge className={cn("text-[9px] font-bold border", c.cls)}>{c.label}</Badge>;
}

function TarjetaVehiculo({
  v,
  onTramo,
  arrivado,
  onMarcarArribe,
  onDespacharSalida,
}: {
  v: SateliteVehiculo;
  onTramo: (s: SateliteSegmento) => void;
  arrivado?: boolean;
  onMarcarArribe?: () => void;
  onDespacharSalida?: () => void;
}) {
  const llegado = v.estado === 'LLEGADO';
  const enTransito = v.estado === 'EN_TRANSITO';
  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-800 overflow-hidden">
      <div className="p-3 pb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-white text-sm">{v.orden_vehi || v.placa_vehi || 'SIN ORDEN'}</span>
            <Badge className="bg-slate-900 text-emerald-300 border-slate-700 text-[9px] font-bold">Ruta {v.cod_ruta}</Badge>
            <EstadoVehiculoBadge estado={v.estado} />
          </div>
          <p className="text-[10px] text-slate-400 truncate mt-0.5">{v.conductor || '—'}</p>
        </div>
        {v.estado === 'EN_TRANSITO' && !arrivado && !llegado && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px] font-bold text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 border border-amber-800"
              onClick={onMarcarArribe}
            >
              <MapPin className="w-3 h-3 mr-1" />
              Arrivó
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px] font-bold text-sky-300 hover:text-sky-200 hover:bg-sky-950/40 border border-sky-800"
              onClick={onDespacharSalida}
            >
              <Bus className="w-3 h-3 mr-1" />
              Despachar salida
            </Button>
          </div>
        )}
        <div className="text-right shrink-0">
          <span className="block text-[9px] uppercase font-bold text-slate-500">Hora</span>
          <span className="block font-mono font-black text-emerald-300 text-sm">{formatHora(v.hora_ruta)}</span>
        </div>
      </div>

      <div className="px-3 flex items-center justify-center gap-2 text-center pb-2">
        <div className="flex-1 min-w-0">
          <span className="block text-[9px] uppercase font-bold text-slate-500">Origen</span>
          <span className="block text-[11px] font-black text-white truncate">{v.origen || '—'}</span>
        </div>
        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="block text-[9px] uppercase font-bold text-slate-500">Final</span>
          <span className="block text-[11px] font-black text-white truncate">{v.destino || '—'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="block text-[9px] uppercase font-bold text-slate-500">Vendidos</span>
          <span className="block text-[11px] font-black text-slate-300">
            {v.tickets_vendidos ?? 0}<span className="text-slate-500 font-normal">/{v.capacidad ?? '—'}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 p-3 pt-1 border-t border-slate-800">
        {v.segmentos.map((s) => (
          <button
            key={s.destino_ruta}
            disabled={llegado}
            onClick={() => onTramo(s)}
            className={cn(
              "rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-left transition-colors",
              llegado
                ? "opacity-50 cursor-not-allowed"
                : "active:border-emerald-500 active:bg-emerald-950/40"
            )}
          >
            <span className="block text-[9px] uppercase font-bold text-slate-500">Hasta</span>
            <span className="block text-[11px] font-black text-white truncate">{s.destino || '—'}</span>
            <span className="block text-[13px] font-black text-emerald-400 mt-0.5">
              {s.valor ? `$${s.valor.toLocaleString('es-CO')}` : 'Tarifa manual'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cierre de turno: resumen local (tiquetes, valor, desglose por forma de pago).
// ─────────────────────────────────────────────────────────────────────────────
function CierreTurno({ turno, agencia, guardando, onReimprimir, onCerrar, onVolver }: {
  turno: TurnoSatelite;
  agencia: string;
  guardando: boolean;
  onReimprimir: (v: TurnoSateliteVenta) => void;
  onCerrar: () => void;
  onVolver: () => void;
}) {
  const total = totalTurnoCompute(turno.ventas);
  const porForma = desglosePorFormaPago(turno.ventas);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-red-400" /> Cierre de Turno
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{agencia}</p>
          </div>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-400" onClick={onVolver} disabled={guardando}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Operador</span>
            <span className="font-black text-white">{turno.operador}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Inicio</span>
            <span>{new Date(turno.inicio).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Tiquetes vendidos</span>
            <span className="font-black text-white">{turno.ventas.length}</span>
          </div>
          <div className="flex justify-between border-t border-dashed border-slate-700 pt-1.5">
            <span className="font-black text-slate-300">TOTAL VENDIDO</span>
            <span className="font-black text-emerald-400 text-sm">${total.toLocaleString('es-CO')}</span>
          </div>
        </div>

        {turno.ventas.length > 0 && (
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Desglose por forma de pago</p>
            {Object.entries(porForma).map(([f, t]) => (
              <div key={f} className="flex justify-between text-[11px] text-slate-300">
                <span>{FORMA_PAGO_LABEL[f] || f}</span>
                <span className="font-black">${t.toLocaleString('es-CO')}</span>
              </div>
            ))}
          </div>
        )}

        {turno.ventas.length > 0 && (
          <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
            <p className="p-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">Tiquetes del turno</p>
            <div className="divide-y divide-slate-800 max-h-40 overflow-y-auto">
              {turno.ventas.map((v) => (
                <div key={v.id_planilla} className="px-3 py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-white truncate">
                      #{v.consecutivo} · {v.pasajero}
                    </p>
                    <p className="text-[9px] text-slate-500 truncate">
                      {v.origen} → {v.destino} · Asiento {v.asiento} · {v.placa}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-black text-emerald-400">${v.valor.toLocaleString('es-CO')}</span>
                    <button
                      onClick={() => onReimprimir(v)}
                      disabled={guardando}
                      className="p-1.5 rounded-lg border border-slate-700 text-slate-300 active:bg-slate-800"
                      title={`Reimprimir tiquete ${v.consecutivo}`}
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 h-11 border-slate-700 text-slate-300 text-xs font-bold" onClick={onVolver} disabled={guardando}>
            Seguir vendiendo
          </Button>
          <Button className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white text-xs font-black gap-2" onClick={onCerrar} disabled={guardando}>
            {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
            {guardando ? 'GUARDANDO...' : 'CERRAR TURNO'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lista de tiquetes del turno (reimpresión rápida durante la venta).
// ─────────────────────────────────────────────────────────────────────────────
function ListaTiquetes({ turno, agencia, onReimprimir, onCerrar }: {
  turno: TurnoSatelite;
  agencia: string;
  onReimprimir: (v: TurnoSateliteVenta) => void;
  onCerrar: () => void;
}) {
  const total = totalTurnoCompute(turno.ventas);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" /> Tiquetes del turno
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{agencia} · {turno.operador}</p>
          </div>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-400" onClick={onCerrar}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {turno.ventas.length === 0 ? (
          <p className="text-[11px] text-slate-500 italic py-6 text-center">Aún no hay tiquetes vendidos en este turno.</p>
        ) : (
          <div className="divide-y divide-slate-800 rounded-xl bg-slate-950 border border-slate-800 max-h-[65vh] overflow-y-auto">
            {turno.ventas.map((v) => (
              <div key={v.id_planilla} className="px-3 py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-white truncate">
                    #{v.consecutivo} · {v.pasajero}
                    {v.numero_factura ? <span className="text-emerald-400 font-mono"> · {v.numero_factura}</span> : null}
                  </p>
                  <p className="text-[9px] text-slate-500 truncate">
                    {v.origen} → {v.destino} · Asiento {v.asiento} · {v.placa} · {FORMA_PAGO_LABEL[v.forma_pago] || v.forma_pago}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-black text-emerald-400">${v.valor.toLocaleString('es-CO')}</span>
                  <button
                    onClick={() => onReimprimir(v)}
                    className="p-2 rounded-lg border border-slate-700 text-slate-300 active:bg-slate-800"
                    title={`Reimprimir tiquete ${v.consecutivo}`}
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <div className="px-3 py-2.5 flex justify-between border-t border-slate-800 text-[11px] font-black text-slate-300">
              <span>TOTAL ({turno.ventas.length})</span>
              <span className="text-emerald-400">${total.toLocaleString('es-CO')}</span>
            </div>
          </div>
        )}

        <Button className="w-full h-11 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black" onClick={onCerrar}>
          Cerrar
        </Button>
      </div>
    </div>
  );
}
