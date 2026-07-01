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
  Bus, 
  Ticket, 
  LayoutDashboard, 
  LogOut, 
  PlusCircle, 
  Printer,
  User,
  ChevronDown,
  Wifi,
  WifiOff,
  Send
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { tickets, loading, createTicket, cancelTicket, printer } = useTickets();
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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (

    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header del Dashboard - Fijo */}
      <header className="h-16 flex-shrink-0 border-b border-border bg-card flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src="logo.png" alt="" />
            {/* <Bus className="w-6 h-6 text-primary-foreground" /> */}
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground leading-tight">TransTicket</span>
            <span className="text-xs text-muted-foreground">Panel de Control</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Botones de acción */}
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

          {/* Printer connection status */}
          <Button 
            variant={printer.isConnected ? "default" : "outline"}
            onClick={printer.isConnected ? printer.disconnectPrinter : printer.connectPrinter}
            className="gap-2"
            title={printer.isConnected ? "Impresora conectada" : "Conectar impresora TMU"}
          >
            {printer.isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span className="hidden md:inline">TMU</span>
          </Button>

          <Button 
            variant="outline" 
            onClick={() => setShowConsolidated(true)}
            className="gap-2"
          >
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
                <span className="hidden md:inline">{user?.nombreCompleto}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{user?.nombreCompleto}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-muted-foreground">
                Municipio: {user?.municipio?.nombre}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-muted-foreground">
                Tipo: {user?.tipoVinculacion}
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

{/* Tabs Container - Estructura con tabs fijos y contenido scrollable */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        {/* TabsList - Fijo debajo del header */}
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
        {/* Contenido principal - Scrollable */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6 mt-0">
              <DashboardStats />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Últimos Tickets</h2>
                  <TicketList 
                    tickets={tickets.slice(0, 5)} 
                    onCancel={cancelTicket} 
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-4">Flota de Buses</h2>
                  <BusList />
                </div>
              </div>
            </TabsContent>
            {/* Tickets Tab */}
            <TabsContent value="tickets" className="space-y-6 mt-0">
              {showTicketForm ? (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Crear Nuevo Ticket</h2>
                    <Button variant="outline" onClick={() => setShowTicketForm(false)}>
                      Ver Lista de Tickets
                    </Button>
                  </div>
                  <TicketForm onSubmit={createTicket} loading={loading} />
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
            {/* Envios Tab */}
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
            {/* Buses Tab */}
            <TabsContent value="buses" className="mt-0">
              <h2 className="text-xl font-bold mb-6">Gestión de Flota</h2>
              <BusList />
            </TabsContent>
          </div>
        </main>
      </Tabs>
      {/* Modal de Consolidado */}
      <ConsolidatedReport 
        open={showConsolidated} 
        onOpenChange={setShowConsolidated}
        tickets={tickets}
      />
    </div>
  );
}
