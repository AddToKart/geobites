import api from './api';

export interface SavedAddress {
  id: string;
  userId: string;
  label: string;
  street?: string;
  barangay?: string;
  landmark?: string;
  floorOrGate?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressPayload {
  label: string;
  street?: string;
  barangay?: string;
  landmark?: string;
  floorOrGate?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  isDefault?: boolean;
}

export type UpdateAddressPayload = Partial<CreateAddressPayload>;

export async function getAddresses(): Promise<SavedAddress[]> {
  const response = await api.get<SavedAddress[]>('/addresses');
  return response.data;
}

export async function getAddress(id: string): Promise<SavedAddress> {
  const response = await api.get<SavedAddress>(`/addresses/${id}`);
  return response.data;
}

export async function createAddress(payload: CreateAddressPayload): Promise<SavedAddress> {
  const response = await api.post<SavedAddress>('/addresses', payload);
  return response.data;
}

export async function updateAddress(id: string, payload: UpdateAddressPayload): Promise<SavedAddress> {
  const response = await api.patch<SavedAddress>(`/addresses/${id}`, payload);
  return response.data;
}

export async function deleteAddress(id: string): Promise<void> {
  await api.delete(`/addresses/${id}`);
}
