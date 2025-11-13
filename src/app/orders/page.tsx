"use client";

import { useEffect, useState } from "react";
import apiClient from "@/services/apiClient";

interface OrderItem { id: number; product: { id: number; name?: string; nombre?: string; sku: string; }; quantity: number; price: string; }
interface Order { id: number; status: string; total: string; shipping_cost: string; address: string; created_at?: string; items?: OrderItem[] }

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get<{ results?: Order[] }>("/ventas/");
        const list = (res.data as any).results ?? (res.data as any);
        setOrders(list);
      } catch (e: any) {
        setError(e?.response?.data?.detail || "Error cargando órdenes");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-6">Cargando órdenes...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Órdenes</h1>
      <div className="bg-white shadow rounded divide-y">
        {orders.length === 0 && <div className="p-4">No hay órdenes.</div>}
        {orders.map((o) => (
          <div key={o.id} className="p-4">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">Orden #{o.id}</div>
                <div className="text-sm text-gray-600">Estado: {o.status}</div>
                <div className="text-sm text-gray-600">Dirección: {o.address}</div>
              </div>
              <div className="font-bold">Total: Bs {o.total}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
