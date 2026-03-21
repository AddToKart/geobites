import api from './api';
import { Order } from '../types';

export async function getDeliveries(type: 'available' | 'active' = 'available') {
  const response = await api.get<Order[]>('/riders/deliveries', {
    params: { type },
  });
  return response.data;
}

export async function acceptDelivery(orderId: string): Promise<Order> {
  const response = await api.patch<Order>(`/riders/deliveries/${orderId}/accept`);
  return response.data;
}

export async function updateDeliveryStatus(
  orderId: string,
  status: 'picked_up' | 'delivering' | 'delivered',
): Promise<Order> {
  const response = await api.patch<Order>(`/riders/deliveries/${orderId}/status`, {
    status,
  });
  return response.data;
}

export async function updateDeliveryLocation(
  orderId: string,
  payload: { riderLat: number; riderLng: number },
): Promise<Order> {
  const response = await api.patch<Order>(
    `/riders/deliveries/${orderId}/location`,
    payload,
  );
  return response.data;
}
