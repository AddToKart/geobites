import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { OrderRouteMap } from '@/components/maps/OrderRouteMap';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useRiderLocationTracking } from '@/hooks/useRiderLocationTracking';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/status-badge';
import { getOrder } from '../../services/orderService';
import { updateDeliveryStatus } from '../../services/riderService';
import { Order } from '../../types';

const transitions: Record<string, Array<'picked_up' | 'delivering' | 'delivered'>> = {
  ready_for_pickup: ['picked_up'],
  picked_up: ['delivering'],
  delivering: ['delivered'],
};

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
    enabled: Boolean(
      order &&
        ['ready_for_pickup', 'picked_up', 'delivering'].includes(order.status),
    ),
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

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Rider"
        title={`Delivery #${order.id.slice(0, 8)}`}
        description="Keep the current delivery moving with one clear status update at a time."
        actions={<StatusBadge status={order.status} />}
      />

      {error ? (
        <Card>
          <CardContent className="p-5 text-sm text-[color:var(--color-danger)]">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <OrderRouteMap
            order={mappedOrder}
            title="Active route"
            description="This route updates with your location while the delivery is in progress."
          />

          <Card>
          <CardContent className="space-y-4 p-5">
            <h2 className="text-2xl font-semibold">Drop-off details</h2>
            <div className="panel-muted flex items-start gap-3 px-4 py-4 text-sm text-[color:var(--color-text-soft)]">
              <MapPin className="mt-0.5 h-4 w-4 text-[color:var(--color-primary-dark)]" />
              <span>{order.deliveryAddress}</span>
            </div>
          </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="space-y-4 p-5">
            <h2 className="text-2xl font-semibold">Next action</h2>
            {actions.map((action) => (
              <Button key={action} className="w-full" onClick={() => void changeStatus(action)}>
                {action.replace('_', ' ')}
              </Button>
            ))}
            {actions.length === 0 ? (
              <p className="text-sm text-[color:var(--color-text-soft)]">No further actions.</p>
            ) : null}
            <Button variant="ghost" className="w-full" asChild>
              <Link to="/rider">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
