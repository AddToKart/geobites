import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, MapPin, PackageCheck, Search, XCircle, Bike } from 'lucide-react';
import { LazyOrderRouteMap } from '@/components/maps/LazyOrderRouteMap';
import { Button } from '../../components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { useVisiblePolling } from '@/hooks/useVisiblePolling';
import { getOrders, updateOrderStatus, verifyManualPayment } from '../../services/orderService';
import { Order } from '../../types';
import { ORDER_STATUS_LABELS } from '../../utils/constants';
import { formatCurrency } from '../../utils/helpers';
import { toast } from 'sonner';

const sellerActions: Record<string, Array<'accepted' | 'rejected' | 'preparing' | 'ready_for_pickup'>> = {
  pending: ['accepted', 'rejected'],
  accepted: ['preparing'],
  preparing: ['ready_for_pickup'],
};

const actionStatuses = ['pending'];
const kitchenStatuses = ['accepted', 'preparing', 'ready_for_pickup'];
const closedStatuses = ['picked_up', 'delivering', 'delivered', 'rejected', 'cancelled'];

function SellerOrderCard({
  order,
  isSelected,
  onSelect,
  onAction,
}: {
  order: Order;
  isSelected: boolean;
  onSelect: () => void;
  onAction: (status: 'accepted' | 'rejected' | 'preparing' | 'ready_for_pickup') => void;
}) {
  const actions = sellerActions[order.status] ?? [];

  return (
    <div
      className={`cursor-pointer border border-border p-4 bg-background transition-colors ${
        isSelected
          ? 'border-l-4 border-l-primary bg-secondary/5 pl-3'
          : 'hover:bg-secondary/5'
      }`}
      onClick={onSelect}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">#{order.id.slice(0, 8)}</h3>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 h-3.5 w-3.5 text-primary shrink-0" />
              <span className="line-clamp-2">{order.deliveryAddress}</span>
            </div>
          </div>
          <p className="text-sm font-bold text-foreground">
            {formatCurrency(order.totalAmount)}
          </p>
        </div>

        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {actions.map((status) => (
              <Button
                key={status}
                size="sm"
                variant={status === 'rejected' ? 'outline' : 'default'}
                className={`h-8 rounded-none border border-foreground font-bold uppercase tracking-widest text-[10px] ${
                  status === 'rejected'
                    ? 'text-danger border-danger hover:bg-danger/5'
                    : ''
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  onAction(status);
                }}
              >
                {status === 'rejected' ? (
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                )}
                {ORDER_STATUS_LABELS[status]}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/75">
            No seller action required
          </p>
        )}
      </div>
    </div>
  );
}

export function OrderManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const response = await getOrders({ page: 1, limit: 30 });
      setOrders(response.data);
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load orders');
    }
  }, []);

  useVisiblePolling(loadOrders, 10000);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const changeStatus = async (
    order: Order,
    status: 'accepted' | 'rejected' | 'preparing' | 'ready_for_pickup',
  ) => {
    try {
      await updateOrderStatus(order.id, status);
      await loadOrders();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to update status');
    }
  };

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (!normalizedSearch) return true;
      return [order.id, order.deliveryAddress, order.vendor?.name]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch));
    });
  }, [orders, search]);

  const pendingOrders = filteredOrders.filter((order) => actionStatuses.includes(order.status));
  const kitchenOrders = filteredOrders.filter((order) => kitchenStatuses.includes(order.status));
  const closedOrders = filteredOrders.filter((order) => closedStatuses.includes(order.status));

  useEffect(() => {
    if (filteredOrders.length === 0) {
      setSelectedOrderId(null);
      return;
    }
    if (!selectedOrderId || !filteredOrders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(filteredOrders[0].id);
    }
  }, [filteredOrders, selectedOrderId]);

  const selectedOrder = filteredOrders.find((order) => order.id === selectedOrderId) ?? null;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        {/* Editorial Header */}
        <div className="border-b-2 border-foreground pb-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Seller</p>
            <h1 className="text-6xl md:text-8xl font-medium tracking-tighter leading-[0.9] mb-4">Order management.</h1>
            <p className="text-xl text-muted-foreground mt-4 max-w-xl">
              Orders grouped by what needs attention, what's in the kitchen, and what's complete.
            </p>
          </div>
        </div>

        {error ? (
          <div className="border-l-4 border-[color:var(--color-danger)] bg-[color:var(--color-danger-soft)]/20 px-6 py-4 text-sm text-[color:var(--color-danger)] mb-8">
            {error}
          </div>
        ) : null}

        {/* Flat Stat Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border border-b border-border py-8 mb-12">
          <div className="px-6 py-4 md:py-0 flex flex-col justify-between first:pl-0 last:pr-0">
            <span className="text-5xl md:text-7xl font-medium tracking-tighter text-foreground">
              {pendingOrders.length}
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2 block">
                Needs action
              </span>
              <p className="text-xs text-muted-foreground/70 mt-1">Pending orders waiting decision</p>
            </div>
          </div>
          <div className="px-6 py-4 md:py-0 flex flex-col justify-between">
            <span className="text-5xl md:text-7xl font-medium tracking-tighter text-foreground">
              {kitchenOrders.length}
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2 block">
                Kitchen flow
              </span>
              <p className="text-xs text-muted-foreground/70 mt-1">Accepted and prep in progress</p>
            </div>
          </div>
          <div className="px-6 py-4 md:py-0 flex flex-col justify-between first:pl-0 last:pr-0">
            <span className="text-5xl md:text-7xl font-medium tracking-tighter text-foreground">
              {closedOrders.length}
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2 block">
                Closed / handed off
              </span>
              <p className="text-xs text-muted-foreground/70 mt-1">Completed or cancelled runs</p>
            </div>
          </div>
        </div>

        {/* Search Header */}
        <div className="border-b border-border pb-8 mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
            <div>
              <h2 className="text-2xl font-medium tracking-tighter">Order Lanes</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Search by order ID or address, then move orders forward.
              </p>
            </div>
          </div>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by order or address..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-14 border-0 border-b rounded-none bg-transparent pl-8 shadow-none focus-visible:ring-0 focus-visible:border-foreground"
            />
          </label>
        </div>

        {/* 3-Column Kanban Grid */}
        <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-8 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border">
            {([
              {
                title: 'Needs action',
                description: 'Pending orders waiting on an accept or reject decision.',
                orders: pendingOrders,
              },
              {
                title: 'Kitchen flow',
                description: 'Accepted, preparing, and ready-for-pickup orders.',
                orders: kitchenOrders,
              },
              {
                title: 'Closed / handoff',
                description: 'Picked up, delivered, or otherwise finished orders.',
                orders: closedOrders,
              },
            ] as Array<{ title: string; description: string; orders: Order[] }>).map((column, idx) => (
              <div key={column.title} className={`space-y-6 ${idx === 0 ? 'lg:pr-4' : idx === 2 ? 'lg:pl-4' : 'lg:px-4'}`}>
                <div className="border-b border-border pb-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">{column.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{column.description}</p>
                </div>

                <div className="space-y-4">
                  {column.orders.length === 0 ? (
                    <div className="border border-dashed border-border p-6 text-center text-xs text-muted-foreground bg-secondary/5">
                      No orders in this lane.
                    </div>
                  ) : (
                    column.orders.map((order) => (
                      <SellerOrderCard
                        key={order.id}
                        order={order}
                        isSelected={order.id === selectedOrderId}
                        onSelect={() => setSelectedOrderId(order.id)}
                        onAction={(status) => void changeStatus(order, status)}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Details Sidebar */}
          <div className="space-y-6">
            {selectedOrder ? (
              <>
                <div className="border border-border p-4 bg-background">
                  <LazyOrderRouteMap
                    order={selectedOrder}
                    title={`Focused order #${selectedOrder.id.slice(0, 8)}`}
                    description="Route map and key details for the selected order."
                    compact
                  />
                </div>

                <div className="border border-border p-6 bg-background space-y-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Order detail</p>
                    <h2 className="mt-2 text-3xl font-medium tracking-tighter">#{selectedOrder.id.slice(0, 8)}</h2>
                  </div>

                  <div className="grid gap-4">
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
                          Status
                        </p>
                        <p className="text-base font-semibold text-foreground">
                          {ORDER_STATUS_LABELS[selectedOrder.status]}
                        </p>
                      </div>
                    </div>
                    <div className="border border-border flex items-center gap-3 px-4 py-4 bg-secondary/5">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                          Amount
                        </p>
                        <p className="text-base font-semibold text-foreground">
                          {formatCurrency(selectedOrder.totalAmount)}
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
                    <p className="text-xs text-muted-foreground border-t border-border/60 pt-3">
                      {selectedOrder.notes || 'No customer notes were added to this order.'}
                    </p>
                  </div>

                  {/* Payment Details Panel */}
                  <div className="border border-border space-y-4 px-4 py-4 bg-secondary/5">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Payment Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between border-b border-border/40 pb-2">
                        <span className="text-muted-foreground">Method:</span>
                        <span className="font-semibold">{selectedOrder.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between border-b border-border/40 pb-2">
                        <span className="text-muted-foreground">Status:</span>
                        <span className={`font-bold ${selectedOrder.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-orange-500'}`}>
                          {selectedOrder.paymentStatus.toUpperCase()}
                        </span>
                      </div>
                      {selectedOrder.paymentMethod !== 'COD' && (
                        <div className="flex justify-between pt-2">
                          <span className="text-muted-foreground">Ref Number:</span>
                          <span className="font-mono font-bold text-foreground">
                            {selectedOrder.paymentSessionId || 'None'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Verification Button for Sellers */}
                    {selectedOrder.paymentMethod !== 'COD' && selectedOrder.paymentStatus === 'pending' && (
                      <Button
                        size="sm"
                        className="w-full mt-2 rounded-none font-bold uppercase tracking-widest text-xs border border-foreground bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                        onClick={async () => {
                          try {
                            await verifyManualPayment(selectedOrder.id);
                            toast.success("Payment verified successfully!");
                            void loadOrders();
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : "Failed to verify payment");
                          }
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Confirm Manual Payment
                      </Button>
                    )}
                  </div>

                  {/* Rider Status Panel */}
                  {selectedOrder.status !== 'pending' &&
                    selectedOrder.status !== 'rejected' &&
                    selectedOrder.status !== 'cancelled' && (
                      <div className="border border-border space-y-3 px-4 py-4 bg-secondary/5">
                        <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                          <Bike className="h-4 w-4 text-primary shrink-0" />
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Rider status
                          </h4>
                        </div>

                        {selectedOrder.riderId ? (
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Rider ID</span>
                              <span className="font-mono text-xs font-bold text-primary">
                                #{selectedOrder.riderId.slice(0, 8).toUpperCase()}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                              A rider has claimed this delivery from the booking pool.
                            </p>
                          </div>
                        ) : selectedOrder.status === 'accepted' ? (
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-primary animate-pulse">
                              Waiting for a rider...
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              This order is in the global booking pool. Any available rider can claim it.
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Rider will be assigned once you accept and the order enters the pool.
                          </p>
                        )}
                      </div>
                    )}
                </div>
              </>
            ) : (
              <div className="border border-border p-8 text-center text-sm text-muted-foreground bg-secondary/5">
                Select an order to view its details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
