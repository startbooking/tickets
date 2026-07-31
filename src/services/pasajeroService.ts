import { AxiosRequestConfig, isAxiosError } from 'axios';
import { apiClient, buildConfig, handleAxiosError, validateResponse, ApiHeaders } from './apiClient';

export interface PasajeroDTO {
  tipo_documento: 'CC' | 'CE' | 'PP' | 'TI';
  documento: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  email?: string;
}

export interface PasajeroResponse extends PasajeroDTO {
  id_pasajero: number;
  fecha_registro?: string;
  success?: boolean;
}

/**
 * Consulta un pasajero por cédula aplicando las políticas de auditoría (Agencia, Rol e ID)
 */
export const pasajerosService = {
  buscarPorDocumento: async (
    documento: string,
    headers: ApiHeaders
  ): Promise<PasajeroResponse | null> => {
    try {
      // Configuramos los parámetros junto a las cabeceras operativas creadas por buildConfig
      const config: AxiosRequestConfig = buildConfig(headers);
      const response = await apiClient.get(`/pasajeros/${documento}`, config);
      return response.data; 
    } catch (error) {
      // 404 significa que el usuario es nuevo en taquilla; retornamos null de manera controlada
      if (isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      return handleAxiosError(error, 'Error al obtener la información del pasajero.');
    }
  },

  /**
   * Registra un nuevo pasajero en el sistema centralizado
   */
  crearPasajero: async (
    datosPasajero: PasajeroDTO,
    headers: ApiHeaders
  ): Promise<PasajeroResponse> => {
    try {
      const response = await apiClient.post('/pasajeros', datosPasajero, buildConfig(headers));
      return validateResponse(response, 'No se pudo procesar el registro del pasajero.');
    } catch (error) {
      return handleAxiosError(error, 'Fallo al registrar el pasajero en el sistema.');
    }
  },
};