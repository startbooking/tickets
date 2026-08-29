import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Settings, Users, Bus, Map, Building2, FileText, LogOut, ShieldAlert, LayoutDashboard, ChevronRight,
  Car,
  Store,
  ClipboardList,
  Network,
  ChevronDown,
  Menu,
  X,
  Scale,
  Ticket
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
import NotasContablesView from './views/NotasContablesView';
import TicketsVendidosView from './views/TicketsVendidosView';

type AdminSection = 'empresa' | 'usuarios' | 'buses' | 'vehiculos' |'agencias' | 'resoluciones' | 'conductores' | 'inicio' | 'mantenimiento' | 'rutas' | 'pasajeros' | 'notascontables' | 'ticketsvendidos';

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('inicio');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [configOpen, setConfigOpen] = useState(() => {
    // Si la sección activa pertenece a configuración, arranca expandido
    return ['empresa', 'usuarios', 'resoluciones', 'agencias', 'vehiculos', 'conductores'].includes(activeSection);
  });

  const [contabilidadOpen, setContabilidadOpen] = useState(() => activeSection === 'notascontables');

  // Configuración del menú dinámico con sus respectivos iconos y etiquetas
   const mainMenuItems = [
    { id: 'inicio', label: 'Consolidado General', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'buses', label: 'Flota de Buses', icon: <Bus className="w-5 h-5" /> },
    { id: 'mantenimiento', label: 'Mantenimiento Global', icon: <Bus className="w-5 h-5" /> },
    { id: 'rutas', label: 'Configuración de Rutas', icon: <Map className="w-5 h-5" /> },
    { id: 'pasajeros', label: 'Pasajeros', icon: <Users className="w-5 h-5" /> },
  ] as const;

  const contabilidadSubItems = [
    { id: 'notascontables', label: 'Notas contables', icon: <FileText className="w-4 h-4" /> },
    { id: 'ticketsvendidos', label: 'Tickets vendidos', icon: <Ticket className="w-4 h-4" /> },
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
      case 'notascontables': return <NotasContablesView />;
      case 'ticketsvendidos': return <TicketsVendidosView />;
      case 'empresa': return <GeneralSettingsView />;
      default: return <SuperAdminHome />;
    }
  };

  const toggleMenu = (close = false) => {
    setMenuAbierto(close === undefined ? !menuAbierto : close);
  };

  const SeleccionarSeccion = (id: AdminSection) => {
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

  const isConfigSection = ['empresa', 'usuarios', 'resoluciones', 'agencias', 'vehiculos', 'conductores'].includes(activeSection);

  const seccionLabel =
    ({ notascontables: 'Notas contables', ticketsvendidos: 'Tickets vendidos' } as Record<string, string>)[activeSection] ||
    activeSection;

  return (
    <div className="flex h-screen-dyn bg-slate-100 font-sans antialiased overflow-hidden">
      
      {/* ─── MENÚ LATERAL IZQUIERDO (SIDEBAR) · desktop ≥768px ─── */}
      <aside className="hidden md:flex w-72 bg-slate-900 text-slate-200 flex-col justify-between border-r border-slate-800 shadow-xl z-20 shrink-0">
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

          {/* Opciones del Menú de Configuración */}
          <nav className="p-4 space-y-1">
            <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Módulos del Sistema</p>
            {mainMenuItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => SeleccionarSeccion(item.id)}
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
                  isConfigSection
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
                        onClick={() => SeleccionarSeccion(subItem.id)}
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

            {/* ─── 📒 SUBMENÚ DESPLEGABLE: CONTABILIDAD ─── */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setContabilidadOpen(!contabilidadOpen)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150",
                  activeSection === 'notascontables' || activeSection === 'ticketsvendidos'
                    ? "text-red-400 font-semibold"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <Scale className="w-5 h-5 text-slate-500" />
                  <span>Contabilidad</span>
                </div>
                {contabilidadOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {contabilidadOpen && (
                <div className="mt-1 pl-4 space-y-1 border-l-2 border-slate-800 ml-6 animate-in slide-in-from-top-2 duration-200 overflow-y-auto max-h-80">
                  {contabilidadSubItems.map((subItem) => {
                    const isSubActive = activeSection === subItem.id;
                    return (
                      <button
                        key={subItem.id}
                        type="button"
                        onClick={() => SeleccionarSeccion(subItem.id)}
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
              "fixed top-0 left-0 h-screen-dyn w-72 max-w-[80vw] bg-slate-900 text-slate-200 flex flex-col justify-between shadow-2xl z-50 md:hidden overflow-y-auto",
              "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left motion-safe:duration-300 motion-safe:ease-out"
            )}
          >
            <div className="flex-1 min-h-0 overflow-y-auto">
              {/* Header del drawer con botón de cerrar */}
              <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500 rounded-lg text-slate-950">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="font-black text-lg tracking-wider text-white">SACTel.Cloud</h1>
                    <span className="text-xs font-semibold text-amber-400 tracking-widest uppercase">Super Admin</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleMenu(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 touch-list min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Cerrar menú"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menú de navegación */}
              <nav className="p-4 space-y-1">
                <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Módulos del Sistema</p>
                {mainMenuItems.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => SeleccionarSeccion(item.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 touch-list min-h-[44px]",
                        isActive 
                          ? "bg-red-600 text-white font-semibold shadow-md" 
                          : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn(isActive ? "text-white" : "text-slate-500")}>{item.icon}</span>
                        {item.label}
                      </div>
                      <ChevronRight className={cn("w-4 h-4 opacity-0", isActive && "opacity-100 transform translate-x-1")} />
                    </button>
                  );
                })}

                {/* ─── 🛠️ SUBMENÚ DESPLEGABLE: CONFIGURACIÓN ─── */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setConfigOpen(!configOpen)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 touch-list min-h-[44px]",
                      isConfigSection
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
                  {configOpen && (
                    <div className="mt-1 pl-4 space-y-1 border-l-2 border-slate-800 ml-6 overflow-y-auto max-h-80">
                      {configSubItems.map((subItem) => {
                        const isSubActive = activeSection === subItem.id;
                        return (
                          <button
                            key={subItem.id}
                            type="button"
                            onClick={() => SeleccionarSeccion(subItem.id)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-medium transition-colors touch-list min-h-[44px]",
                              isSubActive
                                ? "bg-slate-800 text-white font-bold border-l-2 border-red-500"
                                : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                            )}
                          >
                            <span className={isSubActive ? "text-red-500" : "text-slate-600"}>{subItem.icon}</span>
                            {subItem.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ─── 📒 SUBMENÚ DESPLEGABLE: CONTABILIDAD (móvil) ─── */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setContabilidadOpen(!contabilidadOpen)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 touch-list min-h-[44px]",
                      activeSection === 'notascontables' || activeSection === 'ticketsvendidos'
                        ? "text-red-400 font-semibold"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Scale className="w-5 h-5 text-slate-500" />
                      <span>Contabilidad</span>
                    </div>
                    {contabilidadOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {contabilidadOpen && (
                    <div className="mt-1 pl-4 space-y-1 border-l-2 border-slate-800 ml-6 overflow-y-auto max-h-80">
                      {contabilidadSubItems.map((subItem) => {
                        const isSubActive = activeSection === subItem.id;
                        return (
                          <button
                            key={subItem.id}
                            type="button"
                            onClick={() => SeleccionarSeccion(subItem.id)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-medium transition-colors touch-list min-h-[44px]",
                              isSubActive
                                ? "bg-slate-800 text-white font-bold border-l-2 border-red-500"
                                : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                            )}
                          >
                            <span className={isSubActive ? "text-red-500" : "text-slate-600"}>{subItem.icon}</span>
                            {subItem.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </nav>
            </div>

            {/* Botón Cerrar Sesión */}
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
        </>
      )}

      {/* ─── CONTENEDOR VISTA DERECHA (PÁGINAS) ─── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar Informativa */}
        <header className="h-14 md:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 md:px-8 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 font-medium">
            {/* Botón hamburguesa solo en móvil (<768px), oculto en desktop */}
            <button
              type="button"
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 touch-list min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => toggleMenu(true)}
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
            <LayoutDashboard className="w-4 h-4 text-slate-400 hidden md:inline" />
            <span className="hidden md:inline">Panel de Control</span>
            <span className="hidden md:inline">/</span>
            <span className="text-slate-800 capitalize font-semibold truncate">{seccionLabel}</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <Network /> <span className="hidden sm:inline">Entorno Desarrollo</span>
            </span>
          </div>
        </header>

        {/* Espacio inyectable de sub-páginas */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {renderActiveView()}
          </div>
        </div>
      </main>

    </div>
  );
}