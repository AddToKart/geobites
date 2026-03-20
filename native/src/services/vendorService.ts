import api from './api';
import { Vendor } from '../types';

export interface VendorListResponse {
  data: Vendor[];
  total: number;
  page: number;
  limit: number;
}

export interface VendorQuery {
  search?: string;
  sortBy?: 'rating' | 'distance' | 'name';
  lat?: number;
  lng?: number;
  page?: number;
  limit?: number;
}

export async function getVendors(
  params?: VendorQuery,
): Promise<VendorListResponse> {
  const response = await api.get<VendorListResponse>('/vendors', { params });
  return response.data;
}

export async function getVendorById(id: string): Promise<Vendor> {
  const response = await api.get<Vendor>(`/vendors/${id}`);
  return response.data;
}

export async function createVendor(payload: Partial<Vendor>): Promise<Vendor> {
  const response = await api.post<Vendor>('/vendors', payload);
  return response.data;
}

export async function updateVendor(
  id: string,
  payload: Partial<Vendor>,
): Promise<Vendor> {
  const response = await api.put<Vendor>(`/vendors/${id}`, payload);
  return response.data;
}
