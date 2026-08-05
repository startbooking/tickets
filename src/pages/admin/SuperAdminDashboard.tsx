import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Settings, Users, Bus, Map, ShieldCheck, Building2, FileText, LogOut, ShieldAlert, LayoutDashboard, ChevronRight,
  Car,
  Store,
  ClipboardList,
  Network,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Importación de las sub-páginas/vistas de configuración
import { GeneralSettingsView } from './views/GeneralSettingsView';
import { UsersManagementView } from './views/UsersManagementView';
import { BusesManagementView } from './views/BusesManagementView';
import { ResolutionsManagementView } from './views/ResolutionsManagementView';
import { DriversManagementView } from './views/DriversManagementView';
import { AgenciesManagementView } from './views/AgenciesManagementView';

import SuperAdminHome from './SuperAdminHome';
import { SuperMaintenanceView } from './views/SuperMaintenanceView';
import { SuperRoutesView } from './views/SuperRoutesView';
import { SuperFleetView } from './views/SuperFleetView';
import { PassengersManagementView } from './views/PassengersManagementView';

type AdminSection = 'empresa' | 'usuarios' | 'buses' | 'vehiculos' |'agencias' | 'resoluciones' | 'conductores' | 'inicio' | 'mantenimiento' | 'rutas' | 'pasajeros';

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('inicio');
  const [configOpen, setConfigOpen] = useState(() => {
    // Si la sección activa pertenece a configuración, arranca expandido
    return ['empresa', 'usuarios', 'resoluciones', 'agencias', 'vehiculos', 'conductores'].includes(activeSection);
  });

  // Configuración del menú dinámico con sus respectivos iconos y etiquetas
  const mainMenuItems = [
    { id: 'inicio', label: 'Consolidado General', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'buses', label: 'Flota de Buses', icon: <Bus className="w-5 h-5" /> },
    { id: 'mantenimiento', label: 'Mantenimiento Global', icon: <Bus className="w-5 h-5" /> },
    { id: 'rutas', label: 'Configuración de Rutas', icon: <Map className="w-5 h-5" /> },
    { id: 'pasajeros', label: 'Pasajeros', icon: <Users className="w-5 h-5" /> },
  ] as const;

  const configSubItems = [
    { id: 'empresa', label: 'Empresa', icon: <Building2 className="w-4 h-4" /> },
    { id: 'usuarios', label: 'Usuarios del Sistema', icon: <Users className="w-4 h-4" /> },
    { id: 'resoluciones', label: 'Resoluciones Facturación', icon: <FileText className="w-4 h-4" /> },
    { id: 'agencias', label: 'Agencias / Sucursales', icon: <Store className="w-4 h-4" /> },
    { id: 'vehiculos', label: 'Vehiculos ', icon: <Car className="w-4 h-4" /> },
    { id: 'conductores', label: 'Conductores / Asistentes', icon: <ClipboardList className="w-4 h-4" /> },
  ] as const;

  // Renderizado condicional de la sub-página activa
  const renderActiveView = () => {
    switch (activeSection) {
      case 'usuarios': return <UsersManagementView />;
      case 'vehiculos': return <BusesManagementView />;
      case 'buses': return <SuperFleetView />;
      case 'agencias': return <AgenciesManagementView />;
      case 'resoluciones': return <ResolutionsManagementView />;
      case 'conductores': return <DriversManagementView />;
      case 'inicio':return <SuperAdminHome />;
      case 'mantenimiento':return <SuperMaintenanceView />;
      case 'rutas':return <SuperRoutesView />;
      case 'pasajeros': return <PassengersManagementView />;
      case 'empresa': return <GeneralSettingsView />;
      default: return <SuperAdminHome />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans antialiased overflow-hidden">
      
      {/* ─── MENÚ LATERAL IZQUIERDO (SIDEBAR) ─── */}
      <aside className="w-72 bg-slate-900 text-slate-200 flex flex-col justify-between border-r border-slate-800 shadow-xl z-20">
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Header del Sidebar */}
          <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg text-slate-950">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-wider text-white">SACTel.Cloud</h1>
              <span className="text-xs font-semibold text-amber-400 tracking-widest uppercase">Super Admin</span>
            </div>
          </div>

          {/* Información del perfil logueado */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white uppercase">
              {user?.name?.slice(0, 2) || 'AD'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-white">{user?.name || 'Administrador Global'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || 'root@sactel.lan'}</p>
            </div>
          </div>

          {/* Opciones del Menú de Configuración */}
          <nav className="p-4 space-y-1">
            <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Módulos del Sistema</p>
            {/* {menuItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 group",
                    isActive 
                      ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20" 
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
            })} */}
            {mainMenuItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 group",
                    isActive 
                      ? "bg-red-600 text-white font-semibold shadow-md" 
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(isActive ? "text-white" : "text-slate-500 group-hover:text-slate-400")}>
                      {item.icon}
                    </span>
                    {item.label}
                  </div>
                  <ChevronRight className={cn("w-4 h-4 opacity-0 transition-transform", isActive && "opacity-100 transform translate-x-1")} />
                </button>
              );
            })}

            {/* ─── 🛠️ SUBMENÚ DESPLEGABLE: CONFIGURACIÓN ─── */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setConfigOpen(!configOpen)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150",
                  ['empresa', 'usuarios', 'resoluciones', 'agencias', 'vehiculos', 'conductores'].includes(activeSection)
                    ? "text-red-400 font-semibold"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-slate-500" />
                  <span>Configuración</span>
                </div>
                {configOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {/* Contenedor del Submenú con sangría visual y scroll para >= 5 opciones */}
              {configOpen && (
                <div className="mt-1 pl-4 space-y-1 border-l-2 border-slate-800 ml-6 animate-in slide-in-from-top-2 duration-200 overflow-y-auto max-h-80">
                  {configSubItems.map((subItem) => {
                    const isSubActive = activeSection === subItem.id;
                    return (
                      <button
                        key={subItem.id}
                        type="button"
                        onClick={() => setActiveSection(subItem.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-medium transition-all duration-150",
                          isSubActive
                            ? "bg-slate-800 text-white font-bold border-l-2 border-red-500"
                            : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                        )}
                      >
                        <span className={isSubActive ? "text-red-500" : "text-slate-600"}>
                          {subItem.icon}
                        </span>
                        {subItem.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Botón Cerrar Sesión en el pie del menú */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <Button 
            variant="ghost" 
            onClick={logout}
            className="w-full justify-start text-slate-400 hover:bg-destructive/10 hover:text-destructive gap-3 font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión Master
          </Button>
        </div>
      </aside>

      {/* ─── CONTENEDOR VISTA DERECHA (PÁGINAS) ─── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar Informativa */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            <span>Panel de Control</span>
            <span>/</span>
            <span className="text-slate-800 capitalize font-semibold">{activeSection}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <Network /> Entorno Desarrollo
            </span>
          </div>
        </header>

        {/* Espacio inyectable de sub-páginas */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {renderActiveView()}
          </div>
        </div>
      </main>

    </div>
  );
}