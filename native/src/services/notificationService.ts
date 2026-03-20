import api from './api';
import { Notification } from '../types';

export async function getNotifications(params?: {
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}) {
  const response = await api.get<{
    data: Notification[];
    total: number;
    page: number;
    limit: number;
  }>('/notifications', {
    params,
  });
  return response.data;
}

export async function markNotificationAsRead(id: string) {
  const response = await api.patch<Notification>(`/notifications/${id}/read`);
  return response.data;
}
