// src/services/productService.ts

import axios from 'axios';
import { getAccessToken } from './authService';
import apiClient from './apiClient';


// 1. --- Interfaces Corregidas (name, stock, etc.) ---
export interface IAttribute {
  id: number;
  key: string; 
  value: string;
}

export interface ICategory {
  id: number;
  nombre: string; // El modelo Categoria sí usa 'nombre'
}

export interface IProduct {
  id: number;
  name: string; // <-- CORREGIDO (El modelo Producto usa 'name')
  categoria: ICategory;
  precio: string;
  stock: number; // <-- CORREGIDO (El modelo Producto usa 'stock')
  min_stock: number;
  warranty_months: number; // Tiempo de garantía en meses
  atributos: IAttribute[];
  sku: string;
  description: string;
  image?: string | null;
}

// DTO (Objeto de Transferencia de Datos) para Crear/Editar
export type IProductDTO = Omit<IProduct, 'id' | 'atributos' | 'categoria'> & {
  categoria_id: number;
  meses_garantia?: number; // Campo para enviar al backend
};

// Interfaz para la respuesta paginada de Django
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// 2. --- Configuración de Axios (Interceptor) ---
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
});

// Interceptor que añade el token JWT (Soluciona el 403)
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Funciones del CRUD (Ciclo 1) ---

export const getProducts = async (): Promise<IProduct[]> => {
  try {
    const response = await apiClient.get<PaginatedResponse<IProduct>>('/productos/');
    return response.data.results; 
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error('Failed to fetch products');
  }
};

export const getCategories = async (): Promise<ICategory[]> => {
  try {
    const response = await apiClient.get<PaginatedResponse<ICategory>>('/categorias/');
    return response.data.results || (response.data as any); // Maneja paginado o no
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error('Failed to fetch categories');
  }
};

export const createProduct = async (productData: IProductDTO, imageFile?: File): Promise<IProduct> => {
  try {
    const fd = new FormData();
    fd.append('nombre', productData.name);
    fd.append('categoria_id', String(productData.categoria_id));
    fd.append('precio', productData.precio);
    fd.append('stock_actual', String(productData.stock));
    fd.append('min_stock', String(productData.min_stock));
    fd.append('meses_garantia', String(productData.meses_garantia || productData.warranty_months || 12));
    if (productData.sku) fd.append('sku', productData.sku);
    if (productData.description) fd.append('description', productData.description);
    if (imageFile) fd.append('image', imageFile);
    const response = await api.post<IProduct>('/productos/', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error creating product:", error.response?.data || error.message);
    throw new Error('Failed to create product. Check fields.');
  }
};

export const updateProduct = async (id: number, productData: Partial<IProductDTO>, imageFile?: File): Promise<IProduct> => {
  try {
    const fd = new FormData();
    if (productData.name !== undefined) fd.append('nombre', productData.name);
    if (productData.categoria_id !== undefined) fd.append('categoria_id', String(productData.categoria_id));
    if (productData.precio !== undefined) fd.append('precio', productData.precio);
    if (productData.stock !== undefined) fd.append('stock_actual', String(productData.stock));
    if (productData.min_stock !== undefined) fd.append('min_stock', String(productData.min_stock));
    if (productData.meses_garantia !== undefined || productData.warranty_months !== undefined) {
      fd.append('meses_garantia', String(productData.meses_garantia || productData.warranty_months || 12));
    }
    if (productData.sku !== undefined) fd.append('sku', productData.sku);
    if (productData.description !== undefined) fd.append('description', productData.description);
    // Nota: la imagen se añade desde el componente si existe: fd.append('image', file)
    const response = await api.patch<IProduct>(`/productos/${id}/`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error updating product:", error.response?.data || error.message);
    throw new Error('Failed to update product');
  }
};

export const deleteProduct = async (id: number): Promise<void> => {
  try {
    await api.delete(`/productos/${id}/`);
  } catch (error) {
    console.error("Error deleting product:", error);
    throw new Error('Failed to delete product');
  }
};