// src/services/apiClient.ts

import axios from 'axios';
import { getAccessToken } from './authService'; // Importamos el token

// 1. Creamos la instancia de Axios
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 30000, // 30 segundos timeout para Railway
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. --- ¡LA SOLUCIÓN AL ERROR 401! ---
// Interceptor que añade el token JWT a CADA petición
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken(); // Obtiene el token guardado en localStorage
    if (token && config.headers) {
      // Adjunta el token a la cabecera Authorization
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Debug logs
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      data: config.data,
      headers: {
        ...config.headers,
        Authorization: config.headers?.Authorization ? '[TOKEN_PRESENT]' : '[NO_TOKEN]'
      },
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'NO_TOKEN'
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para respuestas
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      url: error?.config?.url,
      data: error?.response?.data,
      message: error?.message
    });
    
    // Si es error 401, redirigir al login
    if (error?.response?.status === 401) {
      console.error('🚨 Token expirado o inválido - Redirigiendo al login');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;