import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bike, Clock3, MapPin } from 'lucide-react';
import { OrderRouteMap } from '@/components/maps/OrderRouteMap';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useRiderLocationTracking } from '@/hooks/useRiderLocationTracking';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/status-badge';
import { acceptDelivery, getDeliveries } from '../../services/riderService';
import { Order } from '../../types';

export function RiderDashboard() {
  const [available, setAvailable] = useState<Order[]>([]);
  const [active, setActive] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [availableOrders, activeOrders] = await Promise.all([
        getDeliveries('available'),
        getDeliveries('active'),
      ]);
      setAvailable(availableOrders);
      setActive(activeOrders);
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load deliveries');
    }
  };

  useEffect(() => {
    void loadData();

    const intervalId = window.setInterval(() => {
      void loadData();
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const nextSelectedOrder =
      active[0]?.id ??
      available[0]?.id ??
      null;

    if (!selectedOrderId || ![...active, ...available].some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(nextSelectedOrder);
    }
  }, [active, available, selectedOrderId]);

  const focusedOrder = useMemo(
    () => [...active, ...available].find((order) => order.id === selectedOrderId) ?? active[0] ?? available[0] ?? null,
    [active, available, selectedOrderId],
  );

  const liveCoords = useRiderLocationTracking({
    orderId: focusedOrder?.id,
    enabled: Boolean(
      focusedOrder &&
        focusedOrder.riderId &&
        ['ready_for_pickup', 'picked_up', 'delivering'].includes(focusedOrder.status),
    ),
  });

  const mappedOrder = focusedOrder
    ? {
        ...focusedOrder,
        riderLat: liveCoords?.lat ?? focusedOrder.riderLat,
        riderLng: liveCoords?.lng ?? focusedOrder.riderLng,
      }
    : null;

  const accept = async (orderId: string) => {
    try {
      await acceptDelivery(orderId);
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to accept delivery');
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Rider"
        title="Delivery dashboard"
        description="Available runs and active deliveries sit on the same screen so you can claim the next job without extra noise."
      />

      {error ? (
        <Card>
          <CardContent className="p-5 text-sm text-[color:var(--color-danger)]">{error}</CardContent>
        </Card>
      ) : null}

      <section className="grid gap-5 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[color:var(--color-text-soft)]">Available</p>
            <p className="mt-2 text-3xl font-semibold">{available.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[color:var(--color-text-soft)]">Active</p>
            <p className="mt-2 text-3xl font-semibold">{active.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[color:var(--color-text-soft)]">Focus</p>
            <p className="mt-2 text-lg font-semibold">Keep status moving</p>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <h2 className="text-2xl font-semibold">Available deliveries</h2>
                <p className="subtle-copy">Claim the next run from this list.</p>
              </div>
              {available.map((order) => (
                <div
                  key={order.id}
                  className={
                    order.id === selectedOrderId
                      ? 'flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-[rgba(235,106,45,0.16)] bg-[color:var(--color-primary-soft)] px-4 py-4'
                      : 'panel-muted flex flex-wrap items-center justify-between gap-4 px-4 py-4'
                  }
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <div className="space-y-2">
                    <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                    <div className="flex items-start gap-2 text-sm text-[color:var(--color-text-soft)]">
                      <MapPin className="mt-0.5 h-4 w-4 text-[color:var(--color-primary-dark)]" />
                      <span>{order.deliveryAddress}</span>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => void accept(order.id)}>
                    <Bike className="h-4 w-4" />
                    Accept
                  </Button>
                </div>
              ))}
              {available.length === 0 ? (
                <p className="text-sm text-[color:var(--color-text-soft)]">No available deliveries.</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <h2 className="text-2xl font-semibold">My active deliveries</h2>
                <p className="subtle-copy">Keep the current run moving and update status as you go.</p>
              </div>
              {active.map((order) => (
                <div
                  key={order.id}
                  className={
                    order.id === selectedOrderId
                      ? 'space-y-3 rounded-[22px] border border-[rgba(235,106,45,0.16)] bg-[color:var(--color-primary-soft)] px-4 py-4'
                      : 'panel-muted space-y-3 px-4 py-4'
                  }
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex items-start gap-2 text-sm text-[color:var(--color-text-soft)]">
                    <Clock3 className="mt-0.5 h-4 w-4 text-[color:var(--color-primary-dark)]" />
                    <span>{order.deliveryAddress}</span>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/rider/delivery/${order.id}`}>Open delivery detail</Link>
                  </Button>
                </div>
              ))}
              {active.length === 0 ? (
                <p className="text-sm text-[color:var(--color-text-soft)]">No active deliveries.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {mappedOrder ? (
          <OrderRouteMap
            order={mappedOrder}
            title={`Focused route #${mappedOrder.id.slice(0, 8)}`}
            description="The rider map shows the shop, customer pin, and your live position while the order is active."
            compact
          />
        ) : (
          <Card>
            <CardContent className="p-5 text-sm text-[color:var(--color-text-soft)]">
              Select a delivery to view its route map.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
