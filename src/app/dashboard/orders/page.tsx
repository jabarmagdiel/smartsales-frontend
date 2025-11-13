"use client";

import { useEffect, useState } from "react";
import apiClient from "@/services/apiClient";
import { downloadReceipt, getOrderStatus } from "@/services/orderService";

interface OrderItem {
  id: number;
  product: {
    id: number;
    name?: string;
    nombre?: string;
    sku: string;
  };
  quantity: number;
  price: string;
  subtotal: string;
}

interface Order {
  id: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total: string;
  shipping_cost: string;
  address: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      const res = await apiClient.get<{ results?: Order[] }>("/ventas/");
      const list = (res.data as any).results ?? (res.data as any);
      setOrders(list);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error cargando órdenes");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleReceipt = async (id: number) => {
    try {
      const blob = await downloadReceipt(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comprobante_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSuccess(`Comprobante de la orden #${id} descargado correctamente`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e?.message || 'No se pudo descargar el comprobante');
    }
  };

  const handleRefreshStatus = async (id: number) => {
    try {
      const data = await getOrderStatus(id);
      // Actualizar el estado de la orden en la lista
      setOrders(prev => prev.map(order => 
        order.id === id ? { ...order, status: data.status } : order
      ));
      setSuccess(`Estado de la orden #${id} actualizado: ${getStatusLabel(data.status)}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e?.message || 'No se pudo consultar el estado');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SHIPPED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'PROCESSING': return 'Procesando';
      case 'SHIPPED': return 'Enviado';
      case 'DELIVERED': return 'Entregado';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'PENDING': return 25;
      case 'PROCESSING': return 50;
      case 'SHIPPED': return 75;
      case 'DELIVERED': return 100;
      case 'CANCELLED': return 0;
      default: return 0;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toString().includes(searchTerm) ||
                         order.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-lg text-gray-600">Cargando órdenes...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Rastrear Pedidos (CU12)</h1>
        <button
          onClick={fetchOrders}
          disabled={refreshing}
          className="bg-[#00BCD4] hover:bg-[#0097A7] text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50"
        >
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Mensajes de estado */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-300 text-green-700 rounded-md">
          {success}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar por número de orden o dirección
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
              placeholder="Ej: 123, Av. Principal..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
            >
              <option value="">Todos los estados</option>
              <option value="PENDING">Pendiente</option>
              <option value="PROCESSING">Procesando</option>
              <option value="SHIPPED">Enviado</option>
              <option value="DELIVERED">Entregado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de órdenes */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <p className="text-gray-500">No se encontraron órdenes que coincidan con los filtros.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">Orden #{order.id}</h3>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">
                      <span className="font-medium">Dirección:</span> {order.address}
                    </p>
                    <p className="text-gray-600 mb-2">
                      <span className="font-medium">Fecha:</span> {new Date(order.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 mb-1">Bs {order.total}</div>
                    <div className="text-sm text-gray-500">+ Bs {order.shipping_cost} envío</div>
                  </div>
                </div>

                {/* Barra de progreso */}
                {order.status !== 'CANCELLED' && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progreso del pedido</span>
                      <span>{getStatusProgress(order.status)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[#00BCD4] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getStatusProgress(order.status)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Pendiente</span>
                      <span>Procesando</span>
                      <span>Enviado</span>
                      <span>Entregado</span>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <button
                    onClick={() => handleRefreshStatus(order.id)}
                    className="bg-[#00BCD4] hover:bg-[#0097A7] text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Actualizar Estado
                  </button>
                  <button
                    onClick={() => handleReceipt(order.id)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Descargar Comprobante
                  </button>
                  <button
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {expandedOrder === order.id ? 'Ocultar Detalles' : 'Ver Detalles'}
                  </button>
                </div>

                {/* Detalles expandidos */}
                {expandedOrder === order.id && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Productos en esta orden:</h4>
                    <div className="space-y-2">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {item.product.name || item.product.nombre}
                            </div>
                            <div className="text-sm text-gray-500">
                              SKU: {item.product.sku} • Cantidad: {item.quantity}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">Bs {item.subtotal}</div>
                            <div className="text-sm text-gray-500">Bs {item.price} c/u</div>
                          </div>
                        </div>
                      )) || (
                        <p className="text-gray-500 text-sm">No se pudieron cargar los detalles de los productos.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
