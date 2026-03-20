import api from './api';
import { Order, OrderStatus } from '../types';

export interface PlaceOrderPayload {
  vendorId: string;
  deliveryAddress: string;
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
