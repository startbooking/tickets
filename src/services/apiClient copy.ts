import axios from 'axios';
const baseURL = import.meta.env.VITE_TICKETS_BACKEND_URL;

if (!baseURL) {
  console.error(
    "🚨 ERROR: La variable VITE_TICKETS_BACKEND_URL no está definida en el archivo .env"
  );
}


const apiClient = axios.create({
  baseURL: baseURL, // Ajustado según el estándar habitual de /docs
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para inyectar el Token de manera automática en cada consulta
apiClient.interceptors.request.use(
  (config) => {
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      // Si manejas un token JWT independiente en el objeto usuario
      if (user.token && config.headers) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores globales (ej: token expirado 401)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Redireccionar al login si el token ya no es válido
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default apiClient;