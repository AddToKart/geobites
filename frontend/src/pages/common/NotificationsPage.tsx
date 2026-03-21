import { useEffect, useState } from 'react';
import { BellRing, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
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

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Updates"
        title="Notifications"
        description="Unread items stay obvious, read ones fade back, and you can clear the noise with one tap."
      />

      <section className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary-dark)]">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-[color:var(--color-text-soft)]">Total notifications</p>
              <p className="text-2xl font-semibold">{notifications.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary-dark)]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-[color:var(--color-text-soft)]">Unread</p>
              <p className="text-2xl font-semibold">{unreadCount}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="space-y-4 p-5">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={
                notification.isRead
                  ? 'panel-muted flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between'
                  : 'rounded-[22px] border border-[rgba(235,106,45,0.16)] bg-[color:var(--color-primary-soft)] px-4 py-4'
              }
            >
              <div className="space-y-1">
                <p className="font-semibold text-[color:var(--color-text)]">{notification.title}</p>
                <p className="text-sm text-[color:var(--color-text-soft)]">{notification.message}</p>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  {formatDate(notification.createdAt)}
                </p>
              </div>
              {!notification.isRead ? (
                <Button size="sm" variant="ghost" onClick={() => void markAsRead(notification.id)}>
                  Mark as read
                </Button>
              ) : null}
            </div>
          ))}

          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-lg font-semibold">No notifications yet</p>
              <p className="mt-2 subtle-copy">Order, delivery, and account updates will appear here.</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
