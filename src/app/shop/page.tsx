"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProducts, type IProduct } from "@/services/productService";
import { addToCart } from "@/services/cartService";

export default function ShopPage() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await getProducts();
        setProducts(list);
      } catch (e: any) {
        setError(e?.message || "Error cargando productos");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAdd = async (id: number) => {
    try {
      await addToCart(id, 1);
      setInfo("Producto agregado al carrito");
      setTimeout(() => setInfo(null), 2000);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "No se pudo agregar al carrito");
    }
  };

  if (loading) return <div className="p-6">Cargando tienda...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tienda</h1>
        <Link href="/cart" className="text-sm text-blue-600 hover:underline">Ver carrito</Link>
      </div>
      {info && <div className="p-2 bg-green-100 text-green-700 rounded border border-green-300">{info}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => (
          <div key={p.id} className="bg-white rounded shadow overflow-hidden flex flex-col">
            <div className="relative w-full h-40 bg-gray-50 flex items-center justify-center">
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt={p.name} className="max-h-40 object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Sin imagen</div>
              )}
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="text-xs uppercase text-gray-500">{p.categoria?.nombre || ""}</div>
              <div className="font-semibold text-gray-900 mt-1 line-clamp-2">{p.name}</div>
              <div className="text-sm text-gray-600 mt-1 line-clamp-3">{p.description}</div>
              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="font-bold text-[#00BCD4]">Bs. {p.precio}</div>
                <button
                  onClick={() => handleAdd(p.id)}
                  className="bg-[#00BCD4] hover:bg-[#0097A7] text-white text-sm py-2 px-3 rounded"
                >
                  Agregar al Carrito
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
