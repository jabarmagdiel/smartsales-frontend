// src/components/ImageDebugger.tsx

'use client';

import { useEffect, useState } from 'react';
import { getProducts, type IProduct } from '@/services/productService';

export default function ImageDebugger() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await getProducts();
        console.log('ImageDebugger: Products loaded:', list);
        setProducts(list);
      } catch (e) {
        console.error('ImageDebugger: Error loading products:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div>Cargando productos para debug...</div>;

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3 className="font-bold mb-2">Debug de Imágenes de Productos</h3>
      {products.slice(0, 3).map((p) => (
        <div key={p.id} className="mb-4 p-2 bg-white rounded">
          <div><strong>ID:</strong> {p.id}</div>
          <div><strong>Nombre:</strong> {p.name}</div>
          <div><strong>Imagen (raw):</strong> {JSON.stringify(p.image)}</div>
          <div><strong>Imagen (string):</strong> {String(p.image || 'null')}</div>
          <div><strong>Tipo:</strong> {typeof p.image}</div>
          <hr className="my-2" />
        </div>
      ))}
    </div>
  );
}
