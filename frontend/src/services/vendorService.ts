import api from './api';
import { getDemoVendorById, isDemoVendorId } from '../data/demoVendors';
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

export async function getVendors(query?: VendorQuery): Promise<VendorListResponse> {
  const response = await api.get<VendorListResponse>('/vendors', {
    params: query,
  });
  return response.data;
}

export async function getVendorById(id: string): Promise<Vendor> {
  if (isDemoVendorId(id)) {
    const demoVendor = getDemoVendorById(id);

    if (!demoVendor) {
      throw new Error('Vendor not found');
    }

    return demoVendor;
  }

  const response = await api.get<Vendor>(`/vendors/${id}`);
  return response.data;
}

export async function createVendor(payload: Partial<Vendor>): Promise<Vendor> {
  const response = await api.post<Vendor>('/vendors', payload);
  return response.data;
}

export async function updateVendor(id: string, payload: Partial<Vendor>): Promise<Vendor> {
  const response = await api.put<Vendor>(`/vendors/${id}`, payload);
  return response.data;
}

export async function deleteVendor(id: string): Promise<void> {
  await api.delete(`/vendors/${id}`);
}
