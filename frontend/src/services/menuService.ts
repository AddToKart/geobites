import api from './api';
import { getDemoVendorMenu, isDemoVendorId } from '../data/demoVendors';
import { MenuItem } from '../types';

export interface DishSearchResult {
  vendor: {
    id: string;
    name: string;
    imageUrl?: string;
    rating: number;
    totalRatings: number;
  };
  items: MenuItem[];
}

export async function getVendorMenu(vendorId: string): Promise<MenuItem[]> {
  if (isDemoVendorId(vendorId)) {
    return getDemoVendorMenu(vendorId);
  }

  const response = await api.get<MenuItem[]>(`/vendors/${vendorId}/menu`);
  return response.data;
}

export async function searchMenuItems(
  query: string,
  filters?: { category?: string; priceMin?: number; priceMax?: number },
): Promise<DishSearchResult[]> {
  try {
    const params = new URLSearchParams({ q: query });
    if (filters?.category) params.set('category', filters.category);
    if (filters?.priceMin !== undefined) params.set('priceMin', String(filters.priceMin));
    if (filters?.priceMax !== undefined) params.set('priceMax', String(filters.priceMax));

    const response = await api.get<DishSearchResult[]>(`/menu/search?${params}`);
    return response.data;
  } catch {
    return [];
  }
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

export async function deleteMenuItem(id: string): Promise<{ success: boolean; removed?: boolean }> {
  const response = await api.delete<{ success: boolean; removed?: boolean }>(`/menu/${id}`);
  return response.data;
}
