import { useEffect, useMemo, useState } from 'react';
import { Clock3, DollarSign, MapPin, PackageCheck, ShoppingBag, Sparkles } from 'lucide-react';
import { OrderRouteMap } from '@/components/maps/OrderRouteMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Order } from '@/types';
import { formatCurrency } from '@/utils/helpers';
import { MetricCard } from '@/components/layout/MetricCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/status-badge';
import { getOrders } from '@/services/orderService';

export function SellerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await getOrders({ page: 1, limit: 20 });
        setOrders(response.data);
        setError(null);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load orders');
      }
    };

    void loadOrders();

    const intervalId = window.setInterval(() => {
      void loadOrders();
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

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
    <div className="page-stack">
      <PageHeader
        eyebrow="Seller"
        title="Dashboard"
        description="Today’s order volume, active work, and recent tickets all sit on one surface so the next action is obvious."
      />

      <section className="grid gap-5 md:grid-cols-3">
        <MetricCard
          label="Today's orders"
          value={metrics.todaysOrders}
          description="Orders placed since midnight"
          icon={<ShoppingBag className="h-5 w-5" />}
        />
        <MetricCard
          label="Active orders"
          value={metrics.activeOrders}
          description="Still in progress right now"
          icon={<Clock3 className="h-5 w-5" />}
        />
        <MetricCard
          label="Delivered revenue"
          value={formatCurrency(metrics.revenue)}
          description="Completed order value"
          icon={<DollarSign className="h-5 w-5" />}
        />
      </section>

      {error ? (
        <Card>
          <CardContent className="p-5 text-sm text-[color:var(--color-danger)]">{error}</CardContent>
        </Card>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Placed</TableHead>
                  <TableHead>Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 10).map((order) => (
                  <TableRow
                    key={order.id}
                    className={`cursor-pointer ${
                      order.id === selectedOrderId
                        ? 'bg-[color:var(--color-primary-soft)]/60'
                        : ''
                    }`}
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <TableCell className="font-semibold">#{order.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="max-w-[220px] truncate" title={order.deliveryAddress}>
                      {order.deliveryAddress}
                    </TableCell>
                  </TableRow>
                ))}
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-[color:var(--color-text-soft)]"
                    >
                      No orders found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {selectedOrder ? (
            <OrderRouteMap
              order={selectedOrder}
              title={`Order map #${selectedOrder.id.slice(0, 8)}`}
              description="Track the delivery address pin, your shop location, and rider progress from the seller dashboard."
              compact
            />
          ) : (
            <Card>
              <CardContent className="p-5 text-sm text-[color:var(--color-text-soft)]">
                Select an order to view its map.
              </CardContent>
            </Card>
          )}

          {selectedOrder ? (
            <Card>
              <CardContent className="space-y-4 p-5">
                <div>
                  <p className="eyebrow">Focused order</p>
                  <h2 className="mt-2 text-2xl font-semibold">#{selectedOrder.id.slice(0, 8)}</h2>
                  <p className="mt-2 subtle-copy">
                    Keep the right side useful: this card surfaces the next checkpoint instead of leaving the map column empty.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <div className="panel-muted flex items-center gap-3 px-4 py-4">
                    <DollarSign className="h-4 w-4 text-[color:var(--color-primary-dark)]" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                        Amount
                      </p>
                      <p className="text-sm font-semibold text-[color:var(--color-text)]">
                        {formatCurrency(selectedOrder.totalAmount)}
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
                        {selectedOrder.items.length} items
                      </p>
                    </div>
                  </div>
                  <div className="panel-muted flex items-center gap-3 px-4 py-4">
                    <Clock3 className="h-4 w-4 text-[color:var(--color-primary-dark)]" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                        Placed
                      </p>
                      <p className="text-sm font-semibold text-[color:var(--color-text)]">
                        {new Date(selectedOrder.createdAt).toLocaleDateString()}
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
                  <div className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 text-[color:var(--color-primary-dark)]" />
                    <p className="text-sm text-[color:var(--color-text-soft)]">{nextCheckpoint}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>
    </div>
  );
}
