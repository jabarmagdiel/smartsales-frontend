import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimizaciones para Railway
  output: 'standalone',
  
  // Configuración de imágenes para Railway
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
      {
        protocol: 'https',
        hostname: '*.up.railway.app',
        pathname: '/media/**',
      },
    ],
    unoptimized: true
  },
  
  // Variables de entorno públicas
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://smartsales-backend-783403173685.europe-west1.run.app/api/v1'
        : 'http://localhost:8000/api/v1'),
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
  
  // Configuración de Turbopack para Railway
  turbopack: {
    root: process.cwd(),
  },
  
  // Configuración específica para Railway
  trailingSlash: false,
  poweredByHeader: false,
  
  // Headers de seguridad para Railway
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
