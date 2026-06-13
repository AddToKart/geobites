import api from './api';
import { Order, OrderStatus } from '../types';

export interface PlaceOrderPayload {
  vendorId: string;
  deliveryAddress?: string;
  street: string;
  barangay: string;
  landmark?: string;
  paymentMethod: 'COD' | 'GCASH' | 'MAYA' | 'QRPH' | 'GEOPAY';
  paymentReference?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  notes?: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
  }>;
}

export interface OrdersResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
}

export async function placeOrder(payload: PlaceOrderPayload): Promise<Order> {
  const response = await api.post<Order>('/orders', payload);
  return response.data;
}

export async function getOrders(params?: {
  status?: OrderStatus;
  page?: number;
  limit?: number;
}): Promise<OrdersResponse> {
  const response = await api.get<OrdersResponse>('/orders', {
    params,
  });
  return response.data;
}

export async function getOrder(id: string): Promise<Order> {
  const response = await api.get<Order>(`/orders/${id}`);
  return response.data;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<Order> {
  const response = await api.patch<Order>(`/orders/${id}/status`, { status });
  return response.data;
}

export async function initiatePayment(
  orderId: string,
): Promise<{ checkoutUrl: string | null; status: 'paid' | 'pending' }> {
  const response = await api.post<{ checkoutUrl: string | null; status: 'paid' | 'pending' }>(
    `/payments/${orderId}/pay`,
  );
  return response.data;
}

export async function getPaymentStatus(orderId: string): Promise<Order> {
  const response = await api.get<Order>(`/payments/${orderId}/status`);
  return response.data;
}

export async function verifyManualPayment(orderId: string): Promise<Order> {
  const response = await api.post<Order>(`/payments/${orderId}/verify-manual`);
  return response.data;
}

export interface AvailableRider {
  id: string;
  name: string;
  phone?: string;
  lat?: number;
  lng?: number;
  lastActive?: string;
  status: 'available' | 'busy';
}

export async function getAvailableRiders(): Promise<AvailableRider[]> {
  const response = await api.get<AvailableRider[]>('/orders/riders/available');
  return response.data;
}

export async function assignRider(orderId: string, riderId: string): Promise<Order> {
  const response = await api.post<Order>(`/orders/${orderId}/assign-rider`, { riderId });
  return response.data;
}
