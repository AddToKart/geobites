import api from './api';
import { getDemoVendorMenu, isDemoVendorId } from '../data/demoVendors';
import { MenuItem } from '../types';

export async function getVendorMenu(vendorId: string): Promise<MenuItem[]> {
  if (isDemoVendorId(vendorId)) {
    return getDemoVendorMenu(vendorId);
  }

  const response = await api.get<MenuItem[]>(`/vendors/${vendorId}/menu`);
  return response.data;
}

export async function createMenuItem(payload: Partial<MenuItem>): Promise<MenuItem> {
  const response = await api.post<MenuItem>('/menu', payload);
  return response.data;
}

export async function updateMenuItem(
  id: string,
  payload: Partial<MenuItem>,
): Promise<MenuItem> {
  const response = await api.put<MenuItem>(`/menu/${id}`, payload);
  return response.data;
}

export async function deleteMenuItem(id: string): Promise<{ success: boolean }> {
  const response = await api.delete<{ success: boolean }>(`/menu/${id}`);
  return response.data;
}
