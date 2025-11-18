// src/components/SimpleImageTest.tsx

'use client';

import { useState } from 'react';

export default function SimpleImageTest() {
  const [testUrls] = useState([
    'https://smartsales-backend-783403173685.europe-west1.run.app/media/productos/Captura_de_pantalla_2025-11-18_031428.png',
    'https://smartsales-backend-783403173685.europe-west1.run.app/media/productos/Captura_de_pantalla_2025-11-18_032516.png',
  ]);

  return (
    <div className="p-4 bg-yellow-100 rounded">
      <h3 className="font-bold mb-2">Test Simple con &lt;img&gt;</h3>
      {testUrls.map((url, index) => (
        <div key={index} className="mb-4 p-2 bg-white rounded">
          <div><strong>URL:</strong> {url}</div>
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={url} 
              alt={`Test simple ${index}`}
              className="w-32 h-32 object-contain bg-gray-50"
              onLoad={() => console.log('✅ IMG cargada:', url)}
              onError={(e) => console.error('❌ IMG error:', url, e)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
