import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { TicketForm } from '@/components/tickets/TicketForm';
import { TicketList } from '@/components/tickets/TicketList';
import { BusList } from '@/components/buses/BusList';
import { ConsolidatedReport } from '@/components/reports/ConsolidatedReport';
import { EnvioDineroForm } from '@/components/envios/EnvioDineroForm';
import { EnvioList } from '@/components/envios/EnvioList';

import { useTickets } from '@/hooks/useTickets';
import { useEnvioDinero } from '@/hooks/useEnvioDinero';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bus, Ticket, LayoutDashboard, LogOut, PlusCircle, Printer, User, ChevronDown, Wifi, WifiOff, Send
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
// import { ticketsService } from '@/services/tiqueteService';
import { PlanillaDespacho, TiqueteTransporteDTO } from '@/types';
import { dianService } from '@/services/dianService';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { tickets, cancelTicket, printer } = useTickets();
  const { 
    envios, 
    loading: enviosLoading, 
    createEnvio, 
    cancelEnvio, 
    markAsDelivered 
  } = useEnvioDinero();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [showEnvioForm, setShowEnvioForm] = useState(false);
  const [showConsolidated, setShowConsolidated] = useState(false);
  const [ticketEmitiendo, setTicketEmitiendo] = useState(false);

  // 🔒 Cabeceras Operativas y de Seguridad SACTel
  const authHeaders = {
    'x-user-id': user?.id || 0,
    'x-user-role': user?.rol || 'CAJERO',
  };
  const idAgencia = user?.id_agencia || 1;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCreateTicket = async (planilla: PlanillaDespacho, payloadDian: TiqueteTransporteDTO) => {
  setTicketEmitiendo(true);
  
  try {
    console.log("🚀 Despachando JSON Payload Estructurado hacia Core DIAN:", payloadDian);
    
    // 1. Un solo viaje de red: Persiste Pasajero + Tiquete + Comunicación DIAN (CUFE)
    const resultado = await dianService.emitirTiqueteTransporte(payloadDian, authHeaders);
    
    if (resultado && resultado.success && resultado.data?.cufe) {
      const { cufe, qr_dian, numero_factura } = resultado.data;

      toast.success(`Tiquete electrónico ${numero_factura} autorizado legítimamente por la DIAN.`);

      // 2. Disparo de impresión física inmediata en hardware POS conectado
      if (printer && printer.isConnected) {
        toast.info('Enviando comandos ESC/POS a la TM-U220D...');
        
        await printer.printTicket({
          factura: numero_factura || '',
          pasajero: `${payloadDian.datos_pasajero?.nombres ?? ''} ${payloadDian.datos_pasajero?.apellidos ?? ''}`.trim(),
          documento: payloadDian.datos_pasajero?.numero_documento ?? '',
          origen: payloadDian.datos_viaje?.origen ?? payloadDian.ciudad_origen ?? '',
          destino: payloadDian.datos_viaje?.destino ?? payloadDian.ciudad_destino ?? '',
          silla: Number(payloadDian.datos_viaje?.numero_asiento ?? payloadDian.numero_asiento) || 0,
          valor: payloadDian.datos_viaje?.valor_tiquete ?? payloadDian.total ?? 0,
          formaPago: payloadDian.forma_pago ?? 'EFECTIVO',
          cufe: cufe,        
          qr: qr_dian        
        });
      } else {
        console.warn("Impresora TMU fuera de línea.");
        toast.warning('Tiquete legalizado ante DIAN, pero la impresora TMU física está desconectada.');
      }

      setShowTicketForm(false);
    } else {
      throw new Error(resultado?.message || 'La DIAN rechazó el documento o el formato de respuesta es inválido.');
    }
  } catch (error) {
  let mensajeErrores = 'El Web Service de la DIAN no respondió o los datos son erróneos.';

  // Verificamos si el backend envió el arreglo de campos faltantes/inválidos ("detail")
  const httpError = (typeof error === 'object' && error !== null ? error : {}) as {
    detail?: unknown;
    response?: { data?: { message?: string } };
  };
  const detallesError = httpError.detail;
    if (Array.isArray(detallesError)) {
    mensajeErrores = detallesError
      .map((err: { loc?: unknown; msg?: unknown; type?: unknown }) => {
        // Obtenemos la ruta del campo (ej: "datos_pasajero -> nombre_pasajero" o "items")
        const campo = Array.isArray(err.loc) ? err.loc.slice(1).join(' ➔ ') : 'campo';
        
        // Traducimos mensajes comunes de Pydantic/FastAPI para el cajero
        let motivo = String(err.msg ?? '');
        if (err.type === 'missing') motivo = 'Es obligatorio y no se envió';
        
        return `• <b>${campo}</b>: ${motivo}`;
      })
      .join('<br/>'); // Separador de línea HTML para SweetAlert2
  } else if (httpError.response?.data?.message) {
    mensajeErrores = httpError.response.data.message;
  }
    Swal.fire({
    title: 'Campos Requeridos por la DIAN',
    html: `<div style="text-align: left; font-size: 0.95rem; margin-top: 10px;">
             <p style="margin-bottom: 12px; font-weight: bold; color: #ef4444;">
               El JSON enviado no coincide con el esquema fiscal. Por favor añade:
             </p>
             ${mensajeErrores}
           </div>`,
    icon: 'error',
    confirmButtonText: 'Corregir Estructura',
    confirmButtonColor: '#f43f5e'
  });
  } finally {
    setTicketEmitiendo(false);
  }
};
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header del Dashboard */}
      <header className="h-16 flex-shrink-0 border-b border-border bg-card flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src="logo.png" alt="TransTicket" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground leading-tight">TransTicket</span>
            <span className="text-xs text-muted-foreground">Panel de Control</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            onClick={() => {
              setActiveTab('tickets');
              setShowTicketForm(true);
            }}
            className="gap-2 bg-secondary hover:bg-secondary/90"
          >
            <PlusCircle className="w-4 h-4" />
            Crear Ticket
          </Button>

          <Button 
            variant={printer.isConnected ? "default" : "outline"}
            onClick={printer.isConnected ? printer.disconnectPrinter : printer.connectPrinter}
            className="gap-2"
            title={printer.isConnected ? "Impresora conectada" : "Conectar impresora TMU"}
          >
            {printer.isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span className="hidden md:inline">TMU</span>
          </Button>

          <Button variant="outline" onClick={() => setShowConsolidated(true)} className="gap-2">
            <Printer className="w-4 h-4" />
            Consolidado
          </Button>

          {/* Menú de usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <span className="hidden md:inline">{user?.nombre}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{user?.nombre}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-muted-foreground">
                Municipio: {user?.municipio?.nombre || 'No asignado'}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-muted-foreground">
                Tipo: {user?.tipoVinculacion || 'Regular'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Tabs Container */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-card border-b border-border px-4 md:px-6 py-2">
          <TabsList className="h-12">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="tickets" className="gap-2">
              <Ticket className="w-4 h-4" />
              <span className="hidden sm:inline">Tickets</span>
            </TabsTrigger>
            <TabsTrigger value="envios" className="gap-2">
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Envíos</span>
            </TabsTrigger>
            <TabsTrigger value="buses" className="gap-2">
              <Bus className="w-4 h-4" />
              <span className="hidden sm:inline">Buses</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            <TabsContent value="dashboard" className="space-y-6 mt-0">
              <DashboardStats authHeaders={authHeaders} idAgencia={idAgencia} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Últimos Tickets</h2>
                  <TicketList tickets={tickets.slice(0, 5)} onCancel={cancelTicket} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-4">Flota de Buses</h2>
                  <BusList authHeaders={authHeaders} idAgencia={idAgencia} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tickets" className="space-y-6 mt-0">
              {showTicketForm ? (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Crear Nuevo Ticket</h2>
                    <Button variant="outline" onClick={() => setShowTicketForm(false)}>
                      Ver Lista de Tickets
                    </Button>
                  </div>
                  <TicketForm 
                    onSubmit={handleCreateTicket} 
                    loading={ticketEmitiendo} 
                    authHeaders={authHeaders}
                    idAgencia={idAgencia}
                  />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Tickets Vendidos</h2>
                    <Button onClick={() => setShowTicketForm(true)} className="gap-2">
                      <PlusCircle className="w-4 h-4" />
                      Nuevo Ticket
                    </Button>
                  </div>
                  <TicketList tickets={tickets} onCancel={cancelTicket} />
                </>
              )}
            </TabsContent>

            <TabsContent value="envios" className="space-y-6 mt-0">
              {showEnvioForm ? (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Nuevo Envío de Dinero</h2>
                    <Button variant="outline" onClick={() => setShowEnvioForm(false)}>
                      Ver Lista de Envíos
                    </Button>
                  </div>
                  {user?.municipio && (
                    <EnvioDineroForm 
                      onSubmit={createEnvio} 
                      loading={enviosLoading} 
                      municipioOrigen={user.municipio}
                      authHeaders={authHeaders}
                      idAgencia={idAgencia}
                    />
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Envíos de Dinero</h2>
                    <Button onClick={() => setShowEnvioForm(true)} className="gap-2">
                      <PlusCircle className="w-4 h-4" />
                      Nuevo Envío
                    </Button>
                  </div>
                  <EnvioList 
                    envios={envios} 
                    onCancel={cancelEnvio}
                    onMarkDelivered={markAsDelivered}
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value="buses" className="mt-0">
              <h2 className="text-xl font-bold mb-6">Gestión de Flota</h2>
              <BusList authHeaders={authHeaders} idAgencia={idAgencia} />
            </TabsContent>
          </div>
        </main>
      </Tabs>

      <ConsolidatedReport 
        open={showConsolidated} 
        onOpenChange={setShowConsolidated}
        tickets={tickets}
      />
    </div>
  );
}