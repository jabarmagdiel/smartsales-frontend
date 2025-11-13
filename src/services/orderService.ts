// src/services/orderService.ts

import apiClient from './apiClient';

export const getOrders = async () => {
  const res = await apiClient.get('/ventas/');
  return (res.data as any).results ?? res.data;
};

export const getOrderStatus = async (orderId: number) => {
  const res = await apiClient.get(`/ventas/${orderId}/estado/`);
  return res.data;
};

export const downloadReceipt = async (orderId: number): Promise<Blob> => {
  const res = await apiClient.get(`/ventas/${orderId}/comprobante/`, { responseType: 'blob' });
  return res.data as Blob;
};
