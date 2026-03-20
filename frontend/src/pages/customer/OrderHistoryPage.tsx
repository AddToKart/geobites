import { useEffect, useState } from 'react';
import { OrderCard } from '../../components/custom/OrderCard';
import { Card } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
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

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-44" />
        ))}
      </div>
    );
  }

  if (error) {
    return <Card>{error}</Card>;
  }

  if (orders.length === 0) {
    return (
      <Card>
        <h1 className="text-xl font-semibold">No orders yet</h1>
        <p className="mt-2 text-sm text-[var(--color-text-soft)]">
          Your past and active orders will appear here.
        </p>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold text-[var(--color-text)]">My Orders</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </section>
  );
}
