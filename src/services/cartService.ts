// src/services/cartService.ts

import apiClient from './apiClient';

export interface CartItem {
  id: number;
  product: { id: number; name?: string; nombre?: string; sku: string; image?: string; price?: string };
  quantity: number;
  price: string;
}

export interface CartResp {
  id: number;
  items: CartItem[];
  total: string;
}

export const getCart = async (): Promise<CartResp> => {
  const res = await apiClient.get<CartResp>('/carrito/');
  return res.data;
};

export const addToCart = async (productId: number, quantity = 1): Promise<CartResp> => {
  const res = await apiClient.post<CartResp>('/carrito/add_item/', { product: productId, quantity });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cart-updated'));
  }
  return res.data;
};

export const removeFromCart = async (productId: number): Promise<CartResp> => {
  const res = await apiClient.post<CartResp>('/carrito/remove_item/', { product: productId });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cart-updated'));
  }
  return res.data;
};

export const checkout = async (shipping_address: string): Promise<any> => {
  const res = await apiClient.post('/checkout/', { shipping_address, shipping_method: 'STANDARD' });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cart-updated'));
  }
  return res.data;
};

export const pay = async (order_id: number, method: 'PAYPAL' | 'STRIPE' | 'CASH' = 'CASH'): Promise<any> => {
  const res = await apiClient.post('/pago/', { order_id, method });
  return res.data;
};
