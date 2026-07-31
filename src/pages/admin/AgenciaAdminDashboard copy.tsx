import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, Bus, FileText, Monitor, CalendarDays, 
  Coins, LogOut, Building2, ChevronRight, AlertTriangle, 
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Importación de las sub-vistas locales de la agencia
import { LocalUsersView } from './agencia-views/LocalUsersView';
import { DespachoBusesView } from './agencia-views/DespachoBusesView';
import { LocalResolutionsView } from './agencia-views/LocalResolutionsView';
import { DeviceInventoryView } from './agencia-views/DeviceInventoryView';
import { TravelSchedulerView } from './agencia-views/TravelSchedulerView';
import { CashClosingView } from './agencia-views/CashClosingView';
import { LocalEnviosView } from './agencia-views/LocalEnviosView';

// type AgenciaSection = 'usuarios' | 'despachos' | 'programacion' | 'resoluciones' | 'inventario' | 'cierre';
type AgenciaSection = 'usuarios' | 'despachos' | 'programacion' | 'envios' | 'resoluciones' | 'inventario' | 'cierre';
export default function AgenciaAdminDashboard() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<AgenciaSection>('despachos');

  const idAgencia = user?.id_agencia || user?.agenciaId || 1;
  const nombreAgencia = user?.municipio?.nombre || "Sucursal Local";

  const menuItems = [
    { id: 'programacion', label: 'Programar Viajes', icon: <CalendarDays className="w-5 h-5" /> },
  { id: 'despachos', label: 'Despacho y Recibo', icon: <Bus className="w-5 h-5" /> },
  { id: 'envios', label: 'Envíos y Encomiendas', icon: <Package className="w-5 h-5" /> }, // 👈 Nueva opción
  { id: 'cierre', label: 'Cierre de Caja Diario', icon: <Coins className="w-5 h-5" /> },
  { id: 'inventario', label: 'Inventario de Equipos', icon: <Monitor className="w-5 h-5" /> },
  { id: 'resoluciones', label: 'Resoluciones DIAN', icon: <FileText className="w-5 h-5" /> },
  { id: 'usuarios', label: 'Cajeros y Despachadores', icon: <Users className="w-5 h-5" /> },
] as const;

  const renderActiveView = () => {
  switch (activeSection) {
    case 'usuarios': return <LocalUsersView idAgencia={idAgencia} />;
    case 'despachos': return <DespachoBusesView idAgencia={idAgencia} />;
    case 'programacion': return <TravelSchedulerView idAgencia={idAgencia} />;
    case 'envios': return <LocalEnviosView idAgencia={idAgencia} />; // 👈 Inyección de la nueva vista
    case 'resoluciones': return <LocalResolutionsView idAgencia={idAgencia} />;
    case 'inventario': return <DeviceInventoryView idAgencia={idAgencia} />;
    case 'cierre': return <CashClosingView idAgencia={idAgencia} />;
    default: return <DespachoBusesView idAgencia={idAgencia} />;
  }
};

  return (
    <div className="flex h-screen bg-slate-100 font-sans antialiased overflow-hidden">
      
      {/* MENÚ LATERAL IZQUIERDO */}
      <aside className="w-72 bg-slate-900 text-slate-200 flex flex-col justify-between border-r border-slate-800 shadow-xl z-20">
        <div>
          <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-base tracking-wider text-white uppercase">Terminal {nombreAgencia}</h1>
              <span className="text-xs font-semibold text-blue-400 tracking-widest uppercase">Admin Agencia</span>
            </div>
          </div>

          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white uppercase">
              {user?.nombre?.slice(0, 2) || 'AD'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-white">{user?.nombre || 'Administrador'}</p>
              <p className="text-xs text-slate-400 truncate">Agencia ID: #{idAgencia}</p>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Operaciones Locales</p>
            {menuItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 group",
                    isActive 
                      ? "bg-blue-600 text-white font-semibold shadow-md" 
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(isActive ? "text-white" : "text-slate-500 group-hover:text-slate-400")}>
                      {item.icon}
                    </span>
                    {item.label}
                  </div>
                  <ChevronRight className={cn("w-4 h-4 opacity-0 transition-transform duration-200", isActive && "opacity-100 transform translate-x-1")} />
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <Button 
            variant="ghost" 
            onClick={logout}
            className="w-full justify-start text-slate-400 hover:bg-destructive/10 hover:text-destructive gap-3 font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión Agencia
          </Button>
        </div>
      </aside>

      {/* CONTENEDOR DE PÁGINAS PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="text-sm text-slate-500 font-medium">
            Agencia <span className="text-slate-800 font-bold">#{idAgencia}</span> / <span className="capitalize font-semibold text-blue-600">{activeSection}</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Alerta rápida de resolución para monitoreo en barra superior */}
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Consecutivos DIAN al 85%</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderActiveView()}
          </div>
        </div>
      </main>
    </div>
  );
}