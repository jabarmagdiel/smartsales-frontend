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

interface Product {
  id: number;
  name: string;
  sku: string;
}

interface Return {
  id: number;
  order_id: number;
  order_number: string;
  product_name: string;
  product?: Product;
  quantity: number;
  reason: string;
  reason_display: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  status_display: string;
  created_at: string;
  requested_at: string;
  refund_amount?: string;
  processed_by: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  } | null;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<PaginatedResponse<Return>>('/gestion-devoluciones/');
      setReturns(response.data.results);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Error al cargar las devoluciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleAction = async (returnId: number, action: 'approve' | 'reject' | 'process') => {
    try {
      setProcessingIds(prev => new Set(prev).add(returnId));
      
      await apiClient.patch(`/gestion-devoluciones/${returnId}/${action}/`);
      
      setSuccess(`Devolución ${action === 'approve' ? 'aprobada' : action === 'reject' ? 'rechazada' : 'procesada'} correctamente`);
      setTimeout(() => setSuccess(null), 3000);
      
      // Refrescar la lista
      fetchReturns();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || `Error al ${action === 'approve' ? 'aprobar' : action === 'reject' ? 'rechazar' : 'procesar'} la devolución`);
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
      case 'APPROVED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      case 'PROCESSED': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'APPROVED': return 'Aprobado';
      case 'REJECTED': return 'Rechazado';
      case 'PROCESSED': return 'Procesado';
      default: return status;
    }
  };

  const filteredReturns = returns.filter(returnItem => {
    const matchesSearch = returnItem.order_id.toString().includes(searchTerm) ||
                         returnItem.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         returnItem.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || returnItem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-lg text-gray-600">Cargando devoluciones...</p>
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
              Buscar por orden, producto o motivo
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
              placeholder="Ej: 123, Laptop, defectuoso..."
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
              <option value="APPROVED">Aprobado</option>
              <option value="REJECTED">Rechazado</option>
              <option value="PROCESSED">Procesado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de devoluciones */}
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
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
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredReturns.map((returnItem) => (
              <tr key={returnItem.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">#{returnItem.id}</div>
                  <div className="text-xs text-gray-500">Orden #{returnItem.order_id}</div>
                  <div className="text-xs text-gray-500">Cantidad: {returnItem.quantity}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{returnItem.product_name}</div>
                  <div className="text-xs text-gray-500">SKU: {returnItem.product?.sku || 'N/A'}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate" title={returnItem.reason}>
                    {returnItem.reason}
                  </div>
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
                        {returnItem.status === 'REJECTED' ? 'Rechazado' : 'Completado'}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredReturns.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">No se encontraron devoluciones que coincidan con los filtros.</p>
        </div>
      )}
    </div>
  );
}
