'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/services/apiClient';

interface OrderItem {
  id: number;
  product: {
    id: number;
    name: string;
    sku: string;
    price: string;
  };
  quantity: number;
  price: string;
  subtotal: string;
}

interface Order {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  payment_method: 'CASH' | 'PAYPAL' | 'STRIPE';
  payment_method_display: string;
  total: string;
  shipping_cost: string;
  address: string;
  phone: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default function OrderManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<PaginatedResponse<Order>>('/gestion-ordenes/');
      setOrders(response.data.results);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Error al cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      setUpdatingIds(prev => new Set(prev).add(orderId));
      await apiClient.post(`/gestion-ordenes/${orderId}/actualizar_estado/`, { status: newStatus });
      setSuccess(`Estado de la orden #${orderId} actualizado a ${getStatusLabel(newStatus)}`);
      setTimeout(() => setSuccess(null), 3000);
      fetchOrders();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al actualizar el estado');
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handleConfirmDelivery = async (orderId: number) => {
    try {
      setUpdatingIds(prev => new Set(prev).add(orderId));
      await apiClient.post(`/gestion-ordenes/${orderId}/confirmar_entrega_y_pago/`);
      setSuccess(`Entrega confirmada para la orden #${orderId}`);
      setTimeout(() => setSuccess(null), 3000);
      fetchOrders();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al confirmar entrega');
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CONFIRMED': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'PAID': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SHIPPED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'CONFIRMED': return 'Confirmado';
      case 'PAID': return 'Pagado';
      case 'SHIPPED': return 'Enviado';
      case 'DELIVERED': return 'Entregado';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'PENDING': return 'CONFIRMED';
      case 'CONFIRMED': return 'SHIPPED';
      case 'PAID': return 'SHIPPED';
      case 'PROCESSING': return 'SHIPPED';
      case 'SHIPPED': return 'DELIVERED';
      default: return null;
    }
  };

  const canCancel = (status: string) => {
    return ['PENDING', 'CONFIRMED', 'PAID'].includes(status);
  };

  const needsDeliveryConfirmation = (order: Order) => {
    // Verificar si es una orden enviada que necesita confirmación de entrega
    return order.status === 'SHIPPED';
  };

  const isCashOnDelivery = (order: Order) => {
    // Verificar si es pago contra entrega
    return order.payment_method === 'CASH';
  };

  const filteredOrders = orders.filter(order => {
    const username = order.user?.username || '';
    const firstName = order.user?.first_name || '';
    const lastName = order.user?.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const email = order.user?.email || '';
    
    const matchesSearch = username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toString().includes(searchTerm) ||
                         fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || order.status === statusFilter;
    
    const matchesDate = !dateFilter || order.created_at.startsWith(dateFilter);
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const toggleOrderDetails = (orderId: number) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00BCD4] mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando órdenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">🛒 Gestión de Pedidos</h1>
        <button
          onClick={fetchOrders}
          className="bg-[#00BCD4] hover:bg-[#0097A7] text-white font-semibold py-2 px-4 rounded-md transition-colors"
        >
          🔄 Refrescar
        </button>
      </div>

      {/* Mensajes de estado */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-md">
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-300 text-green-700 rounded-md">
          ✅ {success}
        </div>
      )}

      {/* Sección de Filtros */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">🔍 Filtros de Búsqueda</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar por cliente, orden o dirección
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
              placeholder="Ej: juan123, #123, Juan Pérez, Av. Principal..."
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por fecha
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(status => {
          const count = orders.filter(order => order.status === status).length;
          return (
            <div key={status} className="bg-white shadow-md rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold ${getStatusColor(status).split(' ')[1]}`}>
                {count}
              </div>
              <div className="text-sm text-gray-600">{getStatusLabel(status)}</div>
            </div>
          );
        })}
      </div>

      {/* Sección de Resultados */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">📋 Órdenes de Compra</h2>
          <p className="text-sm text-gray-600 mt-1">Total de órdenes encontradas: {filteredOrders.length}</p>
        </div>

        {/* Lista de órdenes */}
        <div className="divide-y divide-gray-200">
          {filteredOrders.map((order) => {
            const username = order.user?.username || '';
            const firstName = order.user?.first_name || '';
            const lastName = order.user?.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim();
            const isExpanded = expandedOrder === order.id;

            return (
              <div key={order.id} className="p-6 hover:bg-gray-50">
                {/* Información principal de la orden */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm font-bold text-gray-900">Orden #{order.id}</div>
                      <div className="text-xs text-gray-500">📅 {new Date(order.created_at).toLocaleDateString('es-ES')}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">👤 {username}</div>
                      <div className="text-xs text-gray-500">{fullName || 'Sin nombre completo'}</div>
                      <div className="text-xs text-blue-600 mt-1">
                        {order.payment_method === 'CASH' && '💵 Efectivo (Contra entrega)'}
                        {order.payment_method === 'PAYPAL' && '💙 PayPal'}
                        {order.payment_method === 'STRIPE' && '💜 Tarjeta de crédito'}
                        {!order.payment_method && '❓ Método no especificado'}
                      </div>
                    </div>
                    <div>
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                        {order.status === 'PENDING' && <span className="ml-1">💳</span>}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">💰 Bs {order.total}</div>
                      {order.status === 'PENDING' && (
                        <div className="text-xs text-orange-600 mt-1 font-medium">⚠️ Requiere pago</div>
                      )}
                    </div>
                    <div className="text-right">
                      <button
                        onClick={() => toggleOrderDetails(order.id)}
                        className="text-[#00BCD4] hover:text-[#0097A7] text-sm font-medium"
                      >
                        {isExpanded ? '🔼 Ocultar detalles' : '🔽 Ver detalles'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Detalles expandidos */}
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Información del cliente */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3">👤 Información del Cliente</h4>
                        <div className="space-y-2 text-sm">
                          <div><strong>Usuario:</strong> {username}</div>
                          <div><strong>Nombre:</strong> {fullName || 'No especificado'}</div>
                          <div><strong>Email:</strong> {order.user?.email || 'No especificado'}</div>
                          <div><strong>Teléfono:</strong> {order.phone || 'No especificado'}</div>
                          <div><strong>Dirección:</strong> {order.address}</div>
                          <div><strong>Método de pago:</strong> {order.payment_method || 'No especificado'}</div>
                        </div>
                      </div>

                      {/* Productos */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3">📦 Productos ({order.items.length})</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                              <div>
                                <div className="font-medium">{item.product.name}</div>
                                <div className="text-gray-500">SKU: {item.product.sku}</div>
                              </div>
                              <div className="text-right">
                                <div>{item.quantity}x Bs {item.price}</div>
                                <div className="font-medium">Bs {item.subtotal}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>Bs {(parseFloat(order.total) - parseFloat(order.shipping_cost)).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Envío:</span>
                            <span>Bs {order.shipping_cost}</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span>Total:</span>
                            <span>Bs {order.total}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Información de pago */}
                    {order.status === 'PENDING' && order.payment_method !== 'CASH' && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-800">
                          <span>ℹ️</span>
                          <span className="text-sm font-medium">
                            Esta orden está esperando que el cliente complete el pago con {order.payment_method_display || order.payment_method}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="mt-6 flex flex-wrap gap-3">

                      {getNextStatus(order.status) && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, getNextStatus(order.status)!)}
                          disabled={updatingIds.has(order.id)}
                          className="bg-[#00BCD4] hover:bg-[#0097A7] text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
                        >
                          {updatingIds.has(order.id) ? '⚙️ Actualizando...' : `➡️ Marcar como ${getStatusLabel(getNextStatus(order.status)!)}`}
                        </button>
                      )}
                      
                      {canCancel(order.status) && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                          disabled={updatingIds.has(order.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
                        >
                          {updatingIds.has(order.id) ? '⚙️ Cancelando...' : '❌ Cancelar Orden'}
                        </button>
                      )}

                      <button
                        onClick={() => window.open(`/api/ordenes/${order.id}/comprobante/`, '_blank')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        📄 Ver Comprobante
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {filteredOrders.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-xl text-gray-500 mb-2">No se encontraron órdenes</p>
          <p className="text-gray-400">Intenta ajustar los filtros de búsqueda</p>
        </div>
      )}
    </div>
  );
}
