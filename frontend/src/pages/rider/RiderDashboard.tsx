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
  Wallet,
} from 'lucide-react';
import { LazyOrderRouteMap } from '@/components/maps/LazyOrderRouteMap';
import { useRiderLocationTracking } from '@/hooks/useRiderLocationTracking';
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal';
import { useVisiblePolling } from '@/hooks/useVisiblePolling';
import { getDeliveries, acceptDelivery, updateDeliveryStatus } from '../../services/riderService';
import { getWallet } from '../../services/walletService';
import { ORDER_STATUS_LABELS } from '@/utils/constants';
import { Order } from '../../types';
import { formatCurrency } from '@/utils/helpers';
import { toast } from 'sonner';

type TabId = 'available' | 'active';

export function RiderDashboard() {
  const [tab, setTab] = useState<TabId>('available');
  const [available, setAvailable] = useState<Order[]>([]);
  const [active, setActive] = useState<Order[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
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

  const loadWallet = async () => {
    try {
      const wallet = await getWallet();
      setWalletBalance(wallet.balance);
    } catch {
      setWalletBalance(0);
    }
  };

  const loadAll = useCallback(async () => {
    await Promise.all([loadAvailable(), loadActive(), loadWallet()]);
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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground font-sans">
      <div className="max-w-[1600px] mx-auto px-6 py-12 lg:px-12">
        {error ? (
          <div className="border border-red-500 bg-red-500/10 p-6 mb-8 text-sm font-bold text-red-500 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        ) : null}

        {/* Master Header with GeoPay Integration */}
        <Reveal>
          <div className="border border-border bg-secondary/5 mb-12 flex flex-col md:flex-row md:items-stretch justify-between relative overflow-hidden">
            <div className="flex-1 p-8 md:p-12 border-b md:border-b-0 md:border-r border-border">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                <Bike className="w-4 h-4 text-primary" /> Rider Dispatch
              </p>
              <h1 className="text-5xl md:text-7xl font-medium tracking-tighter text-foreground mt-1">
                Dashboard.
              </h1>
              <p className="text-xl text-muted-foreground mt-4 max-w-md leading-relaxed">
                Browse open bookings, claim a run, and manage your active deliveries.
              </p>
            </div>
            
            <div className="flex-1 p-8 md:p-12 bg-primary/5 relative">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs">
                  <Wallet className="w-4 h-4" /> GeoPay Earnings
                </div>
                <Link to="/wallet" className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors border border-border px-3 py-1 bg-background">
                  Open Wallet
                </Link>
              </div>
              <div className="text-6xl md:text-7xl font-medium tracking-tighter text-foreground">
                {walletBalance !== null ? formatCurrency(walletBalance) : '---'}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Shift Stats */}
        <Reveal delay={0.05}>
          <div className="grid gap-0 sm:grid-cols-3 border border-border bg-background mb-12">
            <div className="p-8 border-b sm:border-b-0 sm:border-r border-border">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Preparing</p>
              <p className="text-5xl font-medium tracking-tighter text-foreground">{preparingCount}</p>
            </div>
            <div className="p-8 border-b sm:border-b-0 sm:border-r border-border">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Ready for Pickup</p>
              <p className="text-5xl font-medium tracking-tighter text-primary">{readyCount}</p>
            </div>
            <div className="p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">In Transit</p>
              <p className="text-5xl font-medium tracking-tighter text-foreground">{transitCount}</p>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_480px]">
          <div className="space-y-0">
            {/* Editorial Tab Switcher */}
            <div className="flex items-center border-b-2 border-foreground mb-8">
              {([
                { id: 'available' as TabId, label: 'Open Bookings', count: available.length },
                { id: 'active' as TabId, label: 'My Deliveries', count: active.length },
              ] as const).map(({ id, label, count }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-3 px-8 py-5 text-sm font-bold uppercase tracking-widest transition-colors border-l border-t border-r ${
                    tab === id
                      ? 'border-border bg-background text-foreground relative top-[2px]'
                      : 'border-transparent text-muted-foreground hover:bg-secondary/10 hover:text-foreground'
                  }`}
                >
                  {label}
                  {count > 0 && (
                    <span className={`flex items-center justify-center h-6 min-w-[24px] rounded-full px-2 text-xs font-bold ${
                      tab === id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── AVAILABLE BOOKINGS TAB ── */}
            {tab === 'available' && (
              <div className="space-y-6">
                {available.length === 0 ? (
                  <div className="border border-border bg-secondary/5 py-24 text-center px-6">
                    <Zap className="h-10 w-10 text-muted-foreground mx-auto mb-6" />
                    <h2 className="text-3xl font-medium tracking-tighter mb-2">No open bookings</h2>
                    <p className="text-lg text-muted-foreground max-w-sm mx-auto">
                      New bookings appear when sellers accept orders. This feed refreshes automatically.
                    </p>
                  </div>
                ) : (
                  <Stagger className="space-y-4" delayChildren={0.02} stagger={0.05}>
                    {available.map((order) => (
                      <StaggerItem key={order.id}>
                        <div className="group border border-border bg-background hover:bg-secondary/5 transition-colors p-6 md:p-8 flex flex-col lg:flex-row justify-between gap-8">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground border border-border px-2 py-1 bg-secondary/20">
                                Order #{order.id.slice(0, 8)}
                              </span>
                              <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> New
                              </span>
                            </div>
                            <h3 className="text-3xl font-medium tracking-tighter text-foreground mb-6">
                              {order.vendor?.name ?? 'Local Shop'}
                            </h3>
                            
                            <div className="grid gap-3 sm:grid-cols-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                              <div className="flex items-start gap-3">
                                <Store className="h-4 w-4 text-primary shrink-0" />
                                <span className="line-clamp-2">{order.vendor?.address ?? 'Pickup location N/A'}</span>
                              </div>
                              <div className="flex items-start gap-3">
                                <MapPin className="h-4 w-4 text-primary shrink-0" />
                                <span className="line-clamp-2">
                                  {[order.barangay, order.street].filter(Boolean).join(', ') || order.deliveryAddress || 'Delivery pin set'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col justify-between items-start lg:items-end border-t lg:border-t-0 lg:border-l border-border pt-6 lg:pt-0 lg:pl-8 lg:min-w-[200px]">
                            <div className="mb-6 lg:text-right">
                              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                                Delivery Fee
                              </p>
                              <p className="text-4xl font-medium tracking-tighter text-green-500">
                                {formatCurrency(order.deliveryFee ?? 0)}
                              </p>
                            </div>
                            <button
                              className="w-full bg-foreground text-background h-14 font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-primary transition-colors disabled:opacity-50"
                              onClick={() => void handleClaim(order.id)}
                              disabled={claimingId !== null}
                            >
                              {claimingId === order.id ? 'Claiming...' : (
                                <>Claim run <Zap className="h-4 w-4" /></>
                              )}
                            </button>
                          </div>
                        </div>
                      </StaggerItem>
                    ))}
                  </Stagger>
                )}
              </div>
            )}

            {/* ── ACTIVE DELIVERIES TAB ── */}
            {tab === 'active' && (
              <div className="space-y-6">
                {active.length === 0 ? (
                  <div className="border border-border bg-secondary/5 py-24 text-center px-6">
                    <Bike className="h-10 w-10 text-muted-foreground mx-auto mb-6" />
                    <h2 className="text-3xl font-medium tracking-tighter mb-2">No active runs</h2>
                    <p className="text-lg text-muted-foreground max-w-sm mx-auto">
                      Claim an order from the Open Bookings tab to start delivering.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {active.map((order) => {
                      const nextActions = riderTransitions[order.status] ?? [];
                      const isFocused = order.id === selectedOrderId;
                      
                      return (
                        <div
                          key={order.id}
                          className={`cursor-pointer border p-6 md:p-8 transition-colors ${
                            isFocused
                              ? 'border-primary bg-primary/5'
                              : 'border-border bg-background hover:bg-secondary/10'
                          }`}
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          <div className="flex flex-col md:flex-row justify-between gap-6 mb-6 pb-6 border-b border-border/50">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`text-xs font-bold uppercase tracking-widest ${isFocused ? 'text-primary' : 'text-muted-foreground'}`}>
                                  #{order.id.slice(0, 8)}
                                </span>
                              </div>
                              <h3 className="text-2xl font-medium tracking-tighter">
                                {order.vendor?.name ?? 'Delivery Location'}
                              </h3>
                            </div>
                            <div className="flex items-center">
                              <span className="border border-foreground bg-transparent px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest">
                                {ORDER_STATUS_LABELS[order.status] ?? order.status}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              {nextActions.map((action) => (
                                <button
                                  key={action}
                                  className="h-12 border border-foreground bg-foreground text-background px-6 font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-primary hover:border-primary transition-colors"
                                  onClick={() => void changeStatus(order.id, action)}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  {ORDER_STATUS_LABELS[action] ?? action}
                                </button>
                              ))}
                            </div>
                            <Link 
                              to={`/rider/delivery/${order.id}`}
                              className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View Details &rarr;
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── ROUTE PANEL ── */}
          <div className="space-y-8 xl:sticky xl:top-12 xl:self-start">
            <h2 className="text-3xl font-medium tracking-tighter border-b-2 border-foreground pb-4 mb-8">
              Live routing
            </h2>
            
            {mappedOrder ? (
              <div className="border border-border bg-background p-1">
                <div className="h-[400px] relative border border-border">
                  <LazyOrderRouteMap
                    order={mappedOrder}
                    title="Focused Route"
                    description="Rider tracking map."
                    compact
                  />
                </div>
                
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Focused Order</p>
                      <p className="text-xl font-medium tracking-tight">#{mappedOrder.id.slice(0, 8)}</p>
                    </div>
                    <Link 
                      to={`/rider/delivery/${mappedOrder.id}`}
                      className="border border-border px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
                    >
                      Open detail
                    </Link>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span className="line-clamp-2 leading-relaxed">
                        {mappedOrder.deliveryAddress}
                      </span>
                    </div>
                    <div className="flex items-start gap-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                      <Sparkles className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span className="line-clamp-2 leading-relaxed text-foreground">
                        {focusMessage}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-border bg-secondary/5 h-[400px] flex items-center justify-center p-8 text-center">
                <div>
                  <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground tracking-tighter">No active route</p>
                  <p className="text-sm text-muted-foreground mt-2">Claim a booking or select an active delivery to view its map.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
