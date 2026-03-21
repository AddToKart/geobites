import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, PackageCheck, ShoppingBag } from 'lucide-react';
import { OrderRouteMap } from '@/components/maps/OrderRouteMap';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/status-badge';
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
    const refreshOrder = async (showLoading = false) => {
      if (!id) {
        return;
      }
      if (showLoading) {
        setIsLoading(true);
      }
      try {
        const response = await getOrder(id);
        setOrder(response);
        setError(null);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load order');
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    };

    void refreshOrder(true);

    const intervalId = window.setInterval(() => {
      void refreshOrder();
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [id]);

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

      <section className="grid gap-5 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary-dark)]">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-[color:var(--color-text-soft)]">Total</p>
              <p className="text-xl font-semibold">{formatCurrency(order.totalAmount)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary-dark)]">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-[color:var(--color-text-soft)]">Items</p>
              <p className="text-xl font-semibold">{order.items.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary-dark)]">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-[color:var(--color-text-soft)]">Delivery address</p>
              <p className="line-clamp-2 text-sm font-medium">{order.deliveryAddress}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <OrderRouteMap
        order={order}
        title="Live route"
        description="This map shows the shop, your pinned drop-off point, and rider progress whenever rider coordinates are available."
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="text-2xl font-semibold">Progress</h2>
              <p className="subtle-copy">
                Each completed step stays highlighted so you can see what has already happened.
              </p>
            </div>
            <ol className="space-y-3">
              {displayTimeline.map((status, index) => {
                const active = index <= currentStep;
                const current = status === order.status;

                return (
                  <li
                    key={status}
                    className={
                      active
                        ? 'rounded-[22px] border border-[rgba(235,106,45,0.16)] bg-[color:var(--color-primary-soft)] px-4 py-4'
                        : 'rounded-[22px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-4'
                    }
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[color:var(--color-text)]">
                          {ORDER_STATUS_LABELS[status] ?? status}
                        </p>
                        <p className="mt-1 text-sm text-[color:var(--color-text-soft)]">
                          {current ? 'Current step' : active ? 'Completed' : 'Waiting'}
                        </p>
                      </div>
                      <span
                        className={
                          active
                            ? 'rounded-full bg-white px-3 py-1 text-xs font-medium text-[color:var(--color-primary-dark)]'
                            : 'rounded-full bg-white/60 px-3 py-1 text-xs font-medium text-[color:var(--color-text-soft)]'
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

        <div className="space-y-5">
          <Card>
            <CardContent className="space-y-4 p-5">
              <h2 className="text-2xl font-semibold">Order summary</h2>
              <div className="space-y-3 rounded-[20px] bg-[color:var(--color-surface-2)] p-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-[color:var(--color-text-soft)]">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-medium text-[color:var(--color-text)]">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              <h2 className="text-2xl font-semibold">Notes</h2>
              <p className="text-sm text-[color:var(--color-text-soft)]">
                {order.notes || 'No delivery notes were added to this order.'}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
