import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock3, MapPin, PackageCheck, Sparkles, Phone, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { LazyOrderRouteMap } from '@/components/maps/LazyOrderRouteMap';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useRiderLocationTracking } from '@/hooks/useRiderLocationTracking';
import { PageHeader } from '@/components/layout/PageHeader';
import { Reveal } from '@/components/motion/Reveal';
import { StatusBadge } from '@/components/ui/status-badge';
import { useVisiblePolling } from '@/hooks/useVisiblePolling';
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
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleCheckedItem = (itemId: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };


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
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load delivery');
      }
    },
    15000,
    { enabled: Boolean(id) },
  );

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

  const nextActionMessage = useMemo(() => {
    if (!order) return 'Wait for the next valid rider step.';
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
  }, [order]);

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
        <Reveal className="space-y-6">
          <LazyOrderRouteMap
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
        </Reveal>

        <Reveal className="space-y-4" delay={0.1}>
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

              {order.deliveryLat && order.deliveryLng && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${order.deliveryLat},${order.deliveryLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 bg-secondary text-foreground border border-border hover:bg-secondary/80 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest mt-2"
                >
                  <MapPin className="w-4 h-4 text-primary" /> Open Waze / Google Maps
                </a>
              )}

              <Button variant="ghost" className="w-full" asChild>
                <Link to="/rider">Back to dashboard</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Verification Checklist */}
          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="eyebrow flex items-center gap-2"><PackageCheck className="w-3.5 h-3.5 text-primary" /> Inventory Check</p>
                <h2 className="mt-2 text-2xl font-semibold">Bag Verification</h2>
                <p className="subtle-copy">Verify items with kitchen staff before leaving.</p>
              </div>

              <div className="space-y-2 mt-4">
                {order.items.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 p-3 border border-border bg-secondary/5 hover:bg-secondary/10 transition-colors cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(checkedItems[item.id])}
                      onChange={() => toggleCheckedItem(item.id)}
                      className="h-4 w-4 rounded-none accent-primary border-border focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className={`text-sm font-semibold text-[color:var(--color-text)] ${checkedItems[item.id] ? 'line-through text-muted-foreground' : ''}`}>
                        {item.quantity}x {item.name}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Support & Quick Contact */}
          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="eyebrow flex items-center gap-2"><Smartphone className="w-3.5 h-3.5 text-primary" /> Communications</p>
                <h2 className="mt-2 text-2xl font-semibold font-sans">Contact Parties</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => toast.success(`Calling Kitchen: ${order.vendor?.name || "Seller"} (${order.vendorPhone || "N/A"})`)}
                  className="flex items-center justify-center gap-2 h-12 text-xs font-bold uppercase tracking-widest border border-border rounded-none"
                >
                  <Phone className="w-3.5 h-3.5 text-primary" /> Kitchen
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => toast.success(`Calling Customer: ${order.customerName || "Client"} (${order.customerPhone || "N/A"})`)}
                  className="flex items-center justify-center gap-2 h-12 text-xs font-bold uppercase tracking-widest border border-border rounded-none"
                >
                  <Phone className="w-3.5 h-3.5 text-primary" /> Customer
                </Button>
              </div>
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
                <Clock3 className="mt-0.5 h-4 w-4 text-[color:var(--color-primary-dark)] animate-pulse" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Customer Notes</p>
                  <p className="text-sm text-[color:var(--color-text-soft)]">
                    {order.notes || 'No customer notes were added to this delivery.'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 text-[color:var(--color-primary-dark)]" />
                <p className="text-sm text-[color:var(--color-text-soft)]">
                  Use the checkpoint timeline to follow standard rider guidelines.
                </p>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
