import axios, { AxiosRequestConfig } from 'axios';
import { handleAxiosError, validateResponse } from './apiClient';

// Instancia aislada y configurada para el operador de la DIAN (Sactel)
const sactelClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_DIAN_URL || 'http://backend.sactel.lan/api/v1',
  timeout: 15000, // Tiempo prudente para la firma del XML fiscal
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_EMPRESA_TOKEN}`
  }
});

console.log(import.meta.env.VITE_BACKEND_DIAN_URL);

export interface DianResponse {
  success: boolean;
  message: string;
  cufe: string;
  qr_code_url?: string; // Opcional por si el backend envía qr_dian directo
  qr_dian?: string;
  numero_factura: string;
}

export const dianService = {
  /**
   * Envía el JSON estructurado al operador electrónico para la homologación ante la DIAN
   * @param payload Estructura JSON con datos del viaje, impuestos y adquirente
   * @param authHeaders Cabeceras operativas de auditoría de SACTel
   */
  emitirTiqueteTransporte: async (payload: any, authHeaders: Record<string, string | number>) => {
    try {
      // Configuramos las cabeceras dinámicas mezclando la autenticación por Token de la empresa con la auditoría del usuario
      const config: AxiosRequestConfig = {
        headers: {
          ...authHeaders
        }
      };

      // 💡 CORRECCIÓN: Se remueve "${baseURL}" ya que sactelClient usa automáticamente su baseURL configurada arriba.
      // Se apunta al endpoint exacto que reportó tu traza de error.
      const response = await sactelClient.post('/tiquete-transporte/emitir', payload, config);
      console.log(response);
      // Valida la estructura de éxito de la respuesta
      return validateResponse(response, 'El Core de SACTel no pudo procesar la emisión del tiquete.');
    } catch (error: any) {
      // Retorna el error estructurado. Al lanzar handleAxiosError, tu Dashboard 
      // podrá leer el error.response.data.errors que generó el fallo 422.
      return handleAxiosError(error, 'Fallo crítico durante la emisión fiscal del tiquete.');
    }
  }
};

// Mantener compatibilidad si se utiliza bajo el alias de ticketsService en tus componentes
export const ticketsService = dianService;