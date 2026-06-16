import { startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, CheckCircle2, ChefHat, Clock3, DollarSign, MapPin, Megaphone, MessageSquare, PackageCheck, ShoppingBag, Sparkles, Wallet, XCircle } from 'lucide-react';
import { LazyOrderRouteMap } from '@/components/maps/LazyOrderRouteMap';
import { Button } from '@/components/ui/button';
import { Order, OrderStatus } from '@/types';
import { ORDER_STATUS_LABELS } from '@/utils/constants';
import { formatCurrency } from '@/utils/helpers';
import { ParallaxSection } from '@/components/motion/Parallax';
import { Reveal } from '@/components/motion/Reveal';
import { StatusBadge } from '@/components/ui/status-badge';
import { useVisiblePolling } from '@/hooks/useVisiblePolling';
import { getOrders, updateOrderStatus } from '@/services/orderService';

export function SellerDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const response = await getOrders({ page: 1, limit: 20 });
      startTransition(() => {
        setOrders(response.data);
        setError(null);
      });
    } catch (caughtError) {
      startTransition(() => {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load orders');
      });
    }
  }, []);

  useVisiblePolling(loadOrders, 15000);

  const changeStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status);
      await loadOrders();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to update status');
    }
  }, [loadOrders]);

  const sellerActions: Record<string, Array<'accepted' | 'rejected' | 'preparing' | 'ready_for_pickup'>> = {
    pending: ['accepted', 'rejected'],
    accepted: ['preparing'],
    preparing: ['ready_for_pickup'],
  };

  const metrics = useMemo(() => {
    const todaysOrders = orders.filter(
      (order) => new Date(order.createdAt).toDateString() === new Date().toDateString(),
    ).length;

    const activeOrders = orders.filter((order) =>
      ['pending', 'accepted', 'preparing', 'ready_for_pickup', 'picked_up'].includes(order.status),
    ).length;

    const revenue = orders
      .filter((order) => order.status === 'delivered')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    return { todaysOrders, activeOrders, revenue };
  }, [orders]);

  useEffect(() => {
    if (orders.length === 0) {
      setSelectedOrderId(null);
      return;
    }

    if (selectedOrderId && orders.some((order) => order.id === selectedOrderId)) {
      return;
    }

    const firstTrackedOrder =
      orders.find((order) =>
        ['accepted', 'preparing', 'ready_for_pickup', 'picked_up', 'delivering'].includes(
          order.status,
        ),
      ) ?? orders[0];

    setSelectedOrderId(firstTrackedOrder.id);
  }, [orders, selectedOrderId]);

  const selectedOrder =
    orders.find((order) => order.id === selectedOrderId) ?? null;

  const nextCheckpoint = useMemo(() => {
    if (!selectedOrder) {
      return 'Select an order to inspect the next action.';
    }

    switch (selectedOrder.status) {
      case 'pending':
        return 'Review the order and accept or reject it.';
      case 'accepted':
        return 'Kitchen prep should be underway.';
      case 'preparing':
        return 'Move this order toward ready for pickup.';
      case 'ready_for_pickup':
        return 'A rider can claim this run now.';
      case 'picked_up':
        return 'The rider is on the way to the customer.';
      case 'delivering':
        return 'Keep an eye on the live rider progress.';
      case 'delivered':
        return 'This order is complete and reflected in revenue.';
      default:
        return 'No further action is needed right now.';
    }
  }, [selectedOrder]);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        {/* Editorial Header */}
        <div className="border-b border-border pb-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Seller</p>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Dashboard</h1>
            <p className="text-base text-muted-foreground mt-2 max-w-xl">
              Today's orders, active orders, and delivered revenue — all in one view.
            </p>
          </div>
        </div>

        {/* Flat Stat Strip */}
        <ParallaxSection offset={8}>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border border-b border-border py-8 mb-12">
            <div className="px-6 py-4 md:py-0 flex flex-col justify-between first:pl-0 last:pr-0">
              <span className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
                {metrics.todaysOrders}
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2 block">
                  Today's orders
                </span>
                <p className="text-xs text-muted-foreground/70 mt-1">Orders placed since midnight</p>
              </div>
            </div>
            <div className="px-6 py-4 md:py-0 flex flex-col justify-between">
              <span className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
                {metrics.activeOrders}
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2 block">
                  Active orders
                </span>
                <p className="text-xs text-muted-foreground/70 mt-1">Still in progress right now</p>
              </div>
            </div>
            <div className="px-6 py-4 md:py-0 flex flex-col justify-between first:pl-0 last:pr-0">
              <span className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
                {formatCurrency(metrics.revenue)}
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2 block">
                  Delivered revenue
                </span>
                <p className="text-xs text-muted-foreground/70 mt-1">Completed order value</p>
              </div>
            </div>
          </div>
        </ParallaxSection>

        {error ? (
          <div className="border-l-4 border-[color:var(--color-danger)] bg-[color:var(--color-danger-soft)]/20 px-6 py-4 text-sm text-[color:var(--color-danger)] mb-8">
            {error}
          </div>
        ) : null}

        {/* Quick-Action Nav */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          <button
            onClick={() => navigate('/seller/kds')}
            className="border border-border p-5 bg-background hover:bg-secondary/5 transition-colors text-left"
          >
            <ChefHat className="h-5 w-5 text-primary mb-3" />
            <p className="text-sm font-bold uppercase tracking-widest">Kitchen Display</p>
            <p className="text-xs text-muted-foreground mt-1">Live ticket queue</p>
          </button>
          <button
            onClick={() => navigate('/seller/orders')}
            className="border border-border p-5 bg-background hover:bg-secondary/5 transition-colors text-left"
          >
            <ShoppingBag className="h-5 w-5 text-primary mb-3" />
            <p className="text-sm font-bold uppercase tracking-widest">Order Lanes</p>
            <p className="text-xs text-muted-foreground mt-1">Kanban management</p>
          </button>
          <button
            onClick={() => navigate('/seller/promotions')}
            className="border border-border p-5 bg-background hover:bg-secondary/5 transition-colors text-left"
          >
            <Megaphone className="h-5 w-5 text-primary mb-3" />
            <p className="text-sm font-bold uppercase tracking-widest">Promotions</p>
            <p className="text-xs text-muted-foreground mt-1">Discounts & offers</p>
          </button>
          <button
            onClick={() => navigate('/seller/ratings')}
            className="border border-border p-5 bg-background hover:bg-secondary/5 transition-colors text-left"
          >
            <MessageSquare className="h-5 w-5 text-primary mb-3" />
            <p className="text-sm font-bold uppercase tracking-widest">Reviews</p>
            <p className="text-xs text-muted-foreground mt-1">Customer feedback</p>
          </button>
          <button
            onClick={() => navigate('/seller/analytics')}
            className="border border-border p-5 bg-background hover:bg-secondary/5 transition-colors text-left"
          >
            <BarChart3 className="h-5 w-5 text-primary mb-3" />
            <p className="text-sm font-bold uppercase tracking-widest">Analytics</p>
            <p className="text-xs text-muted-foreground mt-1">Performance metrics</p>
          </button>
          <button
            onClick={() => navigate('/seller/payouts')}
            className="border border-border p-5 bg-background hover:bg-secondary/5 transition-colors text-left"
          >
            <Wallet className="h-5 w-5 text-primary mb-3" />
            <p className="text-sm font-bold uppercase tracking-widest">Payouts</p>
            <p className="text-xs text-muted-foreground mt-1">Revenue & settlements</p>
          </button>
        </div>

        <div className="grid gap-12 xl:grid-cols-[minmax(0,1.15fr)_380px]">
          <Reveal>
            <div className="space-y-6">
              <h2 className="text-2xl font-medium tracking-tighter pb-4 border-b border-foreground">
                Recent Orders
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Order</th>
                      <th className="pb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                      <th className="pb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Amount</th>
                      <th className="pb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Placed</th>
                      <th className="pb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Address</th>
                      <th className="pb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 10).map((order) => {
                      const actions = sellerActions[order.status] ?? [];

                      return (
                        <tr
                          key={order.id}
                          className={`cursor-pointer border-b border-border transition-colors ${
                            order.id === selectedOrderId
                              ? 'bg-secondary/15 font-semibold'
                              : 'hover:bg-secondary/5'
                          }`}
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          <td className="py-4 font-semibold text-sm">#{order.id.slice(0, 8)}</td>
                          <td className="py-4 text-sm">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="py-4 text-sm">{formatCurrency(order.totalAmount)}</td>
                          <td className="py-4 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="py-4 text-sm max-w-[220px] truncate" title={order.deliveryAddress}>
                            {order.deliveryAddress}
                          </td>
                          <td className="py-4 text-sm text-right">
                            <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                              {actions.map((action) => (
                                <Button
                                  key={action}
                                  size="sm"
                                  variant={action === 'rejected' ? 'outline' : 'default'}
                                  className="h-8 rounded-none border border-foreground font-bold uppercase tracking-widest text-[10px]"
                                  onClick={() => void changeStatus(order.id, action)}
                                >
                                  {action === 'rejected' ? (
                                    <XCircle className="h-3 w-3 mr-1" />
                                  ) : (
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                  )}
                                  {ORDER_STATUS_LABELS[action]}
                                </Button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {orders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-12 text-center text-muted-foreground text-sm"
                        >
                          No orders found.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>


          <div className="xl:block">
            {selectedOrder ? (
              <>
                {/* Backdrop for mobile/tablet */}
                <div
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 xl:hidden"
                  onClick={() => setSelectedOrderId(null)}
                  aria-hidden="true"
                />

                {/* Sliding drawer on mobile, static sidebar on desktop */}
                <div className="fixed top-0 right-0 h-full w-full max-w-[450px] bg-background border-l border-border z-50 p-6 overflow-y-auto shadow-2xl xl:shadow-none xl:border-0 xl:p-0 xl:static xl:h-auto xl:w-auto xl:max-w-none xl:z-0 xl:bg-transparent space-y-6">
                  {/* Header with Close trigger for mobile */}
                  <div className="flex items-center justify-between pb-4 border-b border-border xl:hidden">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Order Overview</span>
                    <button
                      onClick={() => setSelectedOrderId(null)}
                      className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none"
                      aria-label="Close details drawer"
                    >
                      <XCircle className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="border border-border p-4 bg-background">
                    <LazyOrderRouteMap
                      order={selectedOrder}
                      title={`Order map #${selectedOrder.id.slice(0, 8)}`}
                      description="Track the delivery address pin, your shop location, and rider progress from the seller dashboard."
                      compact
                    />
                  </div>

                  <div className="border border-border p-6 bg-background space-y-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Focused order</p>
                      <h2 className="mt-2 text-3xl font-medium tracking-tighter">#{selectedOrder.id.slice(0, 8)}</h2>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        Order details, delivery address, and the next step to move this order forward.
                      </p>
                    </div>

                    <div className="grid gap-4">
                      <div className="border border-border flex items-center gap-3 px-4 py-4 bg-secondary/5">
                        <DollarSign className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                            Amount
                          </p>
                          <p className="text-base font-semibold text-foreground">
                            {formatCurrency(selectedOrder.totalAmount)}
                          </p>
                        </div>
                      </div>
                      <div className="border border-border flex items-center gap-3 px-4 py-4 bg-secondary/5">
                        <PackageCheck className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                            Items
                          </p>
                          <p className="text-base font-semibold text-foreground">
                            {selectedOrder.items.length} items
                          </p>
                        </div>
                      </div>
                      <div className="border border-border flex items-center gap-3 px-4 py-4 bg-secondary/5">
                        <Clock3 className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                            Placed
                          </p>
                          <p className="text-base font-semibold text-foreground">
                            {new Date(selectedOrder.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-border space-y-3 px-4 py-4 bg-secondary/5">
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {selectedOrder.deliveryAddress}
                        </p>
                      </div>
                      <div className="flex items-start gap-2 border-t border-border/60 pt-3 mt-3">
                        <Sparkles className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                        <p className="text-sm text-muted-foreground leading-relaxed">{nextCheckpoint}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="hidden xl:block border border-border p-8 text-center text-sm text-muted-foreground bg-secondary/5 h-fit">
                Select an order to view its map and details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
