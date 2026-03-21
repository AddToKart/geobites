import { useEffect, useMemo, useState } from 'react';
import { Clock3, DollarSign, ShoppingBag } from 'lucide-react';
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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
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
      </section>
    </div>
  );
}
