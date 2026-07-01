import apiClient from "./axiosClient";

// Interfaces de Tipos para TypeScript
export interface LoginCredentials {
  username: string;
  password_hash: string; // Tu base de datos usa password_hash
}

export interface UserResponse {
  id_usuario: number;
  id_agency: number;
  username: string;
  nombres: string;
  apellidos: string;
  rol: 'SUPERADMIN','ADMIN_AGENCIA','CAJERO','DESPACHADOR';
  token: string; // Token JWT devuelto por el backend para las siguientes consultas
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
   * Realiza el login del empleado en la plataforma de tiquetes
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