'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/services/apiClient';

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  price: string;
  subtotal: string;
  can_return: boolean;
  existing_return_id?: number;
  existing_return_status?: string;
}

interface Order {
  id: number;
  created_at: string;
  status: string;
  total: string;
  items: OrderItem[];
}

interface Return {
  id: number;
  order_number: string;
  product_name: string;
  reason: string;
  reason_display: string;
  description: string;
  quantity: number;
  status: string;
  status_display: string;
  requested_at: string;
  refund_amount?: string;
}

const RETURN_REASONS = [
  { value: 'DEFECTIVE', label: 'Producto Defectuoso' },
  { value: 'WRONG_ITEM', label: 'Producto Incorrecto' },
  { value: 'NOT_AS_DESCRIBED', label: 'No Como se Describió' },
  { value: 'DAMAGED_SHIPPING', label: 'Dañado en Envío' },
  { value: 'CHANGED_MIND', label: 'Cambio de Opinión' },
  { value: 'SIZE_ISSUE', label: 'Problema de Talla/Tamaño' },
  { value: 'OTHER', label: 'Otro' },
];

export default function RequestReturnPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'request' | 'history'>('request');
  
  // Estado para el formulario de devolución
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [returnForm, setReturnForm] = useState({
    reason: '',
    description: '',
    quantity: 1
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    console.log('🔍 Cargando datos de devoluciones...');
    
    try {
      // Obtener órdenes que pueden ser devueltas
      console.log('🔍 Obteniendo órdenes para devolución...');
      const ordersResponse = await apiClient.get('/devoluciones/my_orders_for_return/');
      console.log('✅ Órdenes obtenidas:', ordersResponse.data);
      setOrders(ordersResponse.data);
      
      // Obtener historial de devoluciones
      console.log('🔍 Obteniendo historial de devoluciones...');
      const returnsResponse = await apiClient.get('/devoluciones/');
      console.log('✅ Devoluciones obtenidas:', returnsResponse.data);
      setReturns(returnsResponse.data.results || returnsResponse.data);
    } catch (err: any) {
      console.error('❌ Error al cargar datos:', err);
      setError(err?.response?.data?.detail || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReturn = (item: OrderItem) => {
    setSelectedItem(item);
    setReturnForm({
      reason: '',
      description: '',
      quantity: 1
    });
    setShowReturnForm(true);
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    // Validación adicional
    if (!returnForm.reason) {
      setError('Por favor selecciona un motivo para la devolución');
      return;
    }
    
    if (!returnForm.description.trim()) {
      setError('Por favor proporciona una descripción detallada');
      return;
    }
    
    if (returnForm.quantity < 1 || returnForm.quantity > selectedItem.quantity) {
      setError(`La cantidad debe estar entre 1 y ${selectedItem.quantity}`);
      return;
    }

    setSubmitting(true);
    setError(null);

    const requestData = {
      order_item: selectedItem.id,
      reason: returnForm.reason,
      description: returnForm.description,
      quantity: returnForm.quantity
    };

    console.log('🔍 Enviando solicitud de devolución:', requestData);
    console.log('🔍 Selected item:', selectedItem);

    try {
      const response = await apiClient.post('/devoluciones/', requestData);
      
      console.log('✅ Respuesta exitosa:', response.data);
      
      setSuccess(`✅ Solicitud de devolución enviada exitosamente para ${selectedItem.product_name}`);
      setShowReturnForm(false);
      setSelectedItem(null);
      setReturnForm({ reason: '', description: '', quantity: 1 }); // Limpiar formulario
      fetchData(); // Refrescar datos
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('❌ Error completo:', err);
      console.error('❌ Response data:', err?.response?.data);
      console.error('❌ Status:', err?.response?.status);
      console.error('❌ Headers:', err?.response?.headers);
      
      let errorMessage = 'Error al enviar la solicitud';
      
      if (err?.response?.data) {
        if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.non_field_errors) {
          errorMessage = err.response.data.non_field_errors[0];
        } else if (err.response.data.order_item) {
          errorMessage = `Error en order_item: ${err.response.data.order_item[0]}`;
        } else if (err.response.data.reason) {
          errorMessage = `Error en motivo: ${err.response.data.reason[0]}`;
        } else if (err.response.data.quantity) {
          errorMessage = `Error en cantidad: ${err.response.data.quantity[0]}`;
        } else {
          errorMessage = JSON.stringify(err.response.data);
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REQUESTED': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00BCD4] mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando información de devoluciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00BCD4] to-[#0097A7] text-white p-6 mb-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-2">🔄 Solicitar Devolución</h1>
          <p className="text-lg opacity-90">Gestiona las devoluciones de tus productos</p>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            ❌ {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('request')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'request'
                    ? 'border-[#00BCD4] text-[#00BCD4]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🛒 Solicitar Devolución
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-[#00BCD4] text-[#00BCD4]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📋 Historial de Devoluciones
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'request' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Órdenes Disponibles para Devolución</h2>
            
            {orders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay órdenes disponibles</h3>
                <p className="text-gray-500">
                  Solo puedes solicitar devoluciones para órdenes entregadas en los últimos 30 días.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Orden #{order.id}</h3>
                          <p className="text-sm text-gray-500">
                            📅 {new Date(order.created_at).toLocaleDateString('es-ES')} • 
                            💰 Bs {order.total} • 
                            📊 {order.status}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h4 className="font-medium text-gray-900 mb-4">Productos:</h4>
                      <div className="space-y-4">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{item.product_name}</h5>
                              <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>
                              <p className="text-sm text-gray-600">
                                Cantidad: {item.quantity} • Precio: Bs {item.price}
                              </p>
                            </div>
                            
                            <div className="ml-4">
                              {item.can_return ? (
                                <button
                                  onClick={() => handleRequestReturn(item)}
                                  className="bg-[#00BCD4] hover:bg-[#0097A7] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                  🔄 Solicitar Devolución
                                </button>
                              ) : (
                                <div className="text-center">
                                  <span className="inline-block px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full mb-1">
                                    No disponible
                                  </span>
                                  {item.existing_return_status && (
                                    <p className="text-xs text-gray-500">
                                      Devolución: {item.existing_return_status}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Historial de Devoluciones</h2>
            
            {returns.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay devoluciones</h3>
                <p className="text-gray-500">Aún no has solicitado ninguna devolución.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Devolución
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Producto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Motivo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reembolso
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {returns.map((returnItem) => (
                        <tr key={returnItem.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">#{returnItem.id}</div>
                            <div className="text-sm text-gray-500">Orden #{returnItem.order_number}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{returnItem.product_name}</div>
                            <div className="text-sm text-gray-500">Cantidad: {returnItem.quantity}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{returnItem.reason_display}</div>
                            {returnItem.description && (
                              <div className="text-sm text-gray-500 mt-1 max-w-xs truncate" title={returnItem.description}>
                                {returnItem.description}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(returnItem.status)}`}>
                              {returnItem.status_display}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(returnItem.requested_at).toLocaleDateString('es-ES')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {returnItem.refund_amount ? `Bs Bs {returnItem.refund_amount}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal para solicitar devolución */}
      {showReturnForm && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Solicitar Devolución
            </h3>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{selectedItem.product_name}</p>
              <p className="text-sm text-gray-500">SKU: {selectedItem.product_sku}</p>
              <p className="text-sm text-gray-600">Precio: Bs {selectedItem.price}</p>
            </div>

            <form onSubmit={handleSubmitReturn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de la devolución *
                </label>
                <select
                  value={returnForm.reason}
                  onChange={(e) => setReturnForm({...returnForm, reason: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-[#00BCD4] focus:border-[#00BCD4]"
                >
                  <option value="">Selecciona un motivo</option>
                  {RETURN_REASONS.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad a devolver *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedItem.quantity}
                  value={returnForm.quantity}
                  onChange={(e) => setReturnForm({...returnForm, quantity: parseInt(e.target.value)})}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-[#00BCD4] focus:border-[#00BCD4]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Máximo: {selectedItem.quantity} unidades
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción detallada *
                </label>
                <textarea
                  value={returnForm.description}
                  onChange={(e) => setReturnForm({...returnForm, description: e.target.value})}
                  required
                  rows={3}
                  placeholder="Describe el problema con el producto..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-[#00BCD4] focus:border-[#00BCD4]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#00BCD4] hover:bg-[#0097A7] text-white py-2 px-4 rounded-md font-medium disabled:opacity-50 transition-colors"
                >
                  {submitting ? '⏳ Enviando...' : '📤 Enviar Solicitud'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReturnForm(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium transition-colors"
                >
                  ❌ Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
