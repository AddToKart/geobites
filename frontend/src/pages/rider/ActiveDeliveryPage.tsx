import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock3, MapPin, PackageCheck, Sparkles } from 'lucide-react';
import { OrderRouteMap } from '@/components/maps/OrderRouteMap';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useRiderLocationTracking } from '@/hooks/useRiderLocationTracking';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/status-badge';
import { getOrder } from '../../services/orderService';
import { updateDeliveryStatus } from '../../services/riderService';
import { Order } from '../../types';
import { ORDER_STATUS_LABELS } from '@/utils/constants';
import { formatCurrency } from '@/utils/helpers';

const transitions: Record<string, Array<'picked_up' | 'delivering' | 'delivered'>> = {
  ready_for_pickup: ['picked_up'],
  picked_up: ['delivering'],
  delivering: ['delivered'],
};

const riderTimeline = ['ready_for_pickup', 'picked_up', 'delivering', 'delivered'];

export function ActiveDeliveryPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) {
        return;
      }
      try {
        const response = await getOrder(id);
        setOrder(response);
        setError(null);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load delivery');
      }
    };

    void loadOrder();

    const intervalId = window.setInterval(() => {
      void loadOrder();
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [id]);

  const liveCoords = useRiderLocationTracking({
    orderId: order?.id,
    enabled: Boolean(order && ['ready_for_pickup', 'picked_up', 'delivering'].includes(order.status)),
  });

  const changeStatus = async (status: 'picked_up' | 'delivering' | 'delivered') => {
    if (!order) {
      return;
    }

    try {
      const updated = await updateDeliveryStatus(order.id, status);
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
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to update delivery');
    }
  };

  if (!order) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-[color:var(--color-danger)]">
          {error ?? 'Loading delivery...'}
        </CardContent>
      </Card>
    );
  }

  const actions = transitions[order.status] ?? [];
  const mappedOrder = {
    ...order,
    riderLat: liveCoords?.lat ?? order.riderLat,
    riderLng: liveCoords?.lng ?? order.riderLng,
  };

  const nextActionMessage = useMemo(() => {
    switch (order.status) {
      case 'ready_for_pickup':
        return 'Head to the shop, confirm the package, then mark it picked up.';
      case 'picked_up':
        return 'Leave the shop and switch the run into delivering when you are moving.';
      case 'delivering':
        return 'Stay on route and complete the drop-off once the customer receives the order.';
      case 'delivered':
        return 'This delivery is complete. Return to the dashboard for the next run.';
      default:
        return 'Wait for the next valid rider step.';
    }
  }, [order.status]);

  const currentTimelineIndex = riderTimeline.indexOf(order.status);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Rider"
        title={`Delivery #${order.id.slice(0, 8)}`}
        description="The route stays large on the left, while the right rail now carries actions, checkpoints, and drop-off details instead of empty space."
        actions={<StatusBadge status={order.status} />}
      />

      {error ? (
        <Card>
          <CardContent className="p-5 text-sm text-[color:var(--color-danger)]">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <OrderRouteMap
            order={mappedOrder}
            title="Active route"
            description="This route updates with your location while the delivery is in progress."
          />

          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold">Delivery summary</h2>
                  <p className="subtle-copy">
                    Key order facts stay visible under the map instead of leaving that space empty.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="panel-muted px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                    Order value
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[color:var(--color-text)]">
                    {formatCurrency(order.totalAmount)}
                  </p>
                </div>
                <div className="panel-muted px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                    Items
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[color:var(--color-text)]">
                    {order.items.length} items
                  </p>
                </div>
                <div className="panel-muted px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                    Current status
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[color:var(--color-text)]">
                    {ORDER_STATUS_LABELS[order.status]}
                  </p>
                </div>
              </div>

              <div className="panel-muted flex items-start gap-3 px-4 py-4 text-sm text-[color:var(--color-text-soft)]">
                <MapPin className="mt-0.5 h-4 w-4 text-[color:var(--color-primary-dark)]" />
                <span>{order.deliveryAddress}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <h2 className="text-2xl font-semibold">Next action</h2>
                <p className="mt-2 subtle-copy">{nextActionMessage}</p>
              </div>

              {actions.map((action) => (
                <Button key={action} className="w-full" onClick={() => void changeStatus(action)}>
                  {ORDER_STATUS_LABELS[action]}
                </Button>
              ))}

              {actions.length === 0 ? (
                <p className="text-sm text-[color:var(--color-text-soft)]">No further rider actions right now.</p>
              ) : null}

              <Button variant="ghost" className="w-full" asChild>
                <Link to="/rider">Back to dashboard</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="eyebrow">Checkpoint timeline</p>
                <h2 className="mt-2 text-2xl font-semibold">Delivery progress</h2>
              </div>

              <div className="space-y-3">
                {riderTimeline.map((status, index) => {
                  const active = currentTimelineIndex >= index;
                  const current = order.status === status;

                  return (
                    <div
                      key={status}
                      className={
                        active
                          ? 'rounded-[20px] border border-[rgba(235,106,45,0.18)] bg-[color:var(--color-primary-soft)] px-4 py-4'
                          : 'panel-muted px-4 py-4'
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[color:var(--color-text)]">
                            {ORDER_STATUS_LABELS[status]}
                          </p>
                          <p className="mt-1 text-sm text-[color:var(--color-text-soft)]">
                            {current ? 'Current rider step' : active ? 'Completed' : 'Waiting'}
                          </p>
                        </div>
                        <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-[color:var(--color-text-soft)]">
                          Step {index + 1}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-4 w-4 text-[color:var(--color-primary-dark)]" />
                <p className="text-sm text-[color:var(--color-text-soft)]">
                  {order.notes || 'No customer notes were added to this delivery.'}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <PackageCheck className="mt-0.5 h-4 w-4 text-[color:var(--color-primary-dark)]" />
                <p className="text-sm text-[color:var(--color-text-soft)]">
                  {order.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 text-[color:var(--color-primary-dark)]" />
                <p className="text-sm text-[color:var(--color-text-soft)]">
                  This side rail now carries the control flow and delivery context instead of a thin button stack.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
