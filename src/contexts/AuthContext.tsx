import { createContext, useContext, useState, ReactNode } from 'react';
import { Usuario } from '@/types';
import { mockUsuarios, mockTablets } from '@/data/mockData';

interface AuthContextType {
  user: Usuario | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, municipioId: number) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);

  const login = async (email: string, password: string, municipioId: number): Promise<boolean> => {
    // Simulación de login - en producción esto sería una llamada al backend
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Validar que el dispositivo esté asignado al municipio (simula tablet TAB-BOG-001 asignada a Bogotá)
    const currentTablet = mockTablets.find(t => t.codigoDispositivo === 'TAB-BOG-001');
    if (currentTablet && currentTablet.municipioAsignado.id !== municipioId) {
      throw new Error(`Este dispositivo (${currentTablet.codigoDispositivo}) está asignado a ${currentTablet.municipioAsignado.nombre}, no al municipio seleccionado`);
    }

    // Buscar usuario por email
    const foundUser = mockUsuarios.find(u => u.email === email && u.activo);
    if (!foundUser) {
      // Si no existe, crear uno basado en el primero del municipio
      const userByMunicipio = mockUsuarios.find(u => u.municipio.id === municipioId && u.activo);
      if (userByMunicipio) {
        setUser({ ...userByMunicipio, email });
        return true;
      }
    }

    // Login exitoso con usuario encontrado o el primero disponible
    setUser(foundUser || mockUsuarios[0]);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
