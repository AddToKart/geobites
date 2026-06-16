import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, CheckCircle2, Filter, Sparkles } from 'lucide-react';
import { getNotifications, markNotificationAsRead } from '../../services/notificationService';
import { Notification } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/helpers';
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal';

type NotificationFilter = 'all' | 'unread' | 'read' | Notification['type'];

const notificationTypeLabels: Record<Notification['type'], string> = {
  order_update: 'Order updates',
  delivery_request: 'Delivery requests',
  rating: 'Ratings',
  system: 'System',
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
    window.dispatchEvent(new CustomEvent('notification-status-changed'));
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
    window.dispatchEvent(new CustomEvent('notification-status-changed'));
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
      await loadNotifications();
      window.dispatchEvent(new CustomEvent('notification-status-changed'));
    }

    const role = user?.role;
    const refId = notification.referenceId;

    if (notification.type === 'order_update' && refId) {
      if (role === 'customer') {
        navigate(`/orders/${refId}`);
        return;
      }
      if (role === 'seller') {
        navigate('/seller/orders');
        return;
      }
      if (role === 'rider') {
        navigate('/rider');
        return;
      }
    }

    if (notification.type === 'delivery_request' && refId) {
      navigate('/rider');
      return;
    }

    if (notification.type === 'rating') {
      if (role === 'seller') {
        navigate('/seller/ratings');
        return;
      }
      if (role === 'customer' && refId) {
        navigate(`/orders/${refId}`);
        return;
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        <Reveal>
          <div className="border-b-2 border-foreground pb-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Updates</p>
              <h1 className="text-6xl font-medium tracking-tighter">Notifications.</h1>
              <p className="text-xl text-muted-foreground mt-4 max-w-xl">
                Stay updated on orders, deliveries, and account activity.
              </p>
            </div>
            {visibleUnread.length > 0 && (
              <button 
                onClick={() => void markVisibleAsRead()}
                className="text-xs font-bold uppercase tracking-widest text-primary hover:text-foreground transition-colors border border-primary px-4 py-2 hover:bg-primary hover:text-primary-foreground"
              >
                Mark visible as read
              </button>
            )}
          </div>
        </Reveal>

        <section className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 mb-16">
          <div className="border border-border p-8 bg-background flex flex-col justify-between min-h-[200px]">
            <div className="flex items-center justify-between mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total</span>
              <BellRing className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-5xl font-medium tracking-tighter">{notifications.length}</p>
          </div>
          <div className="border border-border p-8 bg-background flex flex-col justify-between min-h-[200px]">
            <div className="flex items-center justify-between mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Unread</span>
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <p className="text-5xl font-medium tracking-tighter text-primary">{unreadCount}</p>
          </div>
          <div className="border border-border p-8 bg-background flex flex-col justify-between min-h-[200px]">
            <div className="flex items-center justify-between mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Filter</span>
              <Filter className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-medium tracking-tighter capitalize truncate">
              {filter === 'order_update' || filter === 'delivery_request' ? filter.replace('_', ' ') : filter}
            </p>
          </div>
          <div className="border border-border p-8 bg-background flex flex-col justify-between min-h-[200px]">
            <div className="flex items-center justify-between mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Visible</span>
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-5xl font-medium tracking-tighter">{filteredNotifications.length}</p>
          </div>
        </section>

        <section className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-12">
            <Reveal>
              <div className="border border-border p-8 bg-background">
                <div className="mb-8 flex flex-col gap-6">
                  <h2 className="text-3xl font-medium tracking-tighter">Inbox</h2>
                  <div className="flex flex-wrap gap-3">
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
                        onClick={() => setFilter(option.key)}
                        className={`border px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                          filter === option.key
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/10'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>

            {filteredNotifications.length === 0 ? (
              <div className="border border-border p-12 text-center bg-secondary/5 min-h-[300px] flex flex-col items-center justify-center">
                <p className="text-3xl font-medium tracking-tighter mb-2">No notifications here</p>
                <p className="text-lg text-muted-foreground mb-8">
                  Adjust the filter or wait for new order, delivery, or account updates.
                </p>
                {filter !== 'all' && (
                  <button
                    className="border border-border px-6 py-3 font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors text-sm"
                    onClick={() => setFilter('all')}
                  >
                    Show all notifications
                  </button>
                )}
              </div>
            ) : (
              <Stagger className="space-y-4" delayChildren={0.05} stagger={0.05}>
                {filteredNotifications.map((notification) => (
                    <StaggerItem key={notification.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => void handleNotificationClick(notification)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') void handleNotificationClick(notification); }}
                      className={`flex flex-col md:flex-row md:items-start justify-between gap-6 p-8 border transition-colors cursor-pointer ${
                        notification.isRead
                          ? 'border-border bg-background hover:bg-secondary/5'
                          : 'border-primary/50 bg-primary/5 hover:bg-primary/10'
                      }`}
                    >
                      <div className="space-y-4 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`text-xs font-bold uppercase tracking-widest border px-3 py-1 ${
                            notification.isRead 
                              ? 'border-border text-muted-foreground' 
                              : 'border-primary text-primary bg-primary/10'
                          }`}>
                            {notificationTypeLabels[notification.type]}
                          </span>
                          <span className="text-xs font-bold text-muted-foreground tracking-widest">
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                        
                        <div>
                          <p className={`text-2xl font-medium tracking-tighter mb-2 ${
                            notification.isRead ? 'text-foreground' : 'text-primary'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                      
                      {!notification.isRead && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); void markAsRead(notification.id); }}
                          className="shrink-0 border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors md:self-center"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </div>

          <div className="space-y-8 xl:sticky xl:top-12 xl:self-start">
            <Reveal>
              <div className="border border-border p-8 bg-background">
                <h2 className="text-2xl font-medium tracking-tighter mb-8 border-b border-border pb-4">Activity</h2>
                <div className="space-y-6">
                  {Object.entries(notificationTypeLabels).map(([type, label]) => (
                    <div key={type} className="flex justify-between items-center pb-4 border-b border-border/50 last:border-0 last:pb-0">
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
                      <span className="text-2xl font-medium tracking-tighter">
                        {notifications.filter((notification) => notification.type === type).length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

          </div>
        </section>
      </div>
    </div>
  );
}
