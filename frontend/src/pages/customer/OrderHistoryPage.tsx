import { useEffect, useMemo, useState } from 'react';
import { Clock3, PackageCheck, ShoppingBag } from 'lucide-react';
import { OrderCard } from '../../components/custom/OrderCard';
import { Card, CardContent } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { MetricCard } from '@/components/layout/MetricCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { getOrders } from '../../services/orderService';
import { Order } from '../../types';

export function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getOrders({ page: 1, limit: 20 });
        setOrders(response.data);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const metrics = useMemo(() => {
    const activeCount = orders.filter((order) =>
      ['pending', 'accepted', 'preparing', 'ready_for_pickup', 'picked_up', 'delivering'].includes(order.status),
    ).length;

    const deliveredCount = orders.filter((order) => order.status === 'delivered').length;

    return {
      total: orders.length,
      active: activeCount,
      delivered: deliveredCount,
    };
  }, [orders]);

  if (isLoading) {
    return (
      <div className="page-stack">
        <Skeleton className="h-44 rounded-[28px]" />
        <div className="grid gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-[28px]" />
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-64 rounded-[28px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Orders"
        title="Track every order in one place"
        description="Past orders, live orders, and the ones you still need to rate all stay visible without digging through noisy screens."
      />

      <section className="grid gap-5 md:grid-cols-3">
        <MetricCard
          label="Total orders"
          value={metrics.total}
          description="Everything placed from this account"
          icon={<ShoppingBag className="h-5 w-5" />}
        />
        <MetricCard
          label="Active right now"
          value={metrics.active}
          description="Still being prepared or delivered"
          icon={<Clock3 className="h-5 w-5" />}
        />
        <MetricCard
          label="Completed"
          value={metrics.delivered}
          description="Successfully delivered orders"
          icon={<PackageCheck className="h-5 w-5" />}
        />
      </section>

      {error ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[color:var(--color-danger)]">{error}</p>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <h2 className="text-2xl font-semibold">No orders yet</h2>
            <p className="mx-auto mt-3 max-w-xl subtle-copy">
              Once you place an order, status updates and delivery history will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-5 md:grid-cols-2">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </section>
      )}
    </div>
  );
}
