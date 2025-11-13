// src/app/dashboard/inventory/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { getInventoryMovements, createInventoryMovement, IInventoryMovement } from '@/services/inventoryService';
import { getProducts, IProduct } from '@/services/productService'; 

export default function InventoryPage() {
  const [movements, setMovements] = useState<IInventoryMovement[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // --- Estado para las pestañas ---
  const [activeTab, setActiveTab] = useState<'movements' | 'inventory'>('inventory');

  // --- Estado para el Formulario de Registro ---
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [tipoMovimiento, setTipoMovimiento] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
  const [cantidad, setCantidad] = useState<number>(1);
  const [motivo, setMotivo] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Carga inicial de datos
  const fetchData = async () => {
    try {
      setLoading(true);
      const [movData, prodData] = await Promise.all([
        getInventoryMovements(),
        getProducts() 
      ]);
      setMovements(movData);
      setProducts(prodData);
      if (prodData.length > 0) {
        setSelectedProduct(String(prodData[0].id)); 
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handler para registrar el movimiento
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (cantidad <= 0 || !selectedProduct) {
      setSubmitError('La cantidad debe ser mayor a 0 y debe seleccionar un producto.');
      return;
    }

    try {
      await createInventoryMovement({
        producto_id: parseInt(selectedProduct),
        tipo_movimiento: tipoMovimiento,
        cantidad: cantidad,
        motivo: motivo || 'Ajuste manual',
      });
      setCantidad(1);
      setMotivo('');
      fetchData(); 
    } catch (err: any) {
      setSubmitError(err.message || 'Error al registrar el movimiento.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-lg text-gray-600">Cargando datos de inventario...</p>
      </div>
    );
  }
  
  if (error) {
     return (
      <div className="flex items-center justify-center p-10">
        <p className="text-lg text-red-600 bg-red-100 p-4 rounded-md border border-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Control de Inventario (CU3)</h1>

      {/* --- Sistema de Pestañas --- */}
      <div className="bg-white shadow-md rounded-lg mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'inventory'
                  ? 'border-[#00BCD4] text-[#00BCD4]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📦 Ver Inventario
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'movements'
                  ? 'border-[#00BCD4] text-[#00BCD4]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📋 Movimientos
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* --- Pestaña Ver Inventario --- */}
          {activeTab === 'inventory' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Estado Actual del Inventario</h2>
              
              {/* Tabla de Inventario */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock Actual
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Garantía
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {product.image ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={product.image}
                                  alt={product.name}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-gray-600 text-xs">📦</span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {product.description || 'Sin descripción'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                            {product.sku}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                          <span className={`${
                            product.stock <= 5 
                              ? 'text-red-600' 
                              : product.stock <= 10 
                              ? 'text-yellow-600' 
                              : 'text-green-600'
                          }`}>
                            {product.stock} unidades
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-semibold">Bs {product.precio}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="bg-blue-100 px-2 py-1 rounded text-xs font-medium text-blue-800">
                            {product.warranty_months || 12} meses
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.stock <= 0 
                              ? 'bg-red-100 text-red-800' 
                              : product.stock <= 5 
                              ? 'bg-yellow-100 text-yellow-800'
                              : product.stock <= 10
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {product.stock <= 0 
                              ? '❌ Agotado' 
                              : product.stock <= 5 
                              ? '⚠️ Crítico'
                              : product.stock <= 10
                              ? '📊 Bajo'
                              : '✅ Disponible'
                            }
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {products.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay productos registrados en el inventario.</p>
                </div>
              )}

              {/* Resumen de Inventario */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-green-600 text-2xl">✅</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">Disponibles</p>
                      <p className="text-lg font-bold text-green-900">
                        {products.filter(p => p.stock > 10).length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-blue-600 text-2xl">📊</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-800">Stock Bajo</p>
                      <p className="text-lg font-bold text-blue-900">
                        {products.filter(p => p.stock > 5 && p.stock <= 10).length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-yellow-600 text-2xl">⚠️</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-800">Críticos</p>
                      <p className="text-lg font-bold text-yellow-900">
                        {products.filter(p => p.stock > 0 && p.stock <= 5).length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-red-600 text-2xl">❌</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">Agotados</p>
                      <p className="text-lg font-bold text-red-900">
                        {products.filter(p => p.stock <= 0).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- Pestaña Movimientos --- */}
          {activeTab === 'movements' && (
            <div>
              {/* Formulario de Registro de Movimiento */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Registrar Movimiento</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  
                  <div className="flex flex-col">
                    <label htmlFor="producto" className="text-sm font-medium text-gray-700">Producto</label>
                    <select
                      id="producto"
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label htmlFor="tipo_movimiento" className="text-sm font-medium text-gray-700">Tipo</label>
                    <select
                      id="tipo_movimiento"
                      value={tipoMovimiento}
                      onChange={(e) => setTipoMovimiento(e.target.value as 'ENTRADA' | 'SALIDA')}
                      className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                    >
                      <option value="ENTRADA">Entrada (Sumar)</option>
                      <option value="SALIDA">Salida (Restar)</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label htmlFor="cantidad" className="text-sm font-medium text-gray-700">Cantidad</label>
                    <input
                      type="number"
                      id="cantidad"
                      value={cantidad}
                      min="1"
                      onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                      className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-[#00BCD4] hover:bg-[#0097A7] text-white font-semibold py-2 px-4 rounded-md transition duration-150 shadow-md"
                  >
                    Registrar Movimiento
                  </button>
                  
                  <div className="md:col-span-4">
                     <label htmlFor="motivo" className="text-sm font-medium text-gray-700">Motivo (Opcional)</label>
                    <input
                      type="text"
                      id="motivo"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                      placeholder="Ej: Ajuste de inventario, Devolución de cliente..."
                    />
                  </div>
                  
                  {submitError && <p className="md:col-span-4 text-red-600">{submitError}</p>}
                </form>
              </div>

              {/* Historial de Movimientos */}
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Historial de Movimientos</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {movements.map((mov) => (
                        <tr key={mov.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(mov.fecha_movimiento).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {mov.producto.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span 
                              className={`font-semibold ${
                                mov.tipo_movimiento === 'ENTRADA' ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {mov.tipo_movimiento}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                            {mov.tipo_movimiento === 'ENTRADA' ? '+' : '-'}{mov.cantidad}
                          </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {mov.motivo}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {movements.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No hay movimientos de inventario registrados.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}