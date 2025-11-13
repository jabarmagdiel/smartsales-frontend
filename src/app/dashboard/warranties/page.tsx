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

export default function MyWarrantiesPage() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWarranties = async () => {
    try {
      setLoading(true);
      // Para clientes: solo sus propias garantías
      const response = await apiClient.get<PaginatedResponse<Warranty>>('/garantias/');
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

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-lg text-gray-600">Cargando mis garantías...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Mis Garantías</h1>
        <button
          onClick={fetchWarranties}
          className="bg-[#00BCD4] hover:bg-[#0097A7] text-white font-semibold py-2 px-4 rounded-md"
        >
          Refrescar
        </button>
      </div>

      {/* Mensajes de error */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Vista simple de garantías como en la imagen */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div>PRODUCTO</div>
            <div>DURACIÓN</div>
            <div>ESTADO</div>
            <div>VIGENCIA</div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {warranties.map((warranty) => (
            <div key={warranty.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="grid grid-cols-4 gap-4 items-center">
                {/* Producto */}
                <div>
                  <div className="text-sm font-medium text-gray-900">{warranty.product_name}</div>
                  <div className="text-xs text-gray-500">SKU: {warranty.product.sku}</div>
                </div>
                
                {/* Duración */}
                <div>
                  <div className="text-sm text-gray-900">{warranty.duration_months} meses</div>
                  <div className="text-xs text-gray-500">
                    {new Date(warranty.start_date).toLocaleDateString('es-ES')} - {new Date(warranty.end_date).toLocaleDateString('es-ES')}
                  </div>
                </div>
                
                {/* Estado */}
                <div>
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(warranty.resolution_status)}`}>
                    {getStatusLabel(warranty.resolution_status)}
                  </span>
                </div>
                
                {/* Vigencia */}
                <div>
                  {warranty.is_active ? (
                    <div className="flex flex-col space-y-1">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Activa
                      </span>
                      {warranty.vigente ? (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {getDaysRemaining(warranty.end_date)} días
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Expirada
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      Inactiva
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {warranties.length === 0 && !loading && (
        <div className="text-center py-8">
          <div className="text-gray-500">
            <p className="text-lg mb-2">No tienes garantías registradas</p>
            <p className="text-sm">Las garantías aparecerán aquí cuando realices compras de productos con garantía.</p>
          </div>
        </div>
      )}
    </div>
  );
}
