"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProducts, getCategories, type IProduct, type ICategory } from "@/services/productService";
import { addToCart } from "@/services/cartService";
import CartDrawer from "@/components/CartDrawer";

export default function DashboardShopPage() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [qty, setQty] = useState<Record<number, number>>({});
  const [q, setQ] = useState("");
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [categoryId, setCategoryId] = useState<number | "">("");

  useEffect(() => {
    const load = async () => {
      try {
        const [list, cats] = await Promise.all([getProducts(), getCategories()]);
        setProducts(list);
        setCategories(Array.isArray(cats) ? cats : []);
      } catch (e: any) {
        console.error("Error loading products:", e);
        const errorMsg = e?.response?.data?.detail || e?.response?.data?.error || e?.message || "Error cargando productos";
        setError(`Failed to fetch products: ${errorMsg}`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAdd = async (id: number) => {
    try {
      const amount = qty[id] && qty[id] > 0 ? qty[id] : 1;
      await addToCart(id, amount);
      setInfo("Producto agregado al carrito");
      setTimeout(() => setInfo(null), 2000);
    } catch (e: any) {
      const server = e?.response?.data;
      const msg = server?.detail || server?.error || e?.message || "No se pudo agregar al carrito";
      setError(`ID ${id}: ${msg}`);
    }
  };

  if (loading) return <div className="p-6">Cargando tienda...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  const filtered = products.filter((p) => {
    const matchesQ = q.trim().length === 0 ||
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(q.toLowerCase());
    const matchesCat = categoryId === "" || (p.categoria && p.categoria.id === categoryId);
    return matchesQ && matchesCat;
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tienda</h1>
        <div className="space-x-3">
          <button onClick={() => setDrawerOpen(true)} className="bg-[#00BCD4] hover:bg-[#0097A7] text-white text-sm py-2 px-3 rounded">Ver Carrito</button>
          <Link href="/dashboard/sales" className="text-sm text-blue-600 hover:underline">Ir a Ventas</Link>
        </div>
      </div>
      {info && <div className="p-2 bg-green-100 text-green-700 rounded border border-green-300">{info}</div>}

      {/* Filtros */}
      <div className="bg-white rounded shadow p-3 grid md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm text-gray-600">Buscar</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre o descripción..." className="mt-1 w-full border rounded p-2 text-gray-900" />
        </div>
        <div>
          <label className="text-sm text-gray-600">Categoría</label>
          <select value={categoryId as any} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")} className="mt-1 w-full border rounded p-2 text-gray-900">
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((p) => (
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
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase text-gray-700">{p.categoria?.nombre || ""}</div>
                <span
                  className={
                    p.stock > 0
                      ? p.stock <= (p.min_stock || 0)
                        ? "text-[11px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800"
                        : "text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-800"
                      : "text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-800"
                  }
                >
                  {p.stock > 0 ? (p.stock <= (p.min_stock || 0) ? `Pocas unidades (${p.stock})` : `Disponible (${p.stock})`) : "Agotado"}
                </span>
              </div>
              <div className="font-semibold text-gray-900 mt-1 line-clamp-2">{p.name}</div>
              <div className="text-sm text-gray-800 mt-1 line-clamp-3">{p.description}</div>
              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="font-bold text-[#00BCD4]">Bs. {p.precio}</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={Math.max(p.stock, 1)}
                    value={qty[p.id] ?? 1}
                    onChange={(e) => setQty((prev) => ({ ...prev, [p.id]: Math.max(1, Number(e.target.value || 1)) }))}
                    className="w-16 border rounded p-1 text-gray-900"
                  />
                  <button
                    onClick={() => handleAdd(p.id)}
                    disabled={p.stock <= 0}
                    className={`flex items-center gap-1 text-sm py-2 px-3 rounded ${p.stock > 0 ? "bg-[#00BCD4] hover:bg-[#0097A7] text-white" : "bg-gray-300 text-gray-600 cursor-not-allowed"}`}
                  >
                    <span>🛒</span>
                    <span>Agregar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
