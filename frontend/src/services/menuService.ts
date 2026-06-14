import api from './api';
import { getDemoVendorMenu, isDemoVendorId, demoVendors, getDemoVendorById } from '../data/demoVendors';
import { MenuItem, Vendor } from '../types';

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
  // Demo vendor search (client-side)
  const demoResults: DishSearchResult[] = [];
  if (demoVendors.length > 0) {
    const normalizedQuery = query.toLowerCase();
    for (const vendor of demoVendors) {
      const menu = getDemoVendorMenu(vendor.id);
      const matching = menu.filter(
        (item) =>
          item.isAvailable !== false &&
          (item.name.toLowerCase().includes(normalizedQuery) ||
            (item.description?.toLowerCase() || '').includes(normalizedQuery)),
      );
      if (matching.length > 0) {
        demoResults.push({
          vendor: {
            id: vendor.id,
            name: vendor.name,
            imageUrl: vendor.imageUrl,
            rating: vendor.rating,
            totalRatings: vendor.totalRatings,
          },
          items: matching,
        });
      }
    }
  }

  try {
    const params = new URLSearchParams({ q: query });
    if (filters?.category) params.set('category', filters.category);
    if (filters?.priceMin !== undefined) params.set('priceMin', String(filters.priceMin));
    if (filters?.priceMax !== undefined) params.set('priceMax', String(filters.priceMax));

    const response = await api.get<DishSearchResult[]>(`/menu/search?${params}`);
    return [...demoResults, ...response.data];
  } catch {
    return demoResults;
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

export async function deleteMenuItem(id: string): Promise<{ success: boolean }> {
  const response = await api.delete<{ success: boolean }>(`/menu/${id}`);
  return response.data;
}
