import api from './api';
import { Notification } from '../types';

export interface NotificationsResponse {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
}

export async function getNotifications(params?: {
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}) {
  const response = await api.get<NotificationsResponse>('/notifications', {
    params,
  });
  return response.data;
}

export async function markNotificationAsRead(id: string): Promise<Notification> {
  const response = await api.patch<Notification>(`/notifications/${id}/read`);
  return response.data;
}
