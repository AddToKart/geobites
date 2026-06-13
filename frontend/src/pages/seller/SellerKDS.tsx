import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock3, ExternalLink, TimerReset, CheckCheck, ChefHat, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { useVisiblePolling } from '@/hooks/useVisiblePolling';
import { getOrders, updateOrderStatus } from '@/services/orderService';
import { Order, OrderStatus } from '@/types';
import { formatCurrency } from '@/utils/helpers';
import { toast } from 'sonner';

const PREP_ACTIONS: Record<string, Array<{ label: string; nextStatus: OrderStatus; variant?: 'default' | 'outline' }>> = {
  accepted: [
    { label: 'Start preparing', nextStatus: 'preparing', variant: 'default' },
  ],
  preparing: [
    { label: 'Mark ready', nextStatus: 'ready_for_pickup', variant: 'default' },
  ],
};

export function SellerKDS() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const response = await getOrders({ page: 1, limit: 50 });
      setOrders(response.data);
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load orders');
    }
  }, []);

  useVisiblePolling(loadOrders, 8000);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const kitchenOrders = useMemo(
    () => orders.filter((o) => ['accepted', 'preparing'].includes(o.status)),
    [orders],
  );

  const handleKitchenAction = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status);
      toast.success(`Order #${orderId.slice(0, 8)} moved to ${status}`);
      await loadOrders();
    } catch (caughtError) {
      toast.error(caughtError instanceof Error ? caughtError.message : 'Failed to update');
    }
  };

  const orderAge = (createdAt: string) => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    return minutes;
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-[1600px] mx-auto px-6 py-12 lg:px-12">
        {/* Editorial Header */}
        <div className="border-b border-border pb-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Seller</p>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Kitchen Display</h1>
            <p className="text-base text-muted-foreground mt-2 max-w-xl">
              Live order queue for the kitchen. Accept, prepare, and bump tickets as they move through the line.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="border border-border px-4 py-2 text-right">
              <p className="text-2xl font-bold tracking-tight">{kitchenOrders.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">In kitchen</p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="border-l-4 border-[color:var(--color-danger)] bg-[color:var(--color-danger-soft)]/20 px-6 py-4 text-sm text-[color:var(--color-danger)] mb-8">
            {error}
          </div>
        ) : null}

        {/* KDS Grid */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {kitchenOrders.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3 border border-dashed border-border p-12 text-center text-sm text-muted-foreground bg-secondary/5">
              <ChefHat className="h-8 w-8 mx-auto mb-4 text-muted-foreground/50" />
              <p className="font-semibold text-foreground mb-1">Kitchen is clear</p>
              <p className="text-xs">No accepted or preparing orders right now. New ones will appear here automatically.</p>
            </div>
          ) : (
            kitchenOrders.map((order) => {
              const age = orderAge(order.createdAt);
              const actions = PREP_ACTIONS[order.status] ?? [];
              const totalPrepTime = order.items.reduce((sum, item) => sum + ((item as any).prepTimeMinutes || 5), 0);

              return (
                <div
                  key={order.id}
                  className={`border bg-background ${
                    age > 20 ? 'border-danger/50' : age > 10 ? 'border-orange-500/30' : 'border-border'
                  }`}
                >
                  {/* Ticket Header */}
                  <div className={`px-5 py-4 border-b border-border flex items-center justify-between ${
                    age > 20 ? 'bg-danger/5' : age > 10 ? 'bg-orange-500/5' : ''
                  }`}>
                    <div>
                      <p className="text-lg font-bold tracking-tight">#{order.id.slice(0, 8)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={order.status} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${
                          age > 20 ? 'text-danger' : age > 10 ? 'text-orange-500' : 'text-muted-foreground'
                        }`}>
                          <Clock3 className="h-3 w-3" />
                          {age} min
                          {age > 20 ? ' (SLA breached!)' : ''}
                        </span>
                      </div>
                    </div>
                    {age > 20 && <AlertTriangle className="h-5 w-5 text-danger animate-pulse" />}
                  </div>

                  {/* Items List */}
                  <div className="px-5 py-4 space-y-3 border-b border-border">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground font-bold">
                            {item.quantity}x
                          </span>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Notes & Customer */}
                  <div className="px-5 py-3 border-b border-border bg-secondary/5">
                    {order.notes ? (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-bold uppercase text-[10px]">Notes: </span>
                        {order.notes}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground/50 italic">No special instructions</p>
                    )}
                    {order.customer?.name && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-bold uppercase text-[10px]">For: </span>
                        {order.customer.name}
                      </p>
                    )}
                  </div>

                  {/* Estimated Prep */}
                  <div className="px-5 py-3 border-b border-border flex items-center gap-2 text-xs text-muted-foreground">
                    <TimerReset className="h-3.5 w-3.5" />
                    <span>Est. total prep: <strong className="text-foreground">{totalPrepTime} min</strong></span>
                    {order.items.some((i) => !(i as any).prepTimeMinutes) && (
                      <span className="text-[9px] text-muted-foreground/60">(defaults used for some items)</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-5 py-4 flex gap-3">
                    {actions.map((action) => (
                      <Button
                        key={action.nextStatus}
                        size="sm"
                        variant={action.variant ?? 'default'}
                        className="flex-1 h-10 rounded-none font-bold uppercase tracking-widest text-[10px] border border-foreground"
                        onClick={() => void handleKitchenAction(order.id, action.nextStatus)}
                      >
                        <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                        {action.label}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 rounded-none font-bold uppercase tracking-widest text-[10px] border border-border"
                      onClick={() => navigate(`/seller/orders`)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
