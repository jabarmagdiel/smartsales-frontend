// src/components/ProductImage.tsx

'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
}

// Función para construir URL completa de imagen
const getImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return '';
  
  // Si ya es una URL completa, devolverla tal como está
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Si es una ruta relativa, construir URL completa
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '') || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://smartsales-backend-783403173685.europe-west1.run.app'
      : 'http://localhost:8000');
  
  return `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

export default function ProductImage({ 
  src, 
  alt, 
  className = "object-contain", 
  width, 
  height, 
  fill = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
}: ProductImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const imageUrl = getImageUrl(src);
  
  // Si no hay imagen o hay error, mostrar placeholder
  if (!imageUrl || imageError) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center text-gray-400 ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-2">📷</div>
          <div className="text-sm">Sin imagen</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`absolute inset-0 bg-gray-100 flex items-center justify-center ${className}`}>
          <div className="text-gray-400">Cargando...</div>
        </div>
      )}
      <Image
        src={imageUrl}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        sizes={sizes}
        className={className}
        onLoad={() => setIsLoading(false)}
        onError={(e) => {
          console.error('Error cargando imagen:', imageUrl);
          setImageError(true);
          setIsLoading(false);
        }}
        priority={false}
      />
    </div>
  );
}
