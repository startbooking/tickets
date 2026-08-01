import apiClient from "./apiClient";

// Interfaces de Tipos para TypeScript
export interface LoginCredentials {
  cedula_usuario: string;
  password: string;
}

export interface AuthUser {
  id?: number;
  id_usuario?: number;
  id_agencia?: number;
  agenciaId?: number;
  username?: string;
  nombre?: string;
  name?: string;
  nombres?: string;
  apellidos?: string;
  email?: string;
  rol?: string;
  role?: string;
  token?: string; // Token JWT devuelto por el backend para las siguientes consultas
  [key: string]: unknown;
}

export interface AuthSessionData {
  user?: AuthUser;
  token?: string;
  [key: string]: unknown;
}

export interface UserResponse {
  success: boolean;
  message?: string;
  data?: AuthSessionData;
  user?: AuthUser;
  token?: string;
  [key: string]: unknown;
}

export interface SessionInfoResponse {
  id_usuario: number;
  agencia_nombre: string;
  equipos_asignados: {
    id_equipo: number;
    nombre_equipo: string;
    tipo_equipo: string;
  }[];
}

export const authService = {
  /**
   * Realiza el login del empleado contra el backend TravelSoft
   */
  login: async (credentials: LoginCredentials): Promise<UserResponse> => {
    const response = await apiClient.post<UserResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Finaliza la sesión en el servidor
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  /**
   * Obtiene los datos detallados del usuario logueado, su agencia 
   * y los equipos de cómputo/datáfonos que tiene asignados para el turno.
   */
  getDashboardSession: async (): Promise<SessionInfoResponse> => {
    const response = await apiClient.get<SessionInfoResponse>('/auth/session-info');
    return response.data;
  },

  /**
   * Validación rápida para verificar si el token almacenado sigue siendo válido
   */
  validateToken: async (): Promise<{ valid: boolean }> => {
    const response = await apiClient.get<{ valid: boolean }>('/auth/validate-token');
    return response.data;
  }
};