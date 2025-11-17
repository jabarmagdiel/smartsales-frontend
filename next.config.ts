import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimizaciones para producción
  output: 'standalone',
  
  // Configuración de imágenes (actualizada para Next.js 16)
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: '*.railway.app',
        pathname: '/media/**',
      },
    ],
    unoptimized: true
  },
  
  // Variables de entorno públicas
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
    NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
  },
  
  // Configuración de TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Configuración experimental
  experimental: {
    optimizePackageImports: ['axios', 'chart.js'],
  },
  
  // Configuración de Turbopack (para Next.js 16)
  turbopack: {
    // Configuración vacía para silenciar la advertencia
  },
};

export default nextConfig;
