"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import apiClient from "@/services/apiClient";
import { getCart, checkout, pay, type CartResp } from "@/services/cartService";

export default function DashboardSalesPage() {
  const [cart, setCart] = useState<CartResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [method, setMethod] = useState<'PAYPAL' | 'STRIPE'>("PAYPAL");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCart();
        setCart(data);
      } catch (e: any) {
        // Fallback: no bloquear el módulo de ventas
        const msg = e?.response?.data?.detail || "No se pudo obtener el carrito. Continuará con carrito vacío.";
        setInfo(msg);
        setCart({ id: 0, items: [], total: "0" } as unknown as CartResp);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCheckout = async () => {
    try {
      const addr = address && address.trim().length > 0 ? address : 'Direccion demo 123';
      const res = await checkout(addr);
      setOrderId(res.id);
      setInfo(`Orden creada #${res.id}. Proceda al pago.`);
      const refreshed = await getCart();
      setCart(refreshed);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "No se pudo procesar checkout");
    }
  };

  const handlePay = async () => {
    if (!orderId) return;
    try {
      const res = await pay(orderId, method);
      setInfo(`Pago ${res.status}.`);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error al pagar");
    }
  };

  if (loading) return <div className="p-6">Cargando módulo de venta...</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Registrar Venta</h1>
        <Link href="/dashboard/shop" className="text-sm text-blue-600 hover:underline">Ir a Tienda</Link>
      </div>
      {info && <div className="p-2 bg-green-100 text-green-700 rounded border border-green-300">{info}</div>}

      <div className="bg-white p-4 rounded shadow space-y-3">
        <h2 className="font-semibold text-lg text-gray-900">Carrito</h2>
        {cart && cart.items && cart.items.length > 0 ? (
          <div className="space-y-2">
            {cart.items.map((it) => (
              <div key={it.id} className="flex items-center justify-between border-b py-2">
                <div className="flex items-center gap-3">
                  {(it as any).product?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={(it as any).product.image} alt={(it as any).product.nombre || (it as any).product.name} className="w-16 h-16 object-contain rounded bg-gray-50" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">Sin imagen</div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{(it as any).product?.nombre || (it as any).product?.name}</div>
                    <div className="text-xs text-gray-700">SKU {(it as any).product?.sku} · Cantidad {it.quantity}</div>
                  </div>
                </div>
                <div className="font-semibold text-gray-900">Bs {it.price}</div>
              </div>
            ))}

            <div className="grid md:grid-cols-2 gap-3 pt-3">
              <div>
                <label className="text-sm text-gray-600">Dirección de envío</label>
                <input className="mt-1 w-full border rounded p-2 text-gray-900" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Av. Principal 123..." />
              </div>
              <div>
                <label className="text-sm text-gray-600">Método de pago</label>
                <select className="mt-1 w-full border rounded p-2 text-gray-900" value={method} onChange={(e) => setMethod(e.target.value as any)}>
                  <option value="PAYPAL">PayPal</option>
                  <option value="STRIPE">Stripe</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="text-xl font-bold text-gray-900">Total: Bs {cart.total}</div>
              <div className="space-x-2">
                <button onClick={handleCheckout} className="bg-[#00BCD4] hover:bg-[#0097A7] text-white py-2 px-4 rounded">Checkout</button>
                {orderId && (
                  <button onClick={handlePay} className="bg-[#FF9800] hover:bg-[#FB8C00] text-white py-2 px-4 rounded">Pagar</button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            Carrito vacío. Ir a la <Link href="/dashboard/shop" className="text-blue-600 hover:underline">Tienda</Link>.
          </div>
        )}
      </div>
    </div>
  );
}
