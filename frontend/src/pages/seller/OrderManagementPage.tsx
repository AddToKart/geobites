import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, MapPin, PackageCheck, Search, XCircle, Bike } from 'lucide-react';
import { LazyOrderRouteMap } from '@/components/maps/LazyOrderRouteMap';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/PageHeader';
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
      className={
        isSelected
          ? 'space-y-4 rounded-[22px] border border-[rgba(235,106,45,0.18)] bg-[color:var(--color-primary-soft)] px-4 py-4'
          : 'panel-muted space-y-4 px-4 py-4'
      }
      onClick={onSelect}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">#{order.id.slice(0, 8)}</h3>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex items-start gap-2 text-sm text-[color:var(--color-text-soft)]">
            <MapPin className="mt-0.5 h-4 w-4 text-[color:var(--color-primary-dark)]" />
            <span>{order.deliveryAddress}</span>
          </div>
        </div>
        <p className="text-sm font-semibold text-[color:var(--color-text)]">
          {formatCurrency(order.totalAmount)}
        </p>
      </div>

      {actions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {actions.map((status) => (
            <Button
              key={status}
              size="sm"
              variant={status === 'rejected' ? 'ghost' : 'default'}
              className={
                status === 'rejected'
                  ? 'text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-soft)]'
                  : ''
              }
              onClick={(event) => {
                event.stopPropagation();
                onAction(status);
              }}
            >
              {status === 'rejected' ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {ORDER_STATUS_LABELS[status]}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[color:var(--color-text-soft)]">No seller action required right now.</p>
      )}
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
    <div className="page-stack">
      <PageHeader
        eyebrow="Seller"
        title="Order management"
        description="Orders grouped by what needs attention, what's in the kitchen, and what's complete."
      />

      {error ? (
        <Card>
          <CardContent className="p-5 text-sm text-[color:var(--color-danger)]">{error}</CardContent>
        </Card>
      ) : null}

      <section className="grid gap-5 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[color:var(--color-text-soft)]">Needs action</p>
            <p className="mt-2 text-3xl font-semibold">{pendingOrders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[color:var(--color-text-soft)]">Kitchen flow</p>
            <p className="mt-2 text-3xl font-semibold">{kitchenOrders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[color:var(--color-text-soft)]">Closed / handed off</p>
            <p className="mt-2 text-3xl font-semibold">{closedOrders.length}</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">Order lanes</h2>
              <p className="subtle-copy">
                Search by order ID or address, then move orders forward with one tap.
              </p>
            </div>
          </div>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-text-light)]" />
            <Input
              placeholder="Search by order or address"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-11"
            />
          </label>
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-5 lg:grid-cols-3">
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
          ] as Array<{ title: string; description: string; orders: Order[] }>).map((column) => (
            <Card key={column.title}>
              <CardContent className="space-y-4 p-5">
                <div>
                  <h2 className="text-xl font-semibold">{column.title}</h2>
                  <p className="mt-2 subtle-copy">{column.description}</p>
                </div>

                <div className="space-y-4">
                  {column.orders.length === 0 ? (
                    <div className="rounded-[20px] border border-dashed border-[color:var(--color-border)] px-4 py-5 text-sm text-[color:var(--color-text-soft)]">
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
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          {selectedOrder ? (
            <>
              <LazyOrderRouteMap
                order={selectedOrder}
                title={`Focused order #${selectedOrder.id.slice(0, 8)}`}
                description="Route map and key details for the selected order."
                compact
              />

              <Card>
                <CardContent className="space-y-4 p-5">
                  <div>
                    <p className="eyebrow">Order detail</p>
                    <h2 className="mt-2 text-2xl font-semibold">#{selectedOrder.id.slice(0, 8)}</h2>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                    <div className="panel-muted flex items-center gap-3 px-4 py-4">
                      <PackageCheck className="h-4 w-4 text-[color:var(--color-primary-dark)]" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                          Items
                        </p>
                        <p className="text-sm font-semibold text-[color:var(--color-text)]">
                          {selectedOrder.items.length} items
                        </p>
                      </div>
                    </div>
                    <div className="panel-muted flex items-center gap-3 px-4 py-4">
                      <Clock3 className="h-4 w-4 text-[color:var(--color-primary-dark)]" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                          Status
                        </p>
                        <p className="text-sm font-semibold text-[color:var(--color-text)]">
                          {ORDER_STATUS_LABELS[selectedOrder.status]}
                        </p>
                      </div>
                    </div>
                    <div className="panel-muted flex items-center gap-3 px-4 py-4">
                      <CheckCircle2 className="h-4 w-4 text-[color:var(--color-primary-dark)]" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                          Amount
                        </p>
                        <p className="text-sm font-semibold text-[color:var(--color-text)]">
                          {formatCurrency(selectedOrder.totalAmount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="panel-muted space-y-3 px-4 py-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 text-[color:var(--color-primary-dark)]" />
                      <p className="text-sm text-[color:var(--color-text-soft)]">
                        {selectedOrder.deliveryAddress}
                      </p>
                    </div>
                    <p className="text-sm text-[color:var(--color-text-soft)]">
                      {selectedOrder.notes || 'No customer notes were added to this order.'}
                    </p>
                  </div>

                  {/* Payment Details Panel */}
                  <div className="panel-muted space-y-4 px-4 py-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]">
                      Payment Details
                    </h4>
                    <div className="space-y-2 text-sm text-[color:var(--color-text)]">
                      <div className="flex justify-between">
                        <span className="text-[color:var(--color-text-soft)]">Method:</span>
                        <span className="font-semibold">{selectedOrder.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[color:var(--color-text-soft)]">Status:</span>
                        <span className={`font-bold ${selectedOrder.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-orange-500'}`}>
                          {selectedOrder.paymentStatus.toUpperCase()}
                        </span>
                      </div>
                      {selectedOrder.paymentMethod !== 'COD' && (
                        <div className="flex justify-between border-t border-border pt-2">
                          <span className="text-[color:var(--color-text-soft)]">Ref Number:</span>
                          <span className="font-mono font-bold text-text-soft">
                            {selectedOrder.paymentSessionId || 'None'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Verification Button for Sellers */}
                    {selectedOrder.paymentMethod !== 'COD' && selectedOrder.paymentStatus === 'pending' && (
                      <Button
                        size="sm"
                        className="w-full mt-2 font-bold bg-primary hover:bg-primary-dark text-primary-foreground rounded-[16px] shadow-sm gap-2"
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
                        <CheckCircle2 className="h-4 w-4" />
                        Confirm GCash/Maya Payment
                      </Button>
                    )}
                  </div>

                  {/* Rider Status Panel — shows booking pool status */}
                  {selectedOrder.status !== 'pending' &&
                    selectedOrder.status !== 'rejected' &&
                    selectedOrder.status !== 'cancelled' && (
                      <div className="panel-muted space-y-3 px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Bike className="h-4 w-4 text-[color:var(--color-primary-dark)]" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]">
                            Rider status
                          </h4>
                        </div>

                        {selectedOrder.riderId ? (
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-[color:var(--color-text-soft)]">Rider ID</span>
                              <span className="font-mono text-xs font-bold text-[color:var(--color-primary)]">
                                #{selectedOrder.riderId.slice(0, 8).toUpperCase()}
                              </span>
                            </div>
                            <p className="text-xs text-[color:var(--color-text-muted)] pt-1">
                              A rider has claimed this delivery from the booking pool.
                            </p>
                          </div>
                        ) : selectedOrder.status === 'accepted' ? (
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-[color:var(--color-primary)] animate-pulse">
                              Waiting for a rider...
                            </p>
                            <p className="text-xs text-[color:var(--color-text-muted)]">
                              This order is in the global booking pool. Any available rider can claim it.
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-[color:var(--color-text-muted)]">
                            Rider will be assigned once you accept and the order enters the pool.
                          </p>
                        )}
                      </div>
                    )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-5 text-sm text-[color:var(--color-text-soft)]">
                Select an order to view its details.
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
