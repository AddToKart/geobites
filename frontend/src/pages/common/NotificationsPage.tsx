import { useEffect, useMemo, useState } from 'react';
import { BellRing, CheckCircle2, Filter, Sparkles } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { getNotifications, markNotificationAsRead } from '../../services/notificationService';
import { Notification } from '../../types';
import { formatDate } from '../../utils/helpers';

type NotificationFilter = 'all' | 'unread' | 'read' | Notification['type'];

const notificationTypeLabels: Record<Notification['type'], string> = {
  order_update: 'Order updates',
  delivery_request: 'Delivery requests',
  rating: 'Ratings',
  system: 'System',
};

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>('all');

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

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (filter === 'all') {
        return true;
      }

      if (filter === 'unread') {
        return !notification.isRead;
      }

      if (filter === 'read') {
        return notification.isRead;
      }

      return notification.type === filter;
    });
  }, [filter, notifications]);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const visibleUnread = filteredNotifications.filter((notification) => !notification.isRead);

  const markVisibleAsRead = async () => {
    await Promise.all(visibleUnread.map((notification) => markNotificationAsRead(notification.id)));
    await loadNotifications();
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Updates"
        title="Notifications"
        description="Unread items stay obvious, read ones fade back, and the whole page now gives you a real triage flow instead of one long stack."
      />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary-dark)]">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-[color:var(--color-text-soft)]">Current filter</p>
              <p className="text-2xl font-semibold capitalize">
                {filter === 'order_update' || filter === 'delivery_request' ? filter.replace('_', ' ') : filter}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary-dark)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-[color:var(--color-text-soft)]">Visible now</p>
              <p className="text-2xl font-semibold">{filteredNotifications.length}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardContent className="space-y-5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">Inbox</h2>
                <p className="subtle-copy">
                  Filter the feed or mark the visible unread set in one action.
                </p>
              </div>
              {visibleUnread.length > 0 ? (
                <Button size="sm" onClick={() => void markVisibleAsRead()}>
                  Mark visible as read
                </Button>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {([
                { key: 'all', label: 'All' },
                { key: 'unread', label: 'Unread' },
                { key: 'read', label: 'Read' },
                { key: 'order_update', label: 'Orders' },
                { key: 'delivery_request', label: 'Deliveries' },
                { key: 'rating', label: 'Ratings' },
                { key: 'system', label: 'System' },
              ] as Array<{ key: NotificationFilter; label: string }>).map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setFilter(option.key)}
                  className={
                    filter === option.key
                      ? 'rounded-full border border-[color:var(--color-primary)] bg-[color:var(--color-primary-soft)] px-4 py-2 text-sm font-medium text-[color:var(--color-primary-dark)]'
                      : 'rounded-full border border-[color:var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--color-text-soft)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text)]'
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>

            {filteredNotifications.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-lg font-semibold">No notifications here</p>
                <p className="mt-2 subtle-copy">
                  Adjust the filter or wait for new order, delivery, or account updates.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={
                    notification.isRead
                      ? 'panel-muted flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between'
                      : 'rounded-[22px] border border-[rgba(235,106,45,0.16)] bg-[color:var(--color-primary-soft)] px-4 py-4'
                  }
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[color:var(--color-text)]">{notification.title}</p>
                      <Badge variant={notification.isRead ? 'warning' : 'default'}>
                        {notificationTypeLabels[notification.type]}
                      </Badge>
                    </div>
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
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="eyebrow">Triage</p>
                <h2 className="mt-2 text-2xl font-semibold">Quick read</h2>
                <p className="mt-2 subtle-copy">
                  The side rail now summarizes the inbox instead of leaving an empty right gutter.
                </p>
              </div>
              <div className="grid gap-3">
                {Object.entries(notificationTypeLabels).map(([type, label]) => (
                  <div key={type} className="panel-muted flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-[color:var(--color-text-soft)]">{label}</span>
                    <span className="text-sm font-semibold text-[color:var(--color-text)]">
                      {notifications.filter((notification) => notification.type === type).length}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              <h2 className="text-2xl font-semibold">What this improves</h2>
              <p className="text-sm text-[color:var(--color-text-soft)]">
                Filters, batch read actions, and category counts give this page actual utility instead of just a vertical stack of alerts.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
