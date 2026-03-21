import { startTransition, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bike, Clock3, MapPin, PackageCheck, Sparkles } from 'lucide-react';
import { LazyOrderRouteMap } from '@/components/maps/LazyOrderRouteMap';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useRiderLocationTracking } from '@/hooks/useRiderLocationTracking';
import { PageHeader } from '@/components/layout/PageHeader';
import { ParallaxSection } from '@/components/motion/Parallax';
import { Reveal, Stagger } from '@/components/motion/Reveal';
import { StatusBadge } from '@/components/ui/status-badge';
import { useVisiblePolling } from '@/hooks/useVisiblePolling';
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
      startTransition(() => {
        setAvailable(availableOrders);
        setActive(activeOrders);
        setError(null);
      });
    } catch (caughtError) {
      startTransition(() => {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load deliveries');
      });
    }
  };

  useVisiblePolling(loadData, 15000);

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

  const focusMessage = useMemo(() => {
    if (!mappedOrder) {
      return 'Pick a delivery to see the next rider action.';
    }

    switch (mappedOrder.status) {
      case 'ready_for_pickup':
        return 'Head to the shop and confirm pickup once the order is in hand.';
      case 'picked_up':
        return 'You are carrying the order. Move toward the customer pin.';
      case 'delivering':
        return 'Stay on route and finish the drop-off cleanly.';
      default:
        return 'Claim the next delivery and keep the route panel focused.';
    }
  }, [mappedOrder]);

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

      <ParallaxSection offset={12}>
        <Stagger className="grid gap-5 md:grid-cols-3" delayChildren={0.04} stagger={0.06}>
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
        </Stagger>
      </ParallaxSection>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_380px]">
        <Reveal className="space-y-6">
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
        </Reveal>

        <Reveal className="space-y-4" delay={0.1}>
          {mappedOrder ? (
            <LazyOrderRouteMap
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

          {mappedOrder ? (
            <Card>
              <CardContent className="space-y-4 p-5">
                <div>
                  <p className="eyebrow">Focused delivery</p>
                  <h2 className="mt-2 text-2xl font-semibold">#{mappedOrder.id.slice(0, 8)}</h2>
                  <p className="mt-2 subtle-copy">
                    This fills the route column with actual delivery context instead of leaving unused space below the map.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <div className="panel-muted flex items-center gap-3 px-4 py-4">
                    <Clock3 className="h-4 w-4 text-[color:var(--color-primary-dark)]" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                        Status
                      </p>
                      <p className="text-sm font-semibold capitalize text-[color:var(--color-text)]">
                        {mappedOrder.status.replaceAll('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="panel-muted flex items-center gap-3 px-4 py-4">
                    <PackageCheck className="h-4 w-4 text-[color:var(--color-primary-dark)]" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                        Items
                      </p>
                      <p className="text-sm font-semibold text-[color:var(--color-text)]">
                        {mappedOrder.items.length} items
                      </p>
                    </div>
                  </div>
                  <div className="panel-muted flex items-center gap-3 px-4 py-4">
                    <Bike className="h-4 w-4 text-[color:var(--color-primary-dark)]" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                        Delivery phase
                      </p>
                      <p className="text-sm font-semibold text-[color:var(--color-text)]">
                        {mappedOrder.riderId ? 'Assigned to you' : 'Waiting'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="panel-muted space-y-3 px-4 py-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 text-[color:var(--color-primary-dark)]" />
                    <p className="text-sm text-[color:var(--color-text-soft)]">
                      {mappedOrder.deliveryAddress}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 text-[color:var(--color-primary-dark)]" />
                    <p className="text-sm text-[color:var(--color-text-soft)]">{focusMessage}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </Reveal>
      </div>
    </div>
  );
}
