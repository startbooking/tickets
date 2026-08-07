import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users, Bus, FileText, Monitor, CalendarDays,
  Coins, LogOut, Building2, ChevronRight, ChevronDown, Package, Settings,
  Wrench, Tag, Landmark, Menu, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Vistas operativas y de configuración
import { LocalUsersView } from './agencia-views/LocalUsersView';
import { DespachoBusesView } from './agencia-views/DespachoBusesView';
import { TravelSchedulerView } from './agencia-views/TravelSchedulerView';
import { LocalEnviosView } from './agencia-views/LocalEnviosView';
import { LocalResolutionsView } from './agencia-views/LocalResolutionsView';
import { DeviceInventoryView } from './agencia-views/DeviceInventoryView';
import { CashClosingView } from './agencia-views/CashClosingView';
import { LocalVehiclesView } from './agencia-views/LocalVehiclesView';
import { TarifasView } from './agencia-views/TarifasView';
import { EmpresasView } from './agencia-views/EmpresasView';


type AgenciaSection = 'inicio' | 'despachos' | 'programacion' | 'envios' | 'mantenimiento' | 'cierre' | 'usuarios' | 'inventario' | 'resoluciones' | 'tarifas' | 'empresas';
export default function AgenciaAdminDashboard() {
  // const [activeSection, setActiveSection] = useState<AgenciaSection>('despachos');
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<AgenciaSection>('inicio');
  const [menuAbierto, setMenuAbierto] = useState(false);

  // 🧭 Estado para colapsar/expandir el submenú de Configuración
  const [configOpen, setConfigOpen] = useState(() => {
    // Si la opción activa pertenece a configuración, arranca abierto
    return ['usuarios', 'inventario', 'resoluciones', 'tarifas', 'empresas'].includes(activeSection);
  });

  const getIniciales = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const nombreUsuario = user?.name || "Administrador Sede";
  const correoUsuario = user?.email || "agencia@tickets.com";

  const idAgencia = user?.id_agencia || user?.agenciaId || 1;
  const nombreAgencia = user?.municipio?.nombre || "Sucursal Local";

  // 1️⃣ Opciones principales de la operación diaria
  const mainMenuItems = [
    { id: 'despachos', label: 'Despacho y Recibo', icon: <Bus className="w-5 h-5" /> },
    { id: 'programacion', label: 'Programar Viajes', icon: <CalendarDays className="w-5 h-5" /> },
    { id: 'envios', label: 'Envíos y Encomiendas', icon: <Package className="w-5 h-5" /> },
    { id: 'mantenimiento', label: 'Mantenimiento Vehiculos', icon: <Wrench className="w-5 h-5" /> }, // 👈 Nueva opción operativa
    { id: 'cierre', label: 'Cierre de Caja Diario', icon: <Coins className="w-5 h-5" /> },
  ] as const;

  // 2️⃣ Opciones agrupadas dentro del submenú de Configuración
  const configSubItems = [
    { id: 'usuarios', label: 'Cajeros y Despachadores', icon: <Users className="w-4 h-4" /> },
    { id: 'inventario', label: 'Inventario de Equipos', icon: <Monitor className="w-4 h-4" /> },
    { id: 'tarifas', label: 'Tarifas y Rutas', icon: <Tag className="w-4 h-4" /> },
    { id: 'empresas', label: 'Empresas y Concesionarios', icon: <Landmark className="w-4 h-4" /> },
    { id: 'resoluciones', label: 'Resoluciones DIAN', icon: <FileText className="w-4 h-4" /> },
  ] as const;

  const renderActiveView = () => {
    switch (activeSection) {
      case 'despachos': return <DespachoBusesView idAgencia={idAgencia} />;
      case 'programacion': return <TravelSchedulerView idAgencia={idAgencia} />;
      case 'envios': return <LocalEnviosView idAgencia={idAgencia} />;
      case 'mantenimiento': return <LocalVehiclesView idAgencia={idAgencia} />;
      case 'cierre': return <CashClosingView idAgencia={idAgencia} />;
      case 'usuarios': return <LocalUsersView idAgencia={idAgencia} />;
      case 'inventario': return <DeviceInventoryView idAgencia={idAgencia} />;
      case 'tarifas': return <TarifasView idAgencia={idAgencia} />;
      case 'empresas': return <EmpresasView idAgencia={idAgencia} />;
      case 'resoluciones': return <LocalResolutionsView idAgencia={idAgencia} />;
      default: return <DespachoBusesView idAgencia={idAgencia} />;
    }
  };

  const toggleMenu = (close = false) => {
    setMenuAbierto(close === undefined ? !menuAbierto : close);
  };

  const SeleccionarSeccion = (id: AgenciaSection) => {
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

  const isConfigSection = ['usuarios', 'inventario', 'resoluciones', 'tarifas', 'empresas'].includes(activeSection);

  return (
    <div className="flex h-screen-dyn bg-slate-100 font-sans antialiased overflow-hidden">

      {/* MENÚ LATERAL IZQUIERDO · desktop ≥768px */}
      <aside className="hidden md:flex w-72 bg-slate-900 text-slate-200 flex-col justify-between border-r border-slate-800 shadow-xl z-20 shrink-0">
        <div>
          <div className="p-5 flex items-center gap-4 bg-slate-950">
            {/* Contenedor del ícono Azul (Identificador de Agencia) */}
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md">
              <Building2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-wide text-white">SACTel.Cloud</h1>
              <span className="text-[11px] font-bold text-blue-400 tracking-widest uppercase block mt-0.5">
                ADMIN AGENCIA
              </span>
            </div>
          </div>

          {/* ─── PERFIL DEL USUARIO ACTIVO (Abajo de la marca) ─── */}
          <div className="p-5 flex items-center gap-4 bg-slate-950/40">
            {/* Avatar circular con fondo pizarra y texto blanco */}
            <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center font-bold text-sm text-slate-200 tracking-wider shrink-0">
              {getIniciales(nombreUsuario)}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-bold text-sm text-slate-100 truncate tracking-wide">
                {nombreUsuario}
              </h4>
              <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
                {correoUsuario}
              </p>
            </div>
          </div>
          <div className="border-b border-slate-900 mb-2" />
          <nav className="p-4 space-y-1">
            <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Operaciones</p>

            {/* Renderizado de opciones principales */}
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
                  <ChevronRight className={cn("w-4 h-4 opacity-0 transition-transform", isActive && "opacity-100 transform translate-x-1")} />
                </button>
              );
            })}

            {/* ─── 🛠️ SUBMENÚ DESPLEGABLE DE CONFIGURACIÓN ─── */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setConfigOpen(!configOpen)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150",
                  isConfigSection
                    ? "text-blue-400 font-semibold"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-slate-500" />
                  <span>Configuración local</span>
                </div>
                {configOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {/* Contenedor colapsable animado con scroll para >= 5 opciones */}
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
                            ? "bg-slate-800 text-white font-bold border-l-2 border-blue-500"
                            : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                        )}
                      >
                        <span className={isSubActive ? "text-blue-500" : "text-slate-600"}>
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
        {/* CERRAR SESIÓN */}
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
            <div>
              {/* Header del drawer con botón de cerrar */}
              <div className="p-5 flex items-center justify-between bg-slate-950">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
                    <Building2 className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h1 className="font-black text-lg tracking-wide text-white">SACTel.Cloud</h1>
                    <span className="text-[10px] font-bold text-blue-400 tracking-widest uppercase block">ADMIN AGENCIA</span>
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

              {/* Perfil del usuario */}
              <div className="p-5 flex items-center gap-3 bg-slate-950/40 border-b border-slate-900">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center font-bold text-sm text-slate-200 tracking-wider shrink-0">
                  {getIniciales(nombreUsuario)}
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-bold text-sm text-slate-100 truncate">{nombreUsuario}</h4>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{correoUsuario}</p>
                </div>
              </div>
              <div className="border-b border-slate-900 mb-2" />

              {/* Menú de navegación */}
              <nav className="p-3 space-y-1">
                <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Operaciones</p>
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
                          ? "bg-blue-600 text-white font-semibold shadow-md"
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

                {/* ─── 🛠️ SUBMENÚ DESPLEGABLE DE CONFIGURACIÓN ─── */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setConfigOpen(!configOpen)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 touch-list min-h-[44px]",
                      isConfigSection
                        ? "text-blue-400 font-semibold"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="w-5 h-5 text-slate-500" />
                      <span>Configuración local</span>
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
                              "w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-medium transition-all duration-150 touch-list min-h-[44px]",
                              isSubActive
                                ? "bg-slate-800 text-white font-bold border-l-2 border-blue-500"
                                : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                            )}
                          >
                            <span className={isSubActive ? "text-blue-500" : "text-slate-600"}>
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
            {/* CERRAR SESIÓN */}
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
        </>
      )}

      {/* CONTENEDOR DE PÁGINAS PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-hidden" >
        <header className="h-14 md:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 md:px-8 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 font-medium">
            <button
              type="button"
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 touch-list min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => toggleMenu(true)}
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="truncate">Agencia <span className="text-slate-800 font-bold">#{idAgencia}</span> / <span className="capitalize font-semibold text-blue-600">{activeSection}</span></span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderActiveView()}
          </div>
        </div>
      </main>

    </div>
  );
}