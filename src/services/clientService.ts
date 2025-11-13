// src/services/clientService.ts

import apiClient from './apiClient';

export interface ClientDTO {
  username: string;
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  role?: 'CLIENT';
  is_active?: boolean;
}

export interface Client {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_active: boolean;
}

// Listar clientes (solo lectura)
export const getClients = async (): Promise<Client[]> => {
  const res = await apiClient.get<any>('/clientes/');
  return (res.data?.results ?? res.data) as Client[];
};

// CRUD contra /usuarios/
export const createClient = async (data: ClientDTO): Promise<Client> => {
  const payload = { ...data, role: 'CLIENT' };
  const res = await apiClient.post<Client>('/usuarios/', payload);
  return res.data;
};

export const updateClient = async (id: number, data: Partial<ClientDTO>): Promise<Client> => {
  const res = await apiClient.patch<Client>(`/usuarios/${id}/`, data);
  return res.data;
};

export const deleteClient = async (id: number): Promise<void> => {
  await apiClient.delete(`/usuarios/${id}/`);
};

export const toggleClientActive = async (id: number, is_active: boolean): Promise<Client> => {
  const res = await apiClient.patch<Client>(`/usuarios/${id}/`, { is_active });
  return res.data;
};
