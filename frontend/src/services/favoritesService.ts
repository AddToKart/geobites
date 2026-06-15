import api from './api';
import type { Vendor } from '@/types';

export interface Favorite {
  id: string;
  vendorId: string;
  createdAt: string;
  vendor: Vendor;
}

export async function getFavorites(): Promise<Favorite[]> {
  const { data } = await api.get('/favorites');
  return data;
}

export async function addFavorite(vendorId: string): Promise<Favorite> {
  const { data } = await api.post('/favorites', { vendorId });
  return data;
}

export async function removeFavorite(vendorId: string): Promise<void> {
  await api.delete(`/favorites/${vendorId}`);
}

export async function isFavorite(vendorId: string): Promise<boolean> {
  const { data } = await api.get(`/favorites/check/${vendorId}`);
  return data;
}
