import { createContext, useContext, useState, ReactNode } from 'react';
import { Usuario } from '@/types';

interface AuthContextType {
  user: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean; // 👈 Expuesto para que App.tsx no rompa
  loginStateUpdate: (sessionData: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true); // Inicializa en true
  const [user, setUser] = useState<Usuario | null>(() => {
    try {
      const storedUser = localStorage.getItem('userSession') || localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const normalUser = parsed.user || parsed.data?.user || parsed;
        
        // Estandarizamos el campo de rol para evitar el bug de typo (rol vs role)
        if (normalUser && normalUser.rol) {
          normalUser.role = normalUser.rol.toUpperCase();
        }
        return normalUser;
      }
    } catch (error) {
      console.error("Error al parsear la sesión inicial:", error);
    } finally {
      // Una vez validado el localStorage en el constructor de estado, apagamos la carga
    }
    return null;
  });

  // Apagar el loading justo después de evaluar el estado inicial
  useState(() => {
    setIsLoading(false);
  });

  const loginStateUpdate = (sessionData: any) => {
    if (!sessionData) return;
    const userData = sessionData.user || sessionData.data?.user || sessionData;
    
    // Homologamos estructuralmente para blindar la app
    if (userData && userData.rol) {
      userData.role = userData.rol.toUpperCase();
    }
    
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userSession');
    setUser(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading, // 👈 Pasado exitosamente a la directiva del Router
        loginStateUpdate, 
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser utilizado obligatoriamente dentro de un AuthProvider');
  }
  return context;
}