// src/services/authService.ts

import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Asegúrate de instalar: npm install jwt-decode

// Función para verificar si estamos en el cliente (navegador)
const isClient = () => typeof window !== 'undefined';

// 1. Configuración de Axios
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://smartsales-backend-783403173685.europe-west1.run.app/api/v1'
      : 'http://localhost:8000/api/v1'),
});

// Interfaz para la respuesta exitosa del Login JWT
interface TokenResponse {
  access: string;
  refresh: string;
}

// 2. Función Principal de Login
export const login = async (username: string, password: string): Promise<TokenResponse> => {
  try {
    const response = await api.post<TokenResponse>(
      '/token/', // Llama a /api/v1/token/
      { username, password }
    );

    const { access, refresh } = response.data;

    // Guardar tokens solo si estamos en el navegador
    if (isClient()) {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
    }
    return response.data;
  } catch (error) {
    console.error("Login failed:", error);
    throw new Error("Invalid credentials or server error");
  }
};

// 3. Función de Logout
export const logout = () => {
  if (isClient()) {
    // Opcional: Llamar al backend para invalidar el token si se implementó
    // api.post('/logout/', { refresh_token: getRefreshToken() });
    
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};

// 4. Utilidades del Token (Corregido el error de localStorage)
export const getAccessToken = (): string | null => {
  if (isClient()) {
    return localStorage.getItem('access_token');
  }
  return null;
};

export const getRefreshToken = (): string | null => {
  if (isClient()) {
    return localStorage.getItem('refresh_token');
  }
  return null;
};

// Función para verificar si el token está expirado
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded: any = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (e) {
    return true; // Si no se puede decodificar, considerarlo expirado
  }
};

// Función para refrescar el token automáticamente
export const refreshToken = async (): Promise<string | null> => {
  const refresh = getRefreshToken();
  if (!refresh) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await api.post<TokenResponse>('/token/refresh/', {
      refresh: refresh
    });

    const { access } = response.data;
    
    if (isClient()) {
      localStorage.setItem('access_token', access);
      // Si el backend devuelve un nuevo refresh token, guardarlo también
      if (response.data.refresh) {
        localStorage.setItem('refresh_token', response.data.refresh);
      }
    }
    
    return access;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Si falla el refresh, hacer logout
    logout();
    throw error;
  }
};

// Función para obtener un token válido (refresh automático si es necesario)
export const getValidToken = async (): Promise<string | null> => {
  const token = getAccessToken();
  
  if (!token) {
    return null;
  }
  
  // Si el token no está expirado, devolverlo
  if (!isTokenExpired(token)) {
    return token;
  }
  
  // Si está expirado, intentar refrescarlo
  try {
    return await refreshToken();
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return null;
  }
};

export const getRoleFromToken = (): string | null => {
  const token = getAccessToken();
  if (token && !isTokenExpired(token)) {
    try {
      const decoded: any = jwtDecode(token);
      return decoded.role || 'Rol Desconocido';
    } catch (e) {
      console.error("Error decoding token:", e);
      return null;
    }
  }
  return null;
};
