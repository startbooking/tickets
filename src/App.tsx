import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppRol, DASHBOARD_POR_ROL } from "@/services/travelsoftService";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Logout from "./pages/Logout";

// Los dashboards se cargan bajo demanda (code-splitting) para reducir el
// bundle inicial y la carga de los terminales (PDAs).
const SuperAdminDashboard = lazy(() => import("./pages/admin/SuperAdminDashboard"));
const AgenciaAdminDashboard = lazy(() => import("./pages/admin/AgenciaAdminDashboard"));
const CajeroDashboard = lazy(() => import("./pages/cajero/CajeroDashboard"));
const SateliteDashboard = lazy(() => import("./pages/satelite/SateliteDashboard"));


const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole?: string | string[] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white font-medium">
        Cargando SACTel.Cloud...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Obtenemos el rol sin importar si viene como "rol" o como "role"
  const userRole = (user.role || user.rol || '').toUpperCase();
  const allowedRoles = allowedRole
    ? (Array.isArray(allowedRole) ? allowedRole : [allowedRole]).map(r => r.toUpperCase())
    : undefined;

  // Si la ruta requiere un rol específico y el usuario no lo tiene
  if (allowedRoles && userRole !== 'SUPERADMIN' && !allowedRoles.includes(userRole)) {
    return userRole === 'SUPERADMIN'
      ? <Navigate to="/superadmin/dashboard" replace />
      : <Navigate to={DASHBOARD_POR_ROL[userRole as AppRol] || "/dashboard"} replace />;
  }

  return <>{children}</>;
};

// Suspense boundary compartido: muestra un spinner mientras carga cada dashboard.
const DashboardLoader = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white font-medium">
        Cargando panel...
      </div>
    }
  >
    {children}
  </Suspense>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/logout" element={<Logout />} />
            {/* 🎟️ Panel del Cajero / Taquillero / Rodamiento / Despachador.
                - CAJERO (niv 5): venta + planilla.
                - DESPACHADOR (niv 4): solo programa (esRodamiento).
                - CAJERO_DESPACHADOR (niv 6): programa + venta + taquilla.
                El CajeroDashboard filtra vistas según el nivel.
                La antigua ruta /despachador quedó obsoleta: el nivel 4 ahora
                se resuelve directamente a /cajero/dashboard con esRodamiento. */}
            <Route
              path="/cajero/dashboard"
              element={
                <ProtectedRoute allowedRole={["CAJERO", "DESPACHADOR", "CAJERO_DESPACHADOR"]}>
                  <DashboardLoader><CajeroDashboard /></DashboardLoader>
                </ProtectedRoute>
              }
            />
            {/* 📱 Panel móvil de la Agencia Satélite (solo venta de tiquetes).
                Internamente valida que la agencia autenticada sea satélite
                (403 en el backend) y redirige a su dashboard según el rol. */}
            <Route 
              path="/satelite" 
              element={
                <ProtectedRoute>
                  <DashboardLoader><SateliteDashboard /></DashboardLoader>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/agencia" 
              element={
                <ProtectedRoute allowedRole="ADMIN_AGENCIA">
                  <DashboardLoader><AgenciaAdminDashboard /></DashboardLoader>
                </ProtectedRoute>
              } 
            />
            {/* 🛠️ Nueva Ruta para el Super Administrador Global */}
            <Route 
              path="/superadmin/dashboard" 
              element={
                <ProtectedRoute allowedRole="SUPERADMIN">
                  <DashboardLoader><SuperAdminDashboard /></DashboardLoader>
                </ProtectedRoute>
              } 
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
