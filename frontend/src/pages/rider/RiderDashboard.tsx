import { useCallback, startTransition, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bike,
  Clock3,
  MapPin,
  PackageCheck,
  Sparkles,
  CheckCircle2,
  Zap,
  ShoppingBag,
  Store,
  AlertCircle,
} from 'lucide-react';
import { LazyOrderRouteMap } from '@/components/maps/LazyOrderRouteMap';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useRiderLocationTracking } from '@/hooks/useRiderLocationTracking';
import { PageHeader } from '@/components/layout/PageHeader';
import { ParallaxSection } from '@/components/motion/Parallax';
import { Reveal, Stagger } from '@/components/motion/Reveal';
import { StatusBadge } from '@/components/ui/status-badge';
import { useVisiblePolling } from '@/hooks/useVisiblePolling';
import { getDeliveries, acceptDelivery, updateDeliveryStatus } from '../../services/riderService';
import { ORDER_STATUS_LABELS } from '@/utils/constants';
import { Order } from '../../types';
import { toast } from 'sonner';

type TabId = 'available' | 'active';

export function RiderDashboard() {
  const [tab, setTab] = useState<TabId>('available');
  const [available, setAvailable] = useState<Order[]>([]);
  const [active, setActive] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAvailable = async () => {
    try {
      const data = await getDeliveries('available');
      startTransition(() => setAvailable(data));
    } catch {
      // silently ignore — available is best-effort
    }
  };

  const loadActive = async () => {
    try {
      const data = await getDeliveries('active');
      startTransition(() => {
        setActive(data);
        setError(null);
      });
    } catch (caughtError) {
      startTransition(() => {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load deliveries');
      });
    }
  };

  const loadAll = useCallback(async () => {
    await Promise.all([loadAvailable(), loadActive()]);
  }, []);

  useVisiblePolling(loadAll, 10000);

  useEffect(() => {
    const nextSelectedOrder = active[0]?.id ?? null;
    if (!selectedOrderId || !active.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(nextSelectedOrder);
    }
  }, [active, selectedOrderId]);

  const focusedOrder = useMemo(
    () => active.find((order) => order.id === selectedOrderId) ?? active[0] ?? null,
    [active, selectedOrderId],
  );

  const liveCoords = useRiderLocationTracking({
    orderId: focusedOrder?.id,
    enabled: Boolean(
      focusedOrder &&
        focusedOrder.riderId &&
        ['ready_for_pickup', 'picked_up', 'delivering'].includes(focusedOrder.status),
    ),
  });

  const mappedOrder = useMemo(() => {
    return focusedOrder
      ? {
          ...focusedOrder,
          riderLat: liveCoords?.lat ?? focusedOrder.riderLat,
          riderLng: liveCoords?.lng ?? focusedOrder.riderLng,
        }
      : null;
  }, [focusedOrder, liveCoords]);

  const focusMessage = useMemo(() => {
    if (!mappedOrder) {
      return 'Pick a delivery to see the next rider action.';
    }
    switch (mappedOrder.status) {
      case 'accepted':
      case 'preparing':
        return 'The shop is preparing the order. Head there now.';
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

  const changeStatus = useCallback(
    async (
      orderId: string,
      status: 'ready_for_pickup' | 'picked_up' | 'delivering' | 'delivered',
    ) => {
      try {
        await updateDeliveryStatus(orderId, status);
        await loadAll();
      } catch (caughtError) {
        setError(
          caughtError instanceof Error ? caughtError.message : 'Failed to update delivery',
        );
      }
    },
    [loadAll],
  );

  const handleClaim = useCallback(
    async (orderId: string) => {
      setClaimingId(orderId);
      try {
        await acceptDelivery(orderId);
        toast.success('Delivery claimed! Check your Active tab.');
        setTab('active');
        await loadAll();
      } catch (caughtError) {
        toast.error(
          caughtError instanceof Error
            ? caughtError.message
            : 'Failed to claim this delivery',
        );
        // Refresh pool so stale entry disappears
        await loadAvailable();
      } finally {
        setClaimingId(null);
      }
    },
    [loadAll],
  );

  const riderTransitions: Record<
    string,
    Array<'ready_for_pickup' | 'picked_up' | 'delivering' | 'delivered'>
  > = {
    accepted: ['ready_for_pickup'],
    preparing: ['ready_for_pickup'],
    ready_for_pickup: ['picked_up'],
    picked_up: ['delivering'],
    delivering: ['delivered'],
  };

  const preparingCount = active.filter((o) =>
    ['accepted', 'preparing'].includes(o.status),
  ).length;
  const readyCount = active.filter((o) => o.status === 'ready_for_pickup').length;
  const transitCount = active.filter((o) =>
    ['picked_up', 'delivering'].includes(o.status),
  ).length;

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Rider"
        title="Delivery dashboard"
        description="Browse open bookings, claim a run, and manage your active deliveries."
      />

      {error ? (
        <Card>
          <CardContent className="p-5 text-sm text-[color:var(--color-danger)] flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </CardContent>
        </Card>
      ) : null}

      <ParallaxSection offset={8}>
        <Stagger className="grid gap-5 md:grid-cols-3" delayChildren={0.04} stagger={0.06}>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-[color:var(--color-text-soft)]">Preparing</p>
              <p className="mt-2 text-3xl font-semibold">{preparingCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-[color:var(--color-text-soft)]">Ready for Pickup</p>
              <p className="mt-2 text-3xl font-semibold">{readyCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-[color:var(--color-text-soft)]">In Transit</p>
              <p className="mt-2 text-3xl font-semibold">{transitCount}</p>
            </CardContent>
          </Card>
        </Stagger>
      </ParallaxSection>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_380px]">
        <Reveal className="space-y-4">
          {/* Tab switcher */}
          <div className="flex items-center gap-1 border-b border-border">
            {([
              { id: 'available' as TabId, label: 'Open Bookings', count: available.length },
              { id: 'active' as TabId, label: 'My Deliveries', count: active.length },
            ] as const).map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-widest border-b-2 -mb-px transition-colors ${
                  tab === id
                    ? 'border-[color:var(--color-primary)] text-[color:var(--color-primary)]'
                    : 'border-transparent text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text)]'
                }`}
              >
                {label}
                {count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                      tab === id
                        ? 'bg-[color:var(--color-primary)] text-white'
                        : 'bg-[color:var(--color-surface)] text-[color:var(--color-text-soft)]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── AVAILABLE BOOKINGS TAB ── */}
          {tab === 'available' && (
            <Card>
              <CardContent className="space-y-4 p-5">
                <div>
                  <h2 className="text-2xl font-semibold">Open bookings</h2>
                  <p className="subtle-copy">
                    Sellers have accepted these orders. Claim one to start the delivery.
                  </p>
                </div>

                {available.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-[color:var(--color-surface)] flex items-center justify-center">
                      <Zap className="h-5 w-5 text-[color:var(--color-text-soft)]" />
                    </div>
                    <p className="text-sm font-semibold text-[color:var(--color-text-soft)]">
                      No open bookings right now
                    </p>
                    <p className="text-xs text-[color:var(--color-text-muted)] max-w-[200px]">
                      New bookings appear when sellers accept orders. This refreshes every 10 seconds.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {available.map((order) => (
                      <div
                        key={order.id}
                        className="panel-card space-y-4 p-4 border border-border rounded-[22px] bg-[color:var(--color-surface)]"
                      >
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--color-text-muted)]">
                              Order #{order.id.slice(0, 8).toUpperCase()}
                            </p>
                            <p className="mt-1 text-lg font-bold">
                              {order.vendor?.name ?? 'Restaurant'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-[color:var(--color-primary)]">
                              ₱{(order.deliveryFee ?? 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-[color:var(--color-text-muted)]">
                              delivery fee
                            </p>
                          </div>
                        </div>

                        {/* Info rows */}
                        <div className="grid gap-2">
                          <div className="flex items-center gap-2 text-sm text-[color:var(--color-text-soft)]">
                            <Store className="h-3.5 w-3.5 text-[color:var(--color-primary-dark)] flex-shrink-0" />
                            <span className="truncate">
                              {order.vendor?.address ?? 'Pickup location N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[color:var(--color-text-soft)]">
                            <MapPin className="h-3.5 w-3.5 text-[color:var(--color-primary-dark)] flex-shrink-0" />
                            <span className="truncate">
                              {[order.barangay, order.street].filter(Boolean).join(', ') ||
                                order.deliveryAddress ||
                                'Delivery pin set'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[color:var(--color-text-soft)]">
                            <ShoppingBag className="h-3.5 w-3.5 text-[color:var(--color-primary-dark)] flex-shrink-0" />
                            <span>
                              {order.items.length} item{order.items.length !== 1 ? 's' : ''} ·{' '}
                              ₱{order.totalAmount.toFixed(2)} total
                            </span>
                          </div>
                        </div>

                        {/* Claim button */}
                        <Button
                          className="w-full h-11 font-bold text-sm uppercase tracking-widest"
                          onClick={() => void handleClaim(order.id)}
                          disabled={claimingId !== null}
                        >
                          {claimingId === order.id ? (
                            'Claiming...'
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-2" />
                              Claim delivery
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── ACTIVE DELIVERIES TAB ── */}
          {tab === 'active' && (
            <Card>
              <CardContent className="space-y-4 p-5">
                <div>
                  <h2 className="text-2xl font-semibold">My active deliveries</h2>
                  <p className="subtle-copy">Keep the current run moving and update status as you go.</p>
                </div>

                {active.map((order) => {
                  const nextActions = riderTransitions[order.status] ?? [];
                  return (
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
                        <span>{order.vendor?.name ?? order.deliveryAddress}</span>
                      </div>
                      <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                        {nextActions.map((action) => (
                          <Button
                            key={action}
                            size="sm"
                            className="rounded-full text-xs h-8"
                            onClick={() => void changeStatus(order.id, action)}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {ORDER_STATUS_LABELS[action] ?? action}
                          </Button>
                        ))}
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/rider/delivery/${order.id}`}>Open delivery detail</Link>
                      </Button>
                    </div>
                  );
                })}

                {active.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-[color:var(--color-text-soft)]">No active deliveries.</p>
                    <p className="text-xs text-[color:var(--color-text-muted)] mt-1">
                      Claim a booking from the Open Bookings tab.
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
        </Reveal>

        {/* ── ROUTE PANEL (only shown when active tab is selected or on desktop) ── */}
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
                Select an active delivery to view its route map.
              </CardContent>
            </Card>
          )}

          {mappedOrder ? (
            <Card>
              <CardContent className="space-y-4 p-5">
                <div>
                  <p className="eyebrow">Focused delivery</p>
                  <h2 className="mt-2 text-2xl font-semibold">#{mappedOrder.id.slice(0, 8)}</h2>
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
