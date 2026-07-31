import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import Swal from 'sweetalert2'; // Asumiendo que SactelAlert usa SweetAlert2 por debajo

const API_BASE_URL = import.meta.env.VITE_TICKETS_BACKEND_URL || '';

if (!API_BASE_URL) {
  console.error("🚨 ERROR: VITE_TICKETS_BACKEND_URL no está definida en el archivo .env");
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000, // Un poco más de margen para las firmas digitales de la DIAN
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ========================================================================
// INTERCEPTORES (Seguridad Automática y Control de Sesión)
// ========================================================================

// Inyecta el Token Bearer automáticamente si existe en la sesión activa
apiClient.interceptors.request.use(
  (config) => {
    const userString = localStorage.getItem('userSession') || localStorage.getItem('user');
    if (userString && config.headers) {
      try {
        const user = JSON.parse(userString);
        const token = user.token || user.user?.token || user.state?.user?.token; // Soporta estructuras anidadas comunes
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // Sesión corrupta en localStorage; el login la regenerará
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta para el control de sesiones simultáneas
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Sesión invalidada por el Core de SACTel o expiración de token.");

      // Limpieza de estados locales
      localStorage.removeItem('userSession');
      localStorage.removeItem('user');

      // Alerta Corporativa SACTel
      Swal.fire({
        title: 'Sesión Finalizada',
        text: 'Tu sesión ha expirado o se ha detectado un acceso simultáneo a esta cuenta desde otro dispositivo.',
        icon: 'error',
        iconColor: '#f43f5e', // Rose-500
        confirmButtonText: 'Volver a Ingresar',
        allowOutsideClick: false
      }).then(() => {
        window.location.href = '/';
      });
    }
    return Promise.reject(error);
  }
);

// ========================================================================
// UTILITARIOS COMPARTIDOS (Para herencia de servicios)
// ========================================================================

export interface ApiHeaders {
  'x-user-id': string | number;
  'x-user-role': string;
}

/**
 * Utilitario para inyectar cabeceras operativas obligatorias (x-user-id, x-user-role)
 */
export const buildConfig = (headers: ApiHeaders, extraConfig?: AxiosRequestConfig): AxiosRequestConfig => {
  const config: AxiosRequestConfig = { ...extraConfig, headers: { ...extraConfig?.headers } };
  
  if (headers) {
    config.headers = {
      ...config.headers,
      'x-user-id': String(headers['x-user-id']),
      'x-user-role': headers['x-user-role'],
    };
  }
  return config;
};

/**
 * Captura y unifica los formatos de error de diferentes backends (Python, Express, Next)
 */
interface HttpErrorShape {
  response?: {
    data?: {
      detail?: string;
      error?: string;
      message?: string;
    };
  };
  message?: string;
}

export const handleAxiosError = (error: unknown, defaultMessage: string): never => {
  const httpError = (typeof error === 'object' && error !== null ? error : {}) as HttpErrorShape;
  const errorMessage =
    httpError.response?.data?.detail ||  // FastAPI / Python
    httpError.response?.data?.error ||   // Express / Node.js
    httpError.response?.data?.message ||
    httpError.message ||
    defaultMessage;

  throw new Error(errorMessage);
};

/**
 * Valida si la respuesta contiene banderas internas de error
 */
export const validateResponse = <T extends Record<string, unknown>>(response: AxiosResponse<T>, defaultError: string): T => {
  const data = response.data;
  if (!data || data.success === false) {
    const message = typeof data?.error === 'string' ? data.error : defaultError;
    throw new Error(message);
  }
  return data;
};

export default apiClient;