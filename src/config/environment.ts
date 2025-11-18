/**
 * Configuración de entornos para SmartSales Frontend
 */

export interface EnvironmentConfig {
  apiBaseUrl: string;
  frontendUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
  enableDebugLogs: boolean;
}

// Detectar el entorno actual
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Configuración por defecto
const defaultConfig: EnvironmentConfig = {
  apiBaseUrl: isProduction 
    ? 'https://smartsales-backend-783403173685.europe-west1.run.app/api/v1'
    : 'http://localhost:8000/api/v1',
  frontendUrl: 'http://localhost:3000',
  isDevelopment,
  isProduction,
  enableDebugLogs: isDevelopment,
};

// Configuración específica del entorno
const environmentConfig: EnvironmentConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || defaultConfig.apiBaseUrl,
  frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || defaultConfig.frontendUrl,
  isDevelopment,
  isProduction,
  enableDebugLogs: process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS === 'true' || isDevelopment,
};

// Validar configuración crítica
if (isProduction && !process.env.NEXT_PUBLIC_API_BASE_URL) {
  console.warn('⚠️ NEXT_PUBLIC_API_BASE_URL no está configurada en producción');
}

// Log de configuración en desarrollo
if (isDevelopment) {
  console.log('🔧 Configuración del entorno:', {
    ...environmentConfig,
    nodeEnv: process.env.NODE_ENV,
  });
}

export default environmentConfig;

// Utilidades de configuración
export const config = {
  ...environmentConfig,
  
  // URLs completas para diferentes endpoints
  endpoints: {
    auth: `${environmentConfig.apiBaseUrl}/token/`,
    refresh: `${environmentConfig.apiBaseUrl}/token/refresh/`,
    users: `${environmentConfig.apiBaseUrl}/users/`,
    products: `${environmentConfig.apiBaseUrl}/products/`,
    sales: `${environmentConfig.apiBaseUrl}/sales/`,
    reports: `${environmentConfig.apiBaseUrl}/reports/`,
    logs: `${environmentConfig.apiBaseUrl}/admin/logs/`,
  },
  
  // Configuración de timeouts
  timeouts: {
    api: 30000, // 30 segundos
    upload: 60000, // 60 segundos para uploads
  },
  
  // Configuración de paginación
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  
  // Configuración de archivos
  files: {
    maxUploadSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedDocumentTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  },
};

// Helper para logging condicional
export const logger = {
  log: (...args: any[]) => {
    if (config.enableDebugLogs) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (config.enableDebugLogs) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    console.error(...args); // Errores siempre se muestran
  },
};
