import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Logout from "./pages/Logout";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import AgenciaAdminDashboard from "./pages/admin/AgenciaAdminDashboard";
import CajeroDashboard from "./pages/cajero/CajeroDashboard";
import DespachadorDashboard from "./pages/despacho/DespachadorDashboard";


const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole?: 'SUPERADMIN' | 'ADMIN_AGENCIA' |'CAJERO' |'DESPACHADOR' }) => {
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

  // Si la ruta requiere un rol específico y el usuario no lo tiene
  if (allowedRole && userRole !== allowedRole) {
    return userRole === 'SUPERADMIN' 
      ? <Navigate to="/superadmin/dashboard" replace /> 
      : <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};


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
            {/* 🎟️ Ruta del Taquillero / Operador de Planillas */}
            <Route 
              path="/cajero/dashboard" 
              element={
                <ProtectedRoute allowedRole="CAJERO">
                  <CajeroDashboard />
                </ProtectedRoute>
              } 
            />
            {/* 🎟️ Ruta del Despachador de la Agencia */}
            <Route 
              path="/despachador" 
              element={
                <ProtectedRoute allowedRole="DESPACHADOR">
                  <DespachadorDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/agencia" 
              element={
                <ProtectedRoute allowedRole="ADMIN_AGENCIA">
                  <AgenciaAdminDashboard />
                </ProtectedRoute>
              } 
            />
            {/* 🛠️ Nueva Ruta para el Super Administrador Global */}
            <Route 
              path="/superadmin/dashboard" 
              element={
                <ProtectedRoute allowedRole="SUPERADMIN">
                  <SuperAdminDashboard />
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
