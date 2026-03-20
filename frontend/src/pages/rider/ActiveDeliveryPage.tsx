import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { getOrder } from '../../services/orderService';
import { updateDeliveryStatus } from '../../services/riderService';
import { Order } from '../../types';

const transitions: Record<string, Array<'picked_up' | 'delivering' | 'delivered'>> = {
  ready_for_pickup: ['picked_up'],
  picked_up: ['delivering'],
  delivering: ['delivered'],
};

export function ActiveDeliveryPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
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
    };

    void loadOrder();
  }, [id]);

  const changeStatus = async (status: 'picked_up' | 'delivering' | 'delivered') => {
    if (!order) {
      return;
    }

    try {
      const updated = await updateDeliveryStatus(order.id, status);
      setOrder(updated);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to update delivery');
    }
  };

  if (!order) {
    return <Card>{error ?? 'Loading delivery...'}</Card>;
  }

  const actions = transitions[order.status] ?? [];

  return (
    <section className="space-y-4">
      <Card className="space-y-2">
        <h1 className="text-2xl font-semibold">Delivery #{order.id.slice(0, 8)}</h1>
        <p className="text-sm text-[var(--color-text-soft)]">{order.deliveryAddress}</p>
        <p className="text-sm text-[var(--color-text-soft)]">Status: {order.status}</p>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-xl font-semibold">Update Status</h2>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button key={action} onClick={() => void changeStatus(action)}>
              {action}
            </Button>
          ))}
          {actions.length === 0 && <p className="text-sm text-[var(--color-text-soft)]">No further actions.</p>}
        </div>
      </Card>

      <Link
        className="inline-flex rounded-xl border border-[var(--color-border-strong)] px-4 py-2 text-sm font-medium"
        to="/rider"
      >
        Back to dashboard
      </Link>
    </section>
  );
}
