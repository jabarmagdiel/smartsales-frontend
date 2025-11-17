# 🚀 Despliegue Frontend - SmartSales

## 📋 Pasos para Desplegar en Vercel

### 1. Preparar el Proyecto
```bash
# Instalar dependencias
npm install

# Verificar que el build funcione localmente
npm run build

# Probar el build localmente
npm start
```

### 2. Configurar Variables de Entorno

En Vercel, configura estas variables de entorno:

```env
NEXT_PUBLIC_API_BASE_URL=https://tu-backend.railway.app/api/v1
NEXT_PUBLIC_FRONTEND_URL=https://tu-frontend.vercel.app
NODE_ENV=production
```

### 3. Comandos de Despliegue

Vercel ejecutará automáticamente:
1. `npm install`
2. `npm run build`
3. Despliegue automático

## 🔧 Problemas Comunes y Soluciones

### Error: "Module not found"
**Causa**: Importaciones incorrectas o dependencias faltantes
**Solución**:
```bash
# Verificar todas las importaciones
npm run build

# Instalar dependencias faltantes
npm install
```

### Error: "API calls failing"
**Causa**: URL del backend incorrecta o CORS
**Solución**:
1. Verificar `NEXT_PUBLIC_API_BASE_URL` en variables de entorno
2. Asegurar que el backend esté desplegado y funcionando
3. Verificar configuración CORS en el backend

### Error: "Build timeout"
**Causa**: Build muy lento o dependencias pesadas
**Solución**:
```json
// En vercel.json, aumentar timeout
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node",
      "config": {
        "maxLambdaSize": "50mb"
      }
    }
  ]
}
```

### Error: "TypeScript errors"
**Causa**: Errores de tipos no resueltos
**Solución**:
```bash
# Verificar errores de TypeScript
npx tsc --noEmit

# Si necesitas ignorar errores temporalmente (NO RECOMENDADO)
# Cambiar en next.config.ts:
typescript: {
  ignoreBuildErrors: true,
}
```

## 🌐 Configuración de Dominios

### Dominio Personalizado
1. En Vercel Dashboard → Settings → Domains
2. Agregar tu dominio personalizado
3. Configurar DNS según las instrucciones de Vercel

### HTTPS
Vercel proporciona HTTPS automáticamente para todos los dominios.

## 🔍 Verificar Despliegue

Una vez desplegado, verifica:

1. **Página Principal**: `https://tu-app.vercel.app/`
2. **Login**: `https://tu-app.vercel.app/login`
3. **Dashboard**: `https://tu-app.vercel.app/dashboard`
4. **API Calls**: Verificar en Network tab que las llamadas al backend funcionen

## 📊 Monitoreo

### Logs de Vercel
```bash
# Instalar Vercel CLI
npm i -g vercel

# Ver logs en tiempo real
vercel logs tu-app.vercel.app
```

### Analytics
Vercel proporciona analytics automáticos en el dashboard.

## 🔄 Actualizaciones Automáticas

### Git Integration
- Conectar repositorio GitHub/GitLab
- Despliegue automático en cada push a main
- Preview deployments para pull requests

### Variables de Entorno por Rama
```env
# Production
NEXT_PUBLIC_API_BASE_URL=https://api.smartsales.com/api/v1

# Preview
NEXT_PUBLIC_API_BASE_URL=https://staging-api.smartsales.com/api/v1

# Development
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

## 🛠️ Optimizaciones de Rendimiento

### Bundle Analysis
```bash
# Analizar el bundle
npm run build
npx @next/bundle-analyzer
```

### Optimizaciones Implementadas
- ✅ Standalone output para menor tamaño
- ✅ Optimización de imágenes
- ✅ Code splitting automático
- ✅ Compresión gzip/brotli
- ✅ Optimización de paquetes

## 🚨 Troubleshooting

### Si el despliegue falla:

1. **Verificar logs de build**:
   ```bash
   vercel logs --follow
   ```

2. **Probar build localmente**:
   ```bash
   npm run build
   npm start
   ```

3. **Verificar dependencias**:
   ```bash
   npm audit
   npm update
   ```

4. **Limpiar caché**:
   ```bash
   rm -rf .next
   rm -rf node_modules
   npm install
   npm run build
   ```

## 📱 PWA (Opcional)

Para habilitar PWA:
```bash
npm install next-pwa
```

Configurar en `next.config.ts`:
```typescript
const withPWA = require('next-pwa')({
  dest: 'public'
})

module.exports = withPWA({
  // tu configuración actual
})
```
