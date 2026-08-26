import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Search, UserCheck, Armchair, CreditCard, Ticket, 
  FileCheck, ShieldAlert, Coins, Landmark, ReceiptText, FileDown
} from "lucide-react";
import { toast } from "sonner";
import { generarLibroDeViaje } from "@/utils/libroDeViajePdf";

// Interfaces del Dominio de Taquilla
interface Pasajero {
  documento: string;
  nombre: string;
  correo: string;
}

export function TaquillaVentaView() {
  // ─── ESTADOS DE BÚSQUEDA DE VIAJE ───
  const [destino, setDestino] = useState('');
  const [fecha, setFecha] = useState('');
  const [viajeSeleccionado, setViajeSeleccionado] = useState<{
    id: string;
    hora: string;
    destino: string;
    vehiculo: string;
    ruta: string;
  } | null>(null);

  // ─── ESTADOS DEL PASAJERO ───
  const [documento, setDocumento] = useState('');
  const [pasajero, setPasajero] = useState<Pasajero | null>(null);

  // ─── ESTADOS DEL MAPA DEL AUTOBÚS (Piso 1 - 20 Asientos) ───
  const [asientoSeleccionado, setAsientoSeleccionado] = useState<number | null>(null);
  const asientosOcupados = [3, 4, 7, 12, 16];

  // ─── ESTADOS DE RECAUDO Y CAJA ───
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TARJETA'>('EFECTIVO');
  const [facturaEmitida, setFacturaEmitida] = useState<{
    tiqueteId: string;
    cufe: string;
    facturaNumero: string;
    fechaEmision: string;
  } | null>(null);
  const [procesandoVenta, setProcesandoVenta] = useState(false);
  const [totalCajaTurno, setTotalCajaTurno] = useState(145000); // Acumulado de la caja del turno

  const precioTiquete = 85000;

  // 🔍 Simular búsqueda de disponibilidad de autobuses
  const handleBuscarViaje = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destino || !fecha) {
      toast.error("Por favor indique destino y fecha de viaje");
      return;
    }
    setViajeSeleccionado({
      id: "V-902",
      hora: "14:30",
      destino: destino,
      vehiculo: "Bus 405 (Premium Star)",
      ruta: `Bogotá Directo a ${destino}`
    });
    toast.success("Horarios y disponibilidad encontrados.");
  };

  // 🪪 Simular consulta de cliente en Base de Datos de la empresa
  const handleBuscarPasajero = () => {
    if (!documento) return;
    setProcesandoVenta(true);
    
    // Simulación de respuesta de API
    setTimeout(() => {
      setPasajero({
        documento: documento,
        nombre: "Carlos Eduardo Mendoza",
        correo: "carlos.mendoza@email.com"
      });
      setProcesandoVenta(false);
      toast.success("Pasajero verificado en el sistema central.");
    }, 600);
  };

  // ⚡ PROCESO DE VENTA & CONEXIÓN API DIAN (Uso de variables de entorno ficticias)
  const handleEmitirVenta = async () => {
    if (!viajeSeleccionado || !pasajero || !asientoSeleccionado) {
      toast.error("Faltan datos obligatorios (Viaje, Pasajero o Asiento)");
      return;
    }

    setProcesandoVenta(true);
    toast.loading("Conectando con Backend... Firmando XML y solicitando CUFE a la DIAN");

    // Simulación del ciclo backend usando configuraciones del .env
    setTimeout(() => {
      toast.dismiss();
      
      // Generación de Hash CUFE aleatorio para la demostración
      const cufeGenerado = "6e5c8a4b7f3d2e1a9c8b7f6e5d4c3b2a1f0e9d8c7b6a5f4e";
      
      setFacturaEmitida({
        tiqueteId: `TK-${Math.floor(Math.random() * 90000) + 10000}`,
        cufe: cufeGenerado,
        facturaNumero: `SETT-${Math.floor(Math.random() * 5000) + 1}`,
        fechaEmision: new Date().toLocaleString()
      });

      setTotalCajaTurno(prev => prev + precioTiquete);
      setProcesandoVenta(false);
      toast.success("¡Venta completada con éxito! Factura electrónica DIAN autorizada.");
    }, 2500);
  };

  // 💵 Arqueo y Cierre de turno del cajero
  const handleCierreCaja = () => {
    toast.info(`Cierre procesado. Total recaudado en el turno: $${totalCajaTurno.toLocaleString('es-CO')} COP. Imprimiendo tirilla Z...`);
  };

  // 🚌 Despachar el vehículo y generar el "Libro de Viaje" en PDF
  const handleDespacharViaje = () => {
    if (!viajeSeleccionado) {
      toast.error("Primero consulte y seleccione un viaje disponible.");
      return;
    }
    generarLibroDeViaje({
      codigoViaje: viajeSeleccionado.id,
      fecha: fecha || new Date().toISOString().slice(0, 10),
      horaSalida: viajeSeleccionado.hora,
      ruta: viajeSeleccionado.ruta,
      destino: viajeSeleccionado.destino,
      vehiculo: viajeSeleccionado.vehiculo,
      pasajeros:
        pasajero && asientoSeleccionado
          ? [{
              nombre: pasajero.nombre,
              documento: pasajero.documento,
              asiento: asientoSeleccionado,
              tiquete: facturaEmitida?.tiqueteId ?? "—",
            }]
          : [],
    });
    toast.success("Libro de Ruta enviado a la impresora.");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen text-slate-800 font-sans antialiased">
      
      {/* HEADER DE LA TAQUILLA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Módulo de Ventas y Recaudo</h1>
          <p className="text-sm text-slate-500">Atención presencial, asignación de pasajes y facturación electrónica integrada.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">Fondo en Caja Actual</span>
            <span className="text-lg font-black text-emerald-600">${totalCajaTurno.toLocaleString('es-CO')} COP</span>
          </div>
          <Button onClick={handleCierreCaja} size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 font-bold">
            Realizar Arqueo / Cierre
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA 1: BÚSQUEDA Y DATOS DEL CLIENTE */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* 1. DISPONIBILIDAD */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <Search className="w-4 h-4 text-blue-600" /> 1. Disponibilidad de Rutas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBuscarViaje} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Destino Solicitado</Label>
                  <Input placeholder="Ej: Medellín o Bucaramanga" value={destino} onChange={(e) => setDestino(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fecha de Salida</Label>
                  <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
                </div>
                <Button type="submit" size="sm" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold">
                  Consultar Horarios
                </Button>
              </form>

              {viajeSeleccionado && (
                <div className="mt-4 p-3 rounded-lg border border-blue-100 bg-blue-50/50 text-xs space-y-1 animate-fadeIn">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{viajeSeleccionado.id} • Hora: {viajeSeleccionado.hora}</span>
                    <Badge className="bg-blue-600 text-white">Disponible</Badge>
                  </div>
                  <p className="text-slate-600 font-medium">{viajeSeleccionado.ruta}</p>
                  <p className="text-slate-400 font-mono text-[10px]">{viajeSeleccionado.vehiculo}</p>
                  <Button
                    type="button"
                    onClick={handleDespacharViaje}
                    className="w-full h-9 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs tracking-wide shadow flex items-center justify-center gap-2"
                  >
                    <FileDown className="w-4 h-4" /> Despachar vehiculo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. REGISTRO DE PASAJERO */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <UserCheck className="w-4 h-4 text-blue-600" /> 2. Datos del Pasajero
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Documento de Identidad (C.C. / P.P.)</Label>
                <div className="flex gap-2">
                  <Input placeholder="Número de cédula" value={documento} onChange={(e) => setDocumento(e.target.value)} />
                  <Button type="button" size="sm" onClick={handleBuscarPasajero} className="bg-slate-100 border text-slate-700 hover:bg-slate-200 px-3">
                    Buscar
                  </Button>
                </div>
              </div>

              {pasajero && (
                <div className="p-3 border rounded-lg bg-slate-50 space-y-1 text-xs">
                  <p className="font-bold text-slate-900">{pasajero.nombre}</p>
                  <p className="text-slate-500">{pasajero.correo}</p>
                  <p className="text-[10px] text-slate-400 font-mono">CC: {pasajero.documento}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA 2: MAPA INTERACTIVO DE ASIENTOS */}
        <div className="lg:col-span-1">
          <Card className="bg-white border-slate-200 shadow-sm h-full flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <Armchair className="w-4 h-4 text-blue-600" /> 3. Croquis Interactivo del Bus
              </CardTitle>
              <CardDescription className="text-xs">Seleccione la silla solicitada por el viajero.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between items-center">
              
              {/* Contenedor Visual del Bus */}
              <div className="w-56 border-4 border-slate-300 rounded-t-3xl rounded-b-xl p-4 bg-slate-100 shadow-inner space-y-4">
                
                {/* Cabina del Piloto */}
                <div className="border-b-2 border-slate-300 pb-2 flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span>[ VOLANTE ]</span>
                  <span className="px-2 py-0.5 bg-slate-200 rounded">PUERTA</span>
                </div>

                {/* Grilla de Asientos (Pasillo en el medio) */}
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 20 }, (_, i) => {
                    const numeroAsiento = i + 1;
                    const estaOcupado = asientosOcupados.includes(numeroAsiento);
                    const estaSeleccionado = asientoSeleccionado === numeroAsiento;

                    // Dejar el pasillo en la columna del medio simulando distribución de buses (Ventana - Pasillo - Ventana)
                    const esPasillo = i % 4 === 2;

                    return (
                      <div key={numeroAsiento} className="flex justify-center items-center">
                        {esPasillo && <div className="w-2" />} {/* Espaciador del pasillo central */}
                        <button
                          type="button"
                          disabled={estaOcupado}
                          onClick={() => setAsientoSeleccionado(numeroAsiento)}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs border transition-all ${
                            estaOcupado 
                              ? "bg-slate-300 border-slate-400 text-slate-500 cursor-not-allowed" 
                              : estaSeleccionado
                                ? "bg-emerald-600 border-emerald-700 text-white shadow-md animate-pulse"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-400"
                          }`}
                        >
                          {numeroAsiento}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Leyenda de Estados */}
              <div className="flex gap-4 text-[10px] font-semibold text-slate-500 mt-4 border-t pt-3 w-full justify-center">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-white border rounded" /> Libre</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-300 rounded" /> Ocupado</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-600 rounded" /> Seleccionado</span>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* COLUMNA 3: RECAUDO, MONITOREO .ENV & FACTURACIÓN DIAN */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <CreditCard className="w-4 h-4 text-blue-600" /> 4. Pasarela de Caja y Despacho
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Resumen Financiero de la Venta */}
              <div className="p-3 bg-slate-900 text-slate-100 rounded-xl space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Asiento Asignado: {asientoSeleccionado || "Ninguno"}</span>
                  <span>Tarifa Plena</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                  <span className="font-bold text-sm">TOTAL A RECAUDAR:</span>
                  <span className="text-xl font-black text-emerald-400">${precioTiquete.toLocaleString('es-CO')}</span>
                </div>
              </div>

              {/* Selector de Método de Recaudo */}
              <div className="space-y-1.5">
                <Label className="text-xs">Método de Recibo de Dinero</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMetodoPago('EFECTIVO')}
                    className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      metodoPago === 'EFECTIVO' ? "bg-slate-100 border-slate-400 text-slate-900 shadow-sm" : "bg-white text-slate-500"
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5" /> Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodoPago('TARJETA')}
                    className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      metodoPago === 'TARJETA' ? "bg-slate-100 border-slate-400 text-slate-900 shadow-sm" : "bg-white text-slate-500"
                    }`}
                  >
                    <Landmark className="w-3.5 h-3.5" /> Tarjeta / Datáfono
                  </button>
                </div>
              </div>

              {/* BOTÓN CRÍTICO DE DISPARO AL BACKEND (XML/CUFE DIAN) */}
              <Button
                type="button"
                onClick={handleEmitirVenta}
                disabled={procesandoVenta || !asientoSeleccionado || !pasajero}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm tracking-wide shadow-md flex items-center justify-center gap-2"
              >
                <Ticket className="w-4 h-4" /> VENDER & EMITIR FACTURA ELECTRÓNICA
              </Button>

              {/* Alerta Informativa que conecta con la arquitectura del .env */}
              <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex gap-2 text-[10px] text-slate-500 font-medium">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p>El botón usa el endpoint seguro configurado en el archivo <code className="bg-slate-200 px-1 rounded font-mono text-slate-900">.env</code> para el firmado digital del documento XML y validación previa ante la DIAN.</p>
              </div>

            </CardContent>
          </Card>

          {/* VISTA DEL TIQUETE DIGITAL AUTORIZADO DIAN */}
          {facturaEmitida && (
            <Card className="bg-white border-dashed border-2 border-slate-300 shadow-md animate-fadeIn">
              <CardHeader className="pb-2 text-center border-b border-dashed">
                <div className="mx-auto w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center mb-1">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <CardTitle className="text-xs font-black tracking-widest text-slate-900">TIQUETE DE VIAJE DIGITAL</CardTitle>
                <p className="text-[10px] text-slate-400 font-mono">Factura No: {facturaEmitida.facturaNumero}</p>
              </CardHeader>
              <CardContent className="pt-3 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Pasajero:</span>
                  <span className="font-bold text-slate-800">{pasajero?.nombre.substring(0, 18)}..</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Silla:</span>
                  <span className="font-bold text-slate-900 bg-slate-100 px-2 rounded">No. {asientoSeleccionado}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vehículo:</span>
                  <span className="font-bold text-slate-800">{viajeSeleccionado?.id}</span>
                </div>
                <div className="pt-2 border-t border-dashed space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block flex items-center gap-1">
                    <ReceiptText className="w-3 h-3 text-emerald-600" /> CÓDIGO ÚNICO CUFE DIAN:
                  </span>
                  <p className="text-[9px] text-slate-500 bg-slate-50 p-1.5 rounded break-all leading-tight border">
                    {facturaEmitida.cufe}
                  </p>
                </div>
                <p className="text-[9px] text-center text-slate-400 pt-1">Emitido el: {facturaEmitida.fechaEmision}</p>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}