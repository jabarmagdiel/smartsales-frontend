'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/services/apiClient';

interface Product {
  id: number;
  name: string;
  sku: string;
}

interface Order {
  id: number;
  status: string;
  total: string;
}

interface Warranty {
  id: number;
  product: Product;
  product_name: string;
  order: Order;
  order_id: number;
  duration_months: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  resolution_status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  vigente: boolean;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default function WarrantyManagementPage() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  const fetchWarranties = async () => {
    try {
      setLoading(true);
      // Para administradores: obtener TODAS las garantías
      const response = await apiClient.get<PaginatedResponse<Warranty>>('/gestion-garantias/');
      setWarranties(response.data.results);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Error al cargar las garantías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarranties();
  }, []);

  const handleAction = async (warrantyId: number, action: 'activate' | 'deactivate' | 'resolve' | 'reject') => {
    try {
      setProcessingIds(prev => new Set(prev).add(warrantyId));
      
      await apiClient.patch(`/gestion-garantias/${warrantyId}/${action}/`);
      
      setSuccess(`Garantía ${action === 'activate' ? 'activada' : action === 'deactivate' ? 'desactivada' : action === 'resolve' ? 'resuelta' : 'rechazada'} correctamente`);
      setTimeout(() => setSuccess(null), 3000);
      
      // Refrescar la lista
      fetchWarranties();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || `Error al ${action} la garantía`);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(warrantyId);
        return newSet;
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'RESOLVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'RESOLVED': return 'Resuelta';
      case 'REJECTED': return 'Rechazada';
      default: return status;
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredWarranties = warranties.filter(warranty => {
    const matchesSearch = warranty.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warranty.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warranty.order_id.toString().includes(searchTerm);
    const matchesStatus = !statusFilter || warranty.resolution_status === statusFilter;
    const matchesActive = !activeFilter || 
                         (activeFilter === 'active' && warranty.is_active) ||
                         (activeFilter === 'inactive' && !warranty.is_active);
    return matchesSearch && matchesStatus && matchesActive;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-lg text-gray-600">Cargando garantías...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Garantías (CU14) - Administrador</h1>
        <button
          onClick={fetchWarranties}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar por producto, SKU u orden
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
              placeholder="Ej: Laptop, SKU123, orden 456..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado de resolución
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
            >
              <option value="">Todos los estados</option>
              <option value="PENDING">Pendiente</option>
              <option value="RESOLVED">Resuelta</option>
              <option value="REJECTED">Rechazada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado de actividad
            </label>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
            >
              <option value="">Todas</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de garantías */}
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Orden
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duración
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vigencia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredWarranties.map((warranty) => (
              <tr key={warranty.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{warranty.product_name}</div>
                  <div className="text-xs text-gray-500">SKU: {warranty.product.sku}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">#{warranty.order_id}</div>
                  <div className="text-xs text-gray-500">Total: Bs {warranty.order.total}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{warranty.duration_months} meses</div>
                  <div className="text-xs text-gray-500">
                    {new Date(warranty.start_date).toLocaleDateString('es-ES')} - {new Date(warranty.end_date).toLocaleDateString('es-ES')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col space-y-1">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      warranty.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {warranty.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                    {warranty.is_active && (
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        warranty.vigente ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {warranty.vigente ? `${getDaysRemaining(warranty.end_date)} días` : 'Expirada'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(warranty.resolution_status)}`}>
                    {getStatusLabel(warranty.resolution_status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex flex-col space-y-2">
                    {warranty.is_active ? (
                      <button
                        onClick={() => handleAction(warranty.id, 'deactivate')}
                        disabled={processingIds.has(warranty.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                      >
                        {processingIds.has(warranty.id) ? 'Procesando...' : 'Desactivar'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(warranty.id, 'activate')}
                        disabled={processingIds.has(warranty.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                      >
                        {processingIds.has(warranty.id) ? 'Procesando...' : 'Activar'}
                      </button>
                    )}
                    
                    {warranty.resolution_status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleAction(warranty.id, 'resolve')}
                          disabled={processingIds.has(warranty.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                        >
                          {processingIds.has(warranty.id) ? 'Procesando...' : 'Resolver'}
                        </button>
                        <button
                          onClick={() => handleAction(warranty.id, 'reject')}
                          disabled={processingIds.has(warranty.id)}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                        >
                          {processingIds.has(warranty.id) ? 'Procesando...' : 'Rechazar'}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredWarranties.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">No se encontraron garantías que coincidan con los filtros.</p>
        </div>
      )}
    </div>
  );
}
