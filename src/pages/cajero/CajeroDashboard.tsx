import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from '@/lib/utils';
import { 
  Ticket, CalendarDays, BarChart3, LogOut, 
  Coins, ArrowUpRight, Building2, BookmarkCheck,
  TrendingUp, Landmark
} from 'lucide-react';
import { toast } from 'sonner';

type CajeroSection = 'inicio' | 'ventas' | 'reservas' | 'informes' | 'cierre';

export default function CajeroDashboard() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<CajeroSection>('inicio');

  // ─── ESTADOS DE CAJA Y TIQUETERÍA ───
  const [totalCajaTurno, setTotalCajaTurno] = useState<number>(145000);
  const precioTiquete = 85000;
  
  const nombreUsuario = user?.name || "Carlos Eduardo Mendoza";
  const correoUsuario = user?.email || "cajero.salitre@tickets.com";

  const getIniciales = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans antialiased overflow-hidden text-slate-800">
      
      {/* ─── BARRA LATERAL IZQUIERDA (IDENTIDAD VERDE TAQUILLA) ─── */}
      <aside className="w-72 bg-slate-950 text-slate-200 flex flex-col justify-between border-r border-slate-900 shadow-xl z-20 shrink-0">
        <div>
          {/* Encabezado Corporativo */}
          <div className="p-5 flex items-center gap-4 bg-slate-950">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-md">
              <Building2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-wide text-white">SACTel.Cloud</h1>
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
            {[
              { id: 'inicio', label: 'Inicio / Resumen Diario', icon: <BarChart3 className="w-4 h-4" /> },
              { id: 'ventas', label: 'Taquilla de Ventas', icon: <Ticket className="w-4 h-4" /> },
              { id: 'reservas', label: 'Control de Reservas', icon: <CalendarDays className="w-4 h-4" /> },
              { id: 'informes', label: 'Informes y Métricas', icon: <ArrowUpRight className="w-4 h-4" /> },
              { id: 'cierre', label: 'Cierre de Cajero', icon: <Coins className="w-4 h-4" /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as CajeroSection)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all",
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
            className="w-full justify-start text-xs text-slate-400 hover:bg-red-950/30 hover:text-red-400 gap-2 h-10 font-bold" 
            onClick={logout} 
            variant="ghost"
          >
            <LogOut className="w-4 h-4" /> Salir del Turno
          </Button>
        </div>
      </aside>

      {/* ─── ÁREA DE CONTENIDO DINÁMICO ─── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Cabecera Superior */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10 shrink-0">
          <div className="text-xs text-slate-400 font-bold tracking-wider uppercase">
            Terminal Salitre / <span className="text-emerald-600 font-black">{activeSection}</span>
          </div>
          <div className="flex items-center gap-2 border-l pl-4">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-mono font-bold text-slate-600">
              Caja: ${totalCajaTurno.toLocaleString('es-CO')}
            </span>
          </div>
        </header>

        {/* Inyección de Subvistas */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {(() => {
            switch (activeSection) {
              case 'inicio':
                return <SubViewInicio setSeccion={setActiveSection} total={totalCajaTurno} />;
              case 'ventas':
                return <SubViewVentas precioTiquete={precioTiquete} setTotalCaja={setTotalCajaTurno} />;
              case 'reservas':
                return <SubViewReservas />;
              case 'informes':
                return <SubViewInformes />;
              case 'cierre':
                return <SubViewCierre total={totalCajaTurno} />;
              default:
                return <SubViewInicio setSeccion={setActiveSection} total={totalCajaTurno} />;
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
function SubViewInicio({ total, setSeccion }: { total: number; setSeccion: (s: CajeroSection) => void }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Resumen General del Día</h2>
        <p className="text-xs text-slate-500">Métricas acumuladas de tiquetería expedida durante el turno vigente.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Efectivo Recaudado</span>
              <h3 className="text-xl font-black text-slate-900">${(total * 0.6).toLocaleString('es-CO')}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tarjetas / Medios Digitales</span>
              <h3 className="text-xl font-black text-slate-900">${(total * 0.4).toLocaleString('es-CO')}</h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Landmark className="w-5 h-5" /></div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 text-white border-none shadow-md">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Flujo Total de Caja</span>
              <h3 className="text-xl font-black text-emerald-400">${total.toLocaleString('es-CO')}</h3>
            </div>
            <div className="p-3 bg-slate-800 text-emerald-400 rounded-xl"><Coins className="w-5 h-5" /></div>
          </CardContent>
        </Card>
      </div>

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

// ─────────────────────────────────────────────────────────────────────────────
// 🎫 2. SUBVISTA: TAQUILLA DE VENTAS
// ─────────────────────────────────────────────────────────────────────────────
function SubViewVentas({ precioTiquete, setTotalCaja }: { precioTiquete: number; setTotalCaja: React.Dispatch<React.SetStateAction<number>> }) {
  const [destino, setDestino] = useState('');
  const [viaje, setViaje] = useState<any>(null);
  const [doc, setDoc] = useState('');
  const [pasajero, setPasajero] = useState<any>(null);
  const [silla, setSilla] = useState<number | null>(null);
  const [factura, setFactura] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleVender = () => {
    setLoading(true);
    toast.loading("Procesando XML y solicitando CUFE ante la DIAN...");
    setTimeout(() => {
      toast.dismiss();
      setFactura({
        num: `F-SETT-${Math.floor(Math.random() * 1000)}`,
        cufe: "6e5c8a4b7f3d2e1a9c8b7f6e5d4c3b2a1f0e9d8c7b6a5f4e"
      });
      setTotalCaja(p => p + precioTiquete);
      setLoading(false);
      toast.success("Factura autorizada por la DIAN y tiquete generado.");
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
      <div className="lg:col-span-2 space-y-4">
        
        {/* Filtros de Viaje */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold uppercase text-emerald-600">1. Buscar Viaje</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex gap-2">
            <Input onChange={(e) => setDestino(e.target.value)} placeholder="Destino (Ej: Medellín)" value={destino} />
            <Button onClick={() => setViaje({ id: "B-20", hora: "18:00", ruta: `Bogota a ${destino || 'Destino'}` })} size="sm" className="bg-slate-900 text-white font-bold">Buscar</Button>
          </CardContent>
        </Card>

        {/* Registro Pasajero */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold uppercase text-emerald-600">2. Cliente</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex gap-2">
            <Input onChange={(e) => setDoc(e.target.value)} placeholder="Cédula de Ciudadanía" value={doc} />
            <Button onClick={() => setPasajero({ nom: "Arturo Calle", cc: doc })} size="sm" className="bg-slate-100 border text-slate-800 font-bold">Validar</Button>
          </CardContent>
        </Card>

        {/* Croquis de Asientos */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex flex-col items-center">
            <span className="text-xs font-bold text-emerald-600 uppercase mb-3 block w-full">3. Asignar Asiento</span>
            <div className="grid grid-cols-4 gap-2 border p-3 rounded-xl bg-slate-50">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <button
                  key={n}
                  onClick={() => setSilla(n)}
                  className={cn("w-10 h-10 rounded-lg text-xs font-bold border transition-colors", silla === n ? "bg-emerald-600 text-white border-emerald-700" : "bg-white text-slate-700 hover:bg-slate-50")}
                >
                  {n}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recaudo y Factura */}
      <div className="space-y-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs flex justify-between items-center">
              <span className="font-bold">Total Pasaje:</span>
              <span className="text-base font-black text-emerald-400">${precioTiquete.toLocaleString('es-CO')}</span>
            </div>
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-10" 
              disabled={loading || !silla || !pasajero} 
              onClick={handleVender}
            >
              VENDER / GENERAR XML DIAN
            </Button>
          </CardContent>
        </Card>

        {factura && (
          <Card className="bg-white border-dashed border-2 border-slate-300 p-4 font-mono text-[11px] space-y-1.5 shadow-sm">
            <div className="text-center font-bold border-b border-dashed pb-1">COMPROBANTE ELECTRÓNICO</div>
            <p><strong>Factura:</strong> {factura.num}</p>
            <p><strong>Cliente:</strong> {pasajero?.nom}</p>
            <p><strong>Silla:</strong> {silla}</p>
            <div className="pt-1 border-t border-dashed">
              <span className="text-[9px] text-slate-400 block font-bold">HASH CUFE DIAN:</span>
              <p className="bg-slate-50 p-1 rounded text-[9px] break-all leading-tight text-slate-500 border">{factura.cufe}</p>
            </div>
          </Card>
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

  const ejecutarArqueo = () => {
    setCierreProcesado(true);
    toast.success("Arqueo cuadrado. Tirilla Z expedida.");
  };

  return (
    <Card className="bg-white border-slate-200 shadow-sm max-w-xl mx-auto text-center p-6 space-y-4 animate-in fade-in duration-200">
      <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
        <Coins className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-black text-slate-900 text-base">Arqueo y Bloqueo de Terminal</h3>
        <p className="text-xs text-slate-400 mt-1">Al realizar el cierre, se inhabilitará la venta de tiquetes hasta el siguiente bloque.</p>
      </div>

      <div className="p-4 bg-slate-50 rounded-xl border space-y-2 text-sm font-mono text-left">
        <div className="flex justify-between border-b pb-1 text-slate-500">
          <span>Monto Registrado:</span> 
          <span className="font-bold text-slate-900">${total.toLocaleString('es-CO')}</span>
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
  );
}