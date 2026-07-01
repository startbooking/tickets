import apiClient from './apiClient';
import { Pasajero } from '@/types';
const baseURL = import.meta.env.VITE_TICKETS_BACKEND_URL;

export const pasajeroService = {
  /**
   * Consulta un pasajero validando los permisos del usuario en sesión
   * @param documento Cédula a buscar
   * @param token Token JWT del cajero/superadmin para validar si la sesión está activa
   * @param idAgencia Agencia desde donde se dispara la consulta
   * @param rol Rol del usuario (Cajero, SuperAdmin, etc.)
   */
  buscarPorDocumento: async (
    documento: string,
    token: string,
    idAgencia: number,
    rol: string
  ): Promise<Pasajero | null> => {
    // console.log(documento)
    try {
      const response = await apiClient.get<Pasajero>(`${baseURL}/pasajeros/${documento}`, {
        // 1. Enviamos el token del usuario en los Headers para verificar sesión activa
        headers: {
          'Authorization': `Bearer ${token}`
        },
        // 2. Enviamos el ID de la agencia y el Rol como parámetros de consulta
        params: {
          agencia_id: idAgencia,
          rol_usuario: rol
        }
      });
      return response.data;
    } catch (error: any) {
      // Si el backend responde 403, el usuario no tiene permisos por Rol o Agencia
      if (error.response && error.response.status === 403) {
        console.error("🚫 Acceso denegado: El rol o la agencia no tienen permisos.");
        throw new Error("No tienes permisos para consultar esta información.");
      }
      // Si el backend responde 401, el token expiró o es inválido
      if (error.response && error.response.status === 401) {
        console.error("🔒 Sesión inválida o expirada.");
        throw new Error("Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.");
      }
      if (error.response && error.response.status === 404) {
        return null; // Pasajero Nuevo
      }
      throw error;
    }
  }
};