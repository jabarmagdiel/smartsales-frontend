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
  can_return: boolean;
  existing_return_status?: string;
}

interface Order {
  id: number;
  order_number: string;
  created_at: string;
  status: string;
  total: string;
  items: OrderItem[];
}

interface Return {
  id: number;
  product_name: string;
  reason: string;
  quantity: number;
  status: string;
  created_at: string;
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
  
  // Modal state
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [returnForm, setReturnForm] = useState({
    reason: '',
    description: '',
    quantity: 1
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Cargando órdenes disponibles para devolución...');
      
      // Cargar órdenes disponibles para devolución
      const ordersResponse = await apiClient.get('/pedidos/');
      console.log('✅ Órdenes cargadas:', ordersResponse.data);
      
      // Filtrar solo órdenes DELIVERED y formatear datos
      const deliveredOrders = (ordersResponse.data.results || ordersResponse.data)
        .filter((order: any) => order.status === 'DELIVERED')
        .map((order: any) => ({
          id: order.id,
          order_number: `ORD-${order.id.toString().padStart(6, '0')}`,
          created_at: order.created_at,
          status: order.status,
          total: order.total,
          items: order.items.map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            product_sku: item.product_sku || 'N/A',
            quantity: item.quantity,
            price: item.price,
            can_return: true, // Por ahora asumimos que todos pueden devolverse
            existing_return_status: null
          }))
        }));
      
      setOrders(deliveredOrders);
      
      // Cargar historial de devoluciones
      const returnsResponse = await apiClient.get('/devoluciones/');
      console.log('✅ Devoluciones cargadas:', returnsResponse.data);
      setReturns(returnsResponse.data.results || returnsResponse.data);
      
    } catch (err: any) {
      console.error('❌ Error al cargar datos:', err);
      setError(err?.response?.data?.detail || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReturn = (item: OrderItem) => {
    console.log('🔍 Solicitando devolución para:', item);
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

    // Validaciones
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
    console.log('🔍 Token en localStorage:', localStorage.getItem('access_token') ? 'PRESENTE' : 'AUSENTE');

    try {
      console.log('🔍 Haciendo POST a /devoluciones/...');
      const response = await apiClient.post('/devoluciones/', requestData);
      
      console.log('✅ Devolución creada exitosamente:', response.data);
      
      setSuccess(`✅ ${response.data.message || 'Solicitud de devolución enviada exitosamente'}`);
      setShowReturnForm(false);
      setSelectedItem(null);
      setReturnForm({ reason: '', description: '', quantity: 1 });
      
      // Recargar datos
      loadData();
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('❌ Error al crear devolución:', err);
      
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
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      case 'PROCESSED': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00BCD4] mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando órdenes disponibles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Solicitar Devolución</h1>
        <button
          onClick={loadData}
          className="bg-[#00BCD4] hover:bg-[#0097A7] text-white font-semibold py-2 px-4 rounded-md"
        >
          Refrescar
        </button>
      </div>

      {/* Mensajes */}
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

      {/* Órdenes Disponibles */}
      <div className="bg-white shadow-md rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Órdenes Disponibles para Devolución</h2>
          <p className="text-sm text-gray-600">Solo se muestran órdenes entregadas</p>
        </div>
        
        {orders.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p className="text-lg mb-2">No hay órdenes disponibles para devolución</p>
            <p className="text-sm">Las órdenes deben estar en estado "Entregado" para poder solicitar devoluciones.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {orders.map((order) => (
              <div key={order.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{order.order_number}</h3>
                    <p className="text-sm text-gray-500">
                      Fecha: {new Date(order.created_at).toLocaleDateString('es-ES')} | 
                      Total: Bs {order.total}
                    </p>
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    {order.status}
                  </span>
                </div>
                
                <div className="grid gap-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                        <p className="text-sm text-gray-500">
                          SKU: {item.product_sku} | Cantidad: {item.quantity} | Precio: Bs {item.price}
                        </p>
                        {item.existing_return_status && (
                          <p className="text-xs text-red-500 mt-1">
                            Ya existe una devolución: {item.existing_return_status}
                          </p>
                        )}
                      </div>
                      
                      {item.can_return ? (
                        <button
                          onClick={() => handleRequestReturn(item)}
                          className="bg-[#00BCD4] hover:bg-[#0097A7] text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Solicitar Devolución
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400 px-4 py-2">
                          No disponible
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial de Devoluciones */}
      <div className="bg-white shadow-md rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Mis Devoluciones</h2>
        </div>
        
        {returns.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No tienes devoluciones registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {returns.map((returnItem) => (
                  <tr key={returnItem.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {returnItem.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {returnItem.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {returnItem.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(returnItem.status)}`}>
                        {returnItem.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(returnItem.created_at).toLocaleDateString('es-ES')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
