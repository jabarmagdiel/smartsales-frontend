#!/usr/bin/env node

/**
 * Script de pre-build para verificar la configuración antes del despliegue
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración para despliegue...\n');

// Verificar variables de entorno requeridas
const requiredEnvVars = [
  'NEXT_PUBLIC_API_BASE_URL'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Variables de entorno faltantes en producción:');
    missingEnvVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Configura estas variables en tu plataforma de despliegue (Vercel, Netlify, etc.)\n');
    process.exit(1);
  } else {
    console.log('⚠️ Variables de entorno no configuradas (usando valores por defecto para desarrollo)');
    missingEnvVars.forEach(varName => {
      console.log(`   - ${varName}: usando valor por defecto`);
    });
  }
} else {
  console.log('✅ Variables de entorno configuradas correctamente');
}

// Verificar archivos críticos
const criticalFiles = [
  'package.json',
  'next.config.ts',
  'tsconfig.json',
  'src/app/layout.tsx',
  'src/app/page.tsx'
];

const missingFiles = criticalFiles.filter(file => !fs.existsSync(path.join(process.cwd(), file)));

if (missingFiles.length > 0) {
  console.error('❌ Archivos críticos faltantes:');
  missingFiles.forEach(file => {
    console.error(`   - ${file}`);
  });
  process.exit(1);
} else {
  console.log('✅ Archivos críticos presentes');
}

// Verificar dependencias en package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));

const requiredDependencies = [
  'next',
  'react',
  'react-dom',
  'axios',
  'jwt-decode'
];

const missingDeps = requiredDependencies.filter(dep => 
  !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
);

if (missingDeps.length > 0) {
  console.error('❌ Dependencias faltantes:');
  missingDeps.forEach(dep => {
    console.error(`   - ${dep}`);
  });
  console.error('\n💡 Ejecuta: npm install ' + missingDeps.join(' ') + '\n');
  process.exit(1);
} else {
  console.log('✅ Dependencias requeridas presentes');
}

// Verificar configuración de Next.js
try {
  const nextConfig = require(path.join(process.cwd(), 'next.config.ts'));
  console.log('✅ Configuración de Next.js válida');
} catch (error) {
  console.error('❌ Error en next.config.ts:', error.message);
  process.exit(1);
}

// Mostrar información de configuración
console.log('\n📋 Configuración actual:');
console.log(`   - API Base URL: ${process.env.NEXT_PUBLIC_API_BASE_URL || 'No configurada'}`);
console.log(`   - Frontend URL: ${process.env.NEXT_PUBLIC_FRONTEND_URL || 'No configurada'}`);
console.log(`   - Node Environment: ${process.env.NODE_ENV || 'development'}`);

console.log('\n🚀 Configuración verificada. Procediendo con el build...\n');
