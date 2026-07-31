import { apiClient, handleAxiosError, validateResponse } from './apiClient';

export const ticketsService = {
  /**
   * Registra la venta de un pasaje, procesa la firma DIAN y genera el CUFE.
   */
  emitirTiqueteTransporte: async (ticketDTO: any, authHeaders: any) => {
    try {
      // Inyectamos las cabeceras de auditoría y hacemos el POST
      const response = await apiClient.post('/tiquete-transporte/emitir', ticketDTO, {
        headers: {
          ...authHeaders
        }
      });
      
      // Valida que el backend responda exitosamente
      return validateResponse(response, 'El Core de SACTel no pudo procesar la emisión del tiquete.');
    } catch (error) {
      return handleAxiosError(error, 'Fallo crítico durante la emisión fiscal del tiquete.');
    }
  }
};