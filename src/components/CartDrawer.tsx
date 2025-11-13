"use client";

import { useEffect, useState } from "react";
import { getCart, removeFromCart, type CartResp } from "@/services/cartService";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: Props) {
  const [cart, setCart] = useState<CartResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getCart();
      setCart(data);
    } catch (e: any) {
      const server = e?.response?.data;
      const msg = server?.detail || server?.error || e?.message || "Error cargando carrito";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleRemove = async (productId: number) => {
    try {
      const updated = await removeFromCart(productId);
      setCart(updated);
    } catch (e: any) {
      const server = e?.response?.data;
      const msg = server?.detail || server?.error || e?.message || "No se pudo eliminar";
      setError(msg);
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] ${open ? '' : 'pointer-events-none'} `} aria-hidden={!open}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`absolute right-0 top-0 h-full w-full sm:w-[420px] bg-[#1f2a37] text-white shadow-xl transform transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span>🛒</span>
            <h2 className="font-semibold">Tu Carrito</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">✕</button>
        </div>

        <div className="p-4 h-[calc(100%-52px-64px)] overflow-y-auto">
          {loading && <div>Cargando...</div>}
          {error && <div className="text-red-300">{error}</div>}
          {!loading && cart && cart.items.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center text-white/80">
              <div className="text-5xl mb-4">🛍️</div>
              <p className="text-lg">Tu carrito está vacío</p>
              <p className="text-sm">Añade algunos productos para empezar.</p>
            </div>
          )}
          {!loading && cart && cart.items.length > 0 && (
            <div className="space-y-3">
              {cart.items.map((it) => (
                <div key={it.id} className="flex items-center justify-between bg-white/5 rounded px-3 py-2">
                  <div className="flex items-center gap-3">
                    {((it as any).product?.image) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={(it as any).product.image as string} alt={(it as any).product.nombre || (it as any).product.name} className="w-12 h-12 object-contain rounded bg-white" />
                    ) : (
                      <div className="w-12 h-12 bg-white/20 rounded flex items-center justify-center text-xs">Sin img</div>
                    )}
                    <div>
                      <div className="font-medium text-white">{(it as any).product?.nombre || (it as any).product?.name}</div>
                      <div className="text-xs text-white/70">Cant. {it.quantity} · Bs {it.price}</div>
                    </div>
                  </div>
                  <button onClick={() => handleRemove((it as any).product.id)} className="text-red-300 hover:text-red-200 text-sm">Quitar</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 p-4 flex items-center justify-between">
          <div className="font-semibold">Total: Bs {cart?.total || '0.00'}</div>
          <a href="/dashboard/sales" className="bg-[#00BCD4] hover:bg-[#0097A7] text-white py-2 px-4 rounded">Ir a Venta</a>
        </div>
      </div>
    </div>
  );
}
