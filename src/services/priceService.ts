// src/services/priceService.ts

import apiClient from './apiClient';

export interface PriceDTO {
  price: string; // decimal string
  fecha_inicio?: string; // optional start date
}

export const addProductPrice = async (productId: number, data: PriceDTO) => {
  const res = await apiClient.post(`/productos/${productId}/add_price/`, data);
  return res.data;
};

export const updateProductPrice = async (productId: number, priceId: number, data: Partial<PriceDTO>) => {
  const res = await apiClient.patch(`/productos/${productId}/update_price/`, { price_id: priceId, ...data });
  return res.data;
};
