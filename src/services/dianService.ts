import axios, { AxiosRequestConfig } from 'axios';
import { handleAxiosError, validateResponse } from './apiClient';
import type { TiqueteTransporteDTO } from '@/types';

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

export interface DianResponse {
  success: boolean;
  message?: string;
  /** CUDE del Documento Equivalente Electrónico (Tipo 21). Lo calcula el Core. */
  cude?: string;
  /** Alias de compatibilidad (algunos Cores devuelven cufe). */
  cufe?: string;
  qr_code_url?: string;
  qr_dian?: string;
  numero_factura?: string;
  data?: {
    cude?: string;
    cufe?: string;
    qr_dian?: string;
    qr_code_url?: string;
    numero_factura?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export const dianService = {
  /**
   * Envía el JSON estructurado al operador electrónico para la homologación ante la DIAN
   * @param payload Estructura JSON con datos del viaje, impuestos y adquirente
   * @param authHeaders Cabeceras operativas de auditoría de SACTel
   */
  emitirTiqueteTransporte: async (payload: TiqueteTransporteDTO, authHeaders: Record<string, string | number>): Promise<DianResponse> => {
    try {
      // Configuramos las cabeceras dinámicas mezclando la autenticación por Token de la empresa con la auditoría del usuario
      const config: AxiosRequestConfig = {
        headers: {
          ...authHeaders
        }
      };

      // 💡 CORRECCIÓN: Se remueve "${baseURL}" ya que sactelClient usa automáticamente su baseURL configurada arriba.
      // Se apunta al endpoint exacto que reportó tu traza de error.
      const response = await sactelClient.post<DianResponse>('/tiquete-transporte/emitir', payload, config);
      // Valida la estructura de éxito de la respuesta
      return validateResponse<DianResponse>(response, 'El Core de SACTel no pudo procesar la emisión del tiquete.');
    } catch (error: unknown) {
      // Retorna el error estructurado. Al lanzar handleAxiosError, tu Dashboard 
      // podrá leer el error.response.data.errors que generó el fallo 422.
      return handleAxiosError(error, 'Fallo crítico durante la emisión fiscal del tiquete.');
    }
  },

  /**
   * Persiste el documento fiscal emitido (guardado/consulta en el Core SACTel).
   * Ver migrations/012-documentos-dian.sql y docs/dian-contrato.md.
   */
  guardarDocumento: async (payload: Record<string, unknown>): Promise<DianResponse> => {
    try {
      const response = await sactelClient.post<DianResponse>('/tiquete-transporte/guardar', payload);
      return validateResponse<DianResponse>(response, 'El Core no pudo persistir el documento DIAN.');
    } catch (error: unknown) {
      return handleAxiosError(error, 'Fallo al persistir el documento fiscal.');
    }
  },

  /** Consulta el documento fiscal persistido por id_planilla. */
  getDocumento: async (idPlanilla: number | string): Promise<DianResponse> => {
    try {
      const response = await sactelClient.get<DianResponse>(`/tiquete-transporte/${idPlanilla}`);
      return validateResponse<DianResponse>(response, 'No se encontró el documento fiscal.');
    } catch (error: unknown) {
      return handleAxiosError(error, 'Fallo al consultar el documento fiscal.');
    }
  },

  /**
   * Anula el Documento Equivalente Electrónico ante la DIAN (evento de anulación).
   * Devuelve el CUDE de anulación. Ver migrations/012-documentos-dian.sql.
   */
  anularDocumento: async (idPlanilla: number | string, motivo: string): Promise<DianResponse> => {
    try {
      const response = await sactelClient.post<DianResponse>('/tiquete-transporte/anular', {
        id_planilla: idPlanilla,
        motivo,
      });
      return validateResponse<DianResponse>(response, 'El Core no pudo anular el documento DIAN.');
    } catch (error: unknown) {
      return handleAxiosError(error, 'Fallo al anular el documento fiscal.');
    }
  },
};