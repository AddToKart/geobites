import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { acceptDelivery, getDeliveries } from '../../services/riderService';
import { Order } from '../../types';

export function RiderDashboard() {
  const [available, setAvailable] = useState<Order[]>([]);
  const [active, setActive] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [availableOrders, activeOrders] = await Promise.all([
        getDeliveries('available'),
        getDeliveries('active'),
      ]);
      setAvailable(availableOrders);
      setActive(activeOrders);
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load deliveries');
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const accept = async (orderId: string) => {
    try {
      await acceptDelivery(orderId);
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to accept delivery');
    }
  };

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold text-[var(--color-text)]">Rider Dashboard</h1>
      {error && <Card className="text-sm text-[var(--color-danger)]">{error}</Card>}

      <Card className="space-y-3">
        <h2 className="text-xl font-semibold">Available Deliveries</h2>
        {available.map((order) => (
          <div
            key={order.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3"
          >
            <div>
              <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
              <p className="text-sm text-[var(--color-text-soft)]">{order.deliveryAddress}</p>
            </div>
            <Button size="sm" onClick={() => void accept(order.id)}>
              Accept
            </Button>
          </div>
        ))}
        {available.length === 0 && (
          <p className="text-sm text-[var(--color-text-soft)]">No available deliveries.</p>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-xl font-semibold">My Active Deliveries</h2>
        {active.map((order) => (
          <div
            key={order.id}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3"
          >
            <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
            <p className="text-sm text-[var(--color-text-soft)]">Status: {order.status}</p>
          </div>
        ))}
        {active.length === 0 && (
          <p className="text-sm text-[var(--color-text-soft)]">No active deliveries.</p>
        )}
      </Card>
    </section>
  );
}
