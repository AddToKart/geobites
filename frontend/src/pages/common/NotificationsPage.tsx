import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import {
  getNotifications,
  markNotificationAsRead,
} from '../../services/notificationService';
import { Notification } from '../../types';
import { formatDate } from '../../utils/helpers';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = async () => {
    const response = await getNotifications({ page: 1, limit: 50 });
    setNotifications(response.data);
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    await loadNotifications();
  };

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold text-[var(--color-text)]">Notifications</h1>
      <Card className="space-y-2">
        {notifications.map((notification) => (
          <button
            key={notification.id}
            type="button"
            className={`w-full rounded-xl border p-3 text-left ${
              notification.isRead
                ? 'border-[var(--color-border)] bg-[var(--color-surface)]'
                : 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
            }`}
            onClick={() => void markAsRead(notification.id)}
          >
            <p className="font-medium text-[var(--color-text)]">{notification.title}</p>
            <p className="text-sm text-[var(--color-text-soft)]">{notification.message}</p>
            <p className="mt-1 text-xs text-[var(--color-text-soft)]">
              {formatDate(notification.createdAt)}
            </p>
          </button>
        ))}
        {notifications.length === 0 && (
          <p className="text-sm text-[var(--color-text-soft)]">No notifications yet.</p>
        )}
      </Card>
    </section>
  );
}
