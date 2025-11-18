// src/components/ImageTester.tsx

'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function ImageTester() {
  const [testUrls] = useState([
    'https://smartsales-backend-783403173685.europe-west1.run.app/media/productos/Captura_de_pantalla_2025-11-18_031812.png',
    'https://smartsales-backend-783403173685.europe-west1.run.app/media/productos/HP_Probook_440_G11_14_Natural_Silver_WML_T_Tec.png',
    '/media/productos/Captura_de_pantalla_2025-11-18_031812.png',
  ]);

  return (
    <div className="p-4 bg-blue-100 rounded">
      <h3 className="font-bold mb-2">Test de URLs de Imágenes</h3>
      {testUrls.map((url, index) => (
        <div key={index} className="mb-4 p-2 bg-white rounded">
          <div><strong>URL:</strong> {url}</div>
          <div className="mt-2 relative w-32 h-32 bg-gray-50">
            <Image
              src={url}
              alt={`Test ${index}`}
              fill
              className="object-contain"
              onLoad={() => console.log('✅ Imagen cargada:', url)}
              onError={(e) => console.error('❌ Error cargando imagen:', url, e)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
