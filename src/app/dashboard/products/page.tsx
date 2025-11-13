// src/app/dashboard/products/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { getProducts, deleteProduct, IProduct } from '@/services/productService'; 
import { addToCart } from '@/services/cartService';
import { addProductPrice } from '@/services/priceService';

import ProductFormModal from '@/components/ProductFormModal'; 

export default function ProductsPage() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // --- ESTADO PARA MANEJAR EL MODAL (CREAR/EDITAR) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<IProduct | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Función para cargar/refrescar los productos
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts(); 
      setProducts(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (id: number) => {
    try {
      await addToCart(id, 1);
      setActionMsg('Producto añadido al carrito');
      setTimeout(() => setActionMsg(null), 2000);
    } catch (err: any) {
      setError(err.message || 'No se pudo añadir al carrito');
    }
  };

  const handleQuickPrice = async (product: IProduct) => {
    const val = window.prompt('Nuevo precio (ej. 99.90):', (product as any).precio || '');
    if (!val) return;
    try {
      await addProductPrice(product.id, { price: String(val) });
      setActionMsg('Precio actualizado');
      setTimeout(() => setActionMsg(null), 2000);
      fetchProducts();
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar el precio');
    }
  };

  useEffect(() => {
    fetchProducts(); // Carga inicial
  }, []);

  // Handler para refrescar la tabla cuando el modal termine
  const handleSave = () => {
    fetchProducts();
  };

  // --- HANDLER PARA ABRIR MODAL (CREAR) ---
  const handleOpenCreateModal = () => {
    setProductToEdit(null); // Sin producto a editar
    setIsModalOpen(true);
  };

  // --- HANDLER PARA ABRIR MODAL (EDITAR) ---
  const handleOpenEditModal = (product: IProduct) => {
    setProductToEdit(product); // Con producto a editar
    setIsModalOpen(true);
  };

  // Handler para Eliminar Producto
  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await deleteProduct(id);
        fetchProducts(); // Refresca la tabla
      } catch (err: any) {
        setError(err.message || 'Error al eliminar el producto.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-lg text-gray-600">Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Productos (CU1)</h1>
        
        {/* Botón de Crear (Abre el Modal en modo 'Crear') */}
        <button
          onClick={handleOpenCreateModal}
          className="bg-[#00BCD4] hover:bg-[#0097A7] text-white font-semibold py-2 px-4 rounded-md"
        >
          + Crear Producto
        </button>
      </div>

      {error && (
        <p className="mb-4 text-center text-red-600 bg-red-100 p-4 rounded-md border border-red-300">
          {error}
        </p>
      )}
      {actionMsg && (
        <p className="mb-4 text-center text-green-600 bg-green-100 p-2 rounded-md border border-green-300">
          {actionMsg}
        </p>
      )}

      {/* Tabla de Productos (Tailwind CSS - Responsiva) */}
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {/* ... (Encabezados de la tabla) ... */}
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atributos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio (Bs)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{(product as any).nombre || product.name}</div>
                  <div className="text-xs text-gray-500">{product.sku || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.categoria?.nombre || 'N/A'} 
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                  {product.atributos.map(attr => (
                    <div key={attr.id}>
                      <span className="font-semibold">{attr.key}:</span> {attr.value}
                    </div>
                  ))}
                  {product.atributos.length === 0 && <span className="text-gray-400">Sin atributos</span>}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span 
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      ((product as any).stock_actual ?? product.stock) > (product.min_stock || 10) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {(product as any).stock_actual ?? product.stock}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {product.precio}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                  
                  {/* --- BOTÓN DE EDITAR (CONECTADO) --- */}
                  <button 
                    onClick={() => handleOpenEditModal(product)}
                    className="text-[#FF9800] hover:text-[#FB8C00]"
                  >
                    Editar
                  </button>
                  
                  <button 
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>

                  <button
                    onClick={() => handleAddToCart(product.id)}
                    className="text-[#00BCD4] hover:text-[#0097A7]"
                  >
                    Añadir al carrito
                  </button>

                  <button
                    onClick={() => handleQuickPrice(product)}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    Actualizar precio
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {products.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay productos disponibles.</p>
        </div>
      )}

      {/* Renderiza el Modal (Funciona para 'Crear' y 'Editar') */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        productToEdit={productToEdit}
      />
    </div>
  );
}