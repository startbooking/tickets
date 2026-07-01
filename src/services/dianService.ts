import axios from 'axios';

// Instancia aislada para el operador de la DIAN (Sactel)
const sactelClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_DIAN_URL,
  timeout: 15000, // La DIAN puede tardar un poco en firmar y responder
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_EMPRESA_TOKEN}`
  }
});

export interface DianResponse {
  success: boolean;
  message: string;
  cufe: string;
  qr_code_url: string;
  numero_factura: string;
}

export const dianService = {
  emitirTiquete: async (payload: any): Promise<DianResponse> => {
    const response = await sactelClient.post<DianResponse>('/tiquete-transporte/emitir', payload);
    return response.data;
  }
};