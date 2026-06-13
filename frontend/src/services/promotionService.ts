import { Promotion } from '@/types';
import api from './api';

export async function createPromotion(payload: {
  vendorId: string;
  name: string;
  description?: string;
  type: 'percentage' | 'free_delivery' | 'bogo';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  applicableTo?: string;
  applicableIds?: string[];
  isActive?: boolean;
  startsAt: string;
  expiresAt?: string;
  usageLimit?: number;
}): Promise<Promotion> {
  const response = await api.post<Promotion>('/promotions', payload);
  return response.data;
}

export async function getVendorPromotions(vendorId: string): Promise<Promotion[]> {
  const response = await api.get<Promotion[]>(`/vendors/${vendorId}/promotions`);
  return response.data;
}

export async function getActivePromotions(vendorId: string): Promise<Promotion[]> {
  const response = await api.get<Promotion[]>(`/vendors/${vendorId}/promotions/active`);
  return response.data;
}

export async function updatePromotion(
  id: string,
  payload: Partial<{
    name: string;
    description: string;
    type: 'percentage' | 'free_delivery' | 'bogo';
    value: number;
    minOrderAmount: number;
    maxDiscount: number;
    applicableTo: string;
    applicableIds: string[];
    isActive: boolean;
    startsAt: string;
    expiresAt: string;
    usageLimit: number;
  }>,
): Promise<Promotion> {
  const response = await api.patch<Promotion>(`/promotions/${id}`, payload);
  return response.data;
}

export async function togglePromotion(id: string): Promise<Promotion> {
  const response = await api.patch<Promotion>(`/promotions/${id}/toggle`);
  return response.data;
}

export async function deletePromotion(id: string): Promise<void> {
  await api.delete(`/promotions/${id}`);
}
