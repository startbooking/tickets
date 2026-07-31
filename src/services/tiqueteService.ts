import { apiClient, handleAxiosError, validateResponse } from './apiClient';
import type { DianResponse } from './dianService';
import type { TiqueteTransporteDTO } from '@/types';

export const ticketsService = {
  /**
   * Registra la venta de un pasaje, procesa la firma DIAN y genera el CUFE.
   */
  emitirTiqueteTransporte: async (ticketDTO: TiqueteTransporteDTO, authHeaders: Record<string, string | number>): Promise<DianResponse> => {
    try {
      // Inyectamos las cabeceras de auditoría y hacemos el POST
      const response = await apiClient.post<DianResponse>('/tiquete-transporte/emitir', ticketDTO, {
        headers: {
          ...authHeaders
        }
      });
      
      // Valida que el backend responda exitosamente
      return validateResponse<DianResponse>(response, 'El Core de SACTel no pudo procesar la emisión del tiquete.');
    } catch (error: unknown) {
      return handleAxiosError(error, 'Fallo crítico durante la emisión fiscal del tiquete.');
    }
  }
};