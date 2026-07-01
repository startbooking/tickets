import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Usuario } from '@/types';

interface AuthContextType {
  user: Usuario | null;
  isAuthenticated: boolean;
  loginStateUpdate: (sessionData: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // 🧠 Inicialización inteligente: Lee el localStorage al arrancar la app para evitar deslogueos al recargar (F5)
  const [user, setUser] = useState<Usuario | null>(() => {
    try {
      const storedUser = localStorage.getItem('userSession') || localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        // Retornamos directamente el subobjeto user que inyecta el backend de SACTel
        return parsed.user || parsed.data?.user || parsed;
      }
    } catch (error) {
      console.error("Error al parsear la sesión inicial:", error);
    }
    return null;
  });

  /**
   * Actualiza el estado global de la aplicación una vez que el LoginModal 
   * valida con éxito las credenciales contra el backend.
   */
  const loginStateUpdate = (sessionData: any) => {
    if (!sessionData) return;
    
    // Extraemos el usuario bajo los formatos estándar de tu API
    const userData = sessionData.user || sessionData.data?.user || sessionData;
    setUser(userData);
  };

  /**
   * Limpia los tokens corporativos y regresa el estado de autenticación a nulo.
   */
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