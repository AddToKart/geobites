import api from './api';
import { Rating } from '../types';

export interface VendorRatingsResponse {
  averageScore: number;
  totalRatings: number;
  ratings: Rating[];
}

export async function submitRating(payload: {
  orderId: string;
  score: number;
  feedback?: string;
}) {
  const response = await api.post('/ratings', payload);
  return response.data;
}

export async function getVendorRatings(
  vendorId: string,
): Promise<VendorRatingsResponse> {
  const response = await api.get<VendorRatingsResponse>(`/vendors/${vendorId}/ratings`);
  return response.data;
}
