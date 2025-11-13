'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/services/apiClient';

interface Return {
  id: number;
  order_id: number;
  order_number: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  status_display: string;
  created_at: string;
  processed_by: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  } | null;
  user_name: string;
}

export default function ReturnsManagementPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Cargando devoluciones para gestión...');
      const response = await apiClient.get('/gestion-devoluciones/');
      console.log('✅ Devoluciones cargadas:', response.data);
      
      setReturns(response.data.results || response.data);
    } catch (err: any) {
      console.error('❌ Error al cargar devoluciones:', err);
      setError(err?.response?.data?.detail || 'Error al cargar las devoluciones');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (returnId: number, action: 'approve' | 'reject' | 'process') => {
    setProcessingIds(prev => new Set(prev).add(returnId));
    setError(null);
    
    try {
      console.log(`🔍 Ejecutando acción ${action} en devolución ${returnId}`);
      
      const response = await apiClient.patch(`/gestion-devoluciones/${returnId}/${action}/`);
      console.log('✅ Acción ejecutada:', response.data);
      
      const actionLabels = {
        approve: 'aprobada',
        reject: 'rechazada',
        process: 'procesada'
      };
      
      setSuccess(`Devolución ${actionLabels[action]} exitosamente`);
      setTimeout(() => setSuccess(null), 3000);
      
      // Refrescar la lista
      fetchReturns();
    } catch (err: any) {
      console.error(`❌ Error al ${action} devolución:`, err);
      setError(err?.response?.data?.error || err?.response?.data?.detail || `Error al ${action} la devolución`);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(returnId);
        return newSet;
      });
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'APPROVED': return 'Aprobada';
      case 'REJECTED': return 'Rechazada';
      case 'PROCESSED': return 'Procesada';
      default: return status;
    }
  };

  // Filtrar devoluciones
  const filteredReturns = returns.filter(returnItem => {
    const matchesSearch = returnItem.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         returnItem.product_sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         returnItem.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         returnItem.order_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || returnItem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00BCD4] mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando devoluciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestionar Devoluciones (CU13)</h1>
        <button
          onClick={fetchReturns}
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

      {/* Filtros */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar por producto, SKU, usuario o número de orden
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-[#00BCD4] focus:border-[#00BCD4] text-gray-900"
              placeholder="Ej: Laptop, SKU123, cliente_demo, ORD-000001..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-[#00BCD4] focus:border-[#00BCD4] text-gray-900"
            >
              <option value="">Todos los estados</option>
              <option value="PENDING">Pendiente</option>
              <option value="APPROVED">Aprobada</option>
              <option value="REJECTED">Rechazada</option>
              <option value="PROCESSED">Procesada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de devoluciones */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {filteredReturns.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p className="text-lg mb-2">No se encontraron devoluciones</p>
            <p className="text-sm">
              {returns.length === 0 
                ? 'No hay devoluciones registradas en el sistema.'
                : 'Intenta ajustar los filtros de búsqueda.'
              }
            </p>
          </div>
        ) : (
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
                    Cliente
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
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReturns.map((returnItem) => (
                  <tr key={returnItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{returnItem.id}</div>
                      <div className="text-xs text-gray-500">{returnItem.order_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{returnItem.product_name}</div>
                      <div className="text-xs text-gray-500">
                        SKU: {returnItem.product_sku} | Cantidad: {returnItem.quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{returnItem.user_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{returnItem.reason}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(returnItem.status)}`}>
                        {getStatusLabel(returnItem.status)}
                      </span>
                      {returnItem.processed_by && (
                        <div className="text-xs text-gray-500 mt-1">
                          Por: {returnItem.processed_by.first_name} {returnItem.processed_by.last_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(returnItem.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col space-y-2">
                        {returnItem.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleAction(returnItem.id, 'approve')}
                              disabled={processingIds.has(returnItem.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                            >
                              {processingIds.has(returnItem.id) ? 'Procesando...' : 'Aprobar'}
                            </button>
                            <button
                              onClick={() => handleAction(returnItem.id, 'reject')}
                              disabled={processingIds.has(returnItem.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                            >
                              {processingIds.has(returnItem.id) ? 'Procesando...' : 'Rechazar'}
                            </button>
                          </>
                        )}
                        {returnItem.status === 'APPROVED' && (
                          <button
                            onClick={() => handleAction(returnItem.id, 'process')}
                            disabled={processingIds.has(returnItem.id)}
                            className="bg-[#00BCD4] hover:bg-[#0097A7] text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                          >
                            {processingIds.has(returnItem.id) ? 'Procesando...' : 'Procesar'}
                          </button>
                        )}
                        {(returnItem.status === 'REJECTED' || returnItem.status === 'PROCESSED') && (
                          <span className="text-xs text-gray-500">
                            {returnItem.status === 'REJECTED' ? 'Rechazada' : 'Completada'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{returns.length}</div>
          <div className="text-sm text-gray-500">Total Devoluciones</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">
            {returns.filter(r => r.status === 'PENDING').length}
          </div>
          <div className="text-sm text-gray-500">Pendientes</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {returns.filter(r => r.status === 'APPROVED').length}
          </div>
          <div className="text-sm text-gray-500">Aprobadas</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">
            {returns.filter(r => r.status === 'PROCESSED').length}
          </div>
          <div className="text-sm text-gray-500">Procesadas</div>
        </div>
      </div>
    </div>
  );
}
