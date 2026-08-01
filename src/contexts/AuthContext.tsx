import { createContext, useContext, useState, ReactNode } from 'react';
import { Usuario } from '@/types';
import { normalizeRol } from '@/services/travelsoftService';

export interface AuthSessionData {
  user?: Record<string, unknown>;
  data?: { user?: Record<string, unknown> };
  token?: string;
  [key: string]: unknown;
}

interface AuthContextType {
  user: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginStateUpdate: (sessionData: AuthSessionData) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'userSession';

// Extrae el objeto de usuario de cualquier envoltura (user, data.user o plano)
// y homologa el rol (nivel_usuario de TravelSoft -> rol del frontend).
const extractUser = (parsed: Record<string, unknown>): Usuario | null => {
  const nestedData =
    typeof parsed.data === 'object' && parsed.data !== null
      ? (parsed.data as Record<string, unknown>)
      : undefined;
  const nestedUser =
    typeof nestedData?.user === 'object' && nestedData.user !== null
      ? (nestedData.user as Record<string, unknown>)
      : undefined;
  const flatUser =
    typeof parsed.user === 'object' && parsed.user !== null
      ? (parsed.user as Record<string, unknown>)
      : undefined;

  const raw = flatUser || nestedUser || parsed;
  if (!raw || typeof raw !== 'object') return null;

  const rol = normalizeRol({
    rol: typeof raw.rol === 'string' ? raw.rol : undefined,
    nivel_usuario: typeof raw.nivel_usuario === 'number' ? raw.nivel_usuario : undefined,
  });

  const idNumerico = Number(raw.id ?? raw.id_usuario ?? 0);
  const nombreCompleto = (raw.nombreCompleto as string) || (raw.nombre_usuario as string) || (raw.nombre as string) || (raw.name as string) || '';

  return {
    ...(raw as unknown as Usuario),
    id: Number.isFinite(idNumerico) && idNumerico > 0 ? idNumerico : 0,
    numeroDocumento: (raw.cedula_usuario as string) || (raw.numeroDocumento as string) || '',
    nombreCompleto,
    nombre: nombreCompleto,
    name: nombreCompleto,
    rol,
    role: rol,
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading] = useState(false); // La sesión se restaura de forma síncrona desde localStorage
  const [user, setUser] = useState<Usuario | null>(() => {
    try {
      const storedUser = localStorage.getItem(SESSION_KEY) || localStorage.getItem('user');
      if (storedUser) {
        return extractUser(JSON.parse(storedUser) as Record<string, unknown>);
      }
    } catch (error) {
      console.error("Error al parsear la sesión inicial:", error);
    }
    return null;
  });

  const loginStateUpdate = (sessionData: AuthSessionData) => {
    if (!sessionData) return;
    const normalized = extractUser(sessionData as Record<string, unknown>);
    setUser(normalized);
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading,
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