import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, PackageCheck, ShoppingBag } from 'lucide-react';
import { LazyOrderRouteMap } from '@/components/maps/LazyOrderRouteMap';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Reveal, Stagger } from '@/components/motion/Reveal';
import { StatusBadge } from '@/components/ui/status-badge';
import { useVisiblePolling } from '@/hooks/useVisiblePolling';
import { getOrder, updateOrderStatus } from '../../services/orderService';
import { Order } from '../../types';
import { ORDER_STATUS_LABELS } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/helpers';

const timeline: string[] = [
  'pending',
  'accepted',
  'preparing',
  'ready_for_pickup',
  'picked_up',
  'delivering',
  'delivered',
];

export function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const refreshInitialOrder = async () => {
      if (!id) {
        return;
      }

      setIsLoading(true);
      try {
        const response = await getOrder(id);
        setOrder(response);
        setError(null);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load order');
      } finally {
        setIsLoading(false);
      }
    };

    void refreshInitialOrder();
  }, [id]);

  useVisiblePolling(
    async () => {
      if (!id) {
        return;
      }

      try {
        const response = await getOrder(id);
        setOrder(response);
        setError(null);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load order');
      }
    },
    15000,
    { enabled: Boolean(id), runOnMount: false },
  );

  const cancelOrder = async () => {
    if (!order) {
      return;
    }
    setIsCancelling(true);
    try {
      const updated = await updateOrderStatus(order.id, 'cancelled');
      setOrder((current) =>
        current
          ? {
              ...current,
              ...updated,
              items: current.items,
              vendor: current.vendor,
            }
          : updated,
      );
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  const displayTimeline = useMemo(() => {
    if (!order) {
      return timeline;
    }

    if (order.status === 'cancelled' || order.status === 'rejected') {
      return ['pending', order.status];
    }

    return timeline;
  }, [order]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">Loading order...</CardContent>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-[color:var(--color-danger)]">
          {error || 'Order not found'}
        </CardContent>
      </Card>
    );
  }

  const currentStep = displayTimeline.indexOf(order.status);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Tracking"
        title={`Order #${order.id.slice(0, 8)}`}
        description={`Placed ${formatDate(order.createdAt)}. Keep this page open for the clearest view of progress and delivery details.`}
        actions={
          <>
            <StatusBadge status={order.status} />
            {order.status === 'pending' ? (
              <Button
                variant="destructive"
                onClick={() => void cancelOrder()}
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Cancel order'}
              </Button>
            ) : null}
          </>
        }
      />

      {error ? (
        <Card>
          <CardContent className="p-5 text-sm text-[color:var(--color-danger)]">
            {error}
          </CardContent>
        </Card>
      ) : null}

      <Stagger className="grid gap-6 md:grid-cols-3" delayChildren={0.04} stagger={0.06}>
        <Card className="rounded-[28px] border border-slate-100 dark:border-gray-800 shadow-[var(--shadow-card)]">
          <CardContent className="flex items-center gap-5 p-6 md:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-orange-50 text-orange-500 shrink-0">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total</p>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">{formatCurrency(order.totalAmount)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border border-slate-100 dark:border-gray-800 shadow-[var(--shadow-card)]">
          <CardContent className="flex items-center gap-5 p-6 md:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-orange-50 text-orange-500 shrink-0">
              <PackageCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Items</p>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">{order.items.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border border-slate-100 dark:border-gray-800 shadow-[var(--shadow-card)]">
          <CardContent className="flex items-center gap-5 p-6 md:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-orange-50 text-orange-500 shrink-0">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Address</p>
              <p className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{order.street} {order.barangay}</p>
            </div>
          </CardContent>
        </Card>
      </Stagger>

      <Reveal delay={0.08}>
        <LazyOrderRouteMap
          order={order}
          title="Live route"
          description="This map shows the shop, your pinned drop-off point, and rider progress whenever rider coordinates are available."
        />
      </Reveal>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
        <Reveal>
          <Card className="rounded-[32px] border border-slate-100 dark:border-gray-800 shadow-[var(--shadow-panel)]">
          <CardContent className="space-y-6 p-6 md:p-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Progress</h2>
              <p className="text-sm font-medium text-slate-500 mt-2">
                Each completed step stays highlighted.
              </p>
            </div>
            <ol className="space-y-4">
              {displayTimeline.map((status, index) => {
                const active = index <= currentStep;
                const current = status === order.status;

                return (
                  <li
                    key={status}
                    className={
                      active
                        ? 'rounded-[24px] bg-orange-500 text-white px-6 py-5 shadow-[0_8px_16px_rgba(249,115,22,0.2)] transition-all transform hover:-translate-y-1'
                        : 'rounded-[24px] border border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/50 px-6 py-5 transition-all opacity-80'
                    }
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`text-lg font-bold tracking-tight ${active ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                          {ORDER_STATUS_LABELS[status] ?? status}
                        </p>
                        <p className={`mt-1 text-[11px] font-bold uppercase tracking-widest ${active ? 'text-white/80' : 'text-slate-400'}`}>
                          {current ? 'Current step' : active ? 'Completed' : 'Waiting'}
                        </p>
                      </div>
                      <span
                        className={
                          active
                            ? 'rounded-full bg-white/20 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white backdrop-blur-md'
                            : 'rounded-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 shadow-sm'
                        }
                      >
                        Step {index + 1}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
          </Card>
        </Reveal>

        <Reveal className="space-y-6" delay={0.1}>
          <Card className="rounded-[32px] border border-slate-100 dark:border-gray-800 shadow-[var(--shadow-panel)]">
            <CardContent className="space-y-6 p-6 md:p-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Summary</h2>
              <div className="space-y-3 rounded-[24px] border border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/50 p-5">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      <span className="text-orange-500">{item.quantity}x</span> {item.name}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white tracking-tight">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border border-slate-100 dark:border-gray-800 shadow-[var(--shadow-panel)]">
            <CardContent className="space-y-4 p-6 md:p-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Notes</h2>
              <p className="text-sm font-medium leading-relaxed text-slate-500">
                {order.notes || 'No delivery notes were provided for this order.'}
              </p>
            </CardContent>
          </Card>
        </Reveal>
      </section>
    </div>
  );
}
