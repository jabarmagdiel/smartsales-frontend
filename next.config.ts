import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimizaciones para Vercel (sin standalone)
  // output: 'standalone', // Comentado para Vercel
  
  // Configuración de imágenes para Google Cloud
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'smartsales-backend-783403173685.europe-west1.run.app',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.run.app',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleapis.com',
        pathname: '/**',
      },
    ],
    unoptimized: false, // Habilitar optimización de imágenes en Vercel
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
  
  // Configuración específica para Vercel
  trailingSlash: false,
  poweredByHeader: false,
};

export default nextConfig;
