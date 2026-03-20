import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { getOrder, updateOrderStatus } from '../../services/orderService';
import { Order } from '../../types';
import { ORDER_STATUS_LABELS } from '../../utils/constants';
import { formatCurrency } from '../../utils/helpers';

const timeline: string[] = [
  'pending',
  'accepted',
  'preparing',
  'ready_for_pickup',
  'picked_up',
  'delivering',
  'delivered',
];

export function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const refreshOrder = async () => {
      if (!id) {
        return;
      }
      setIsLoading(true);
      try {
        const response = await getOrder(id);
        setOrder(response);
        setError(null);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load order');
      } finally {
        setIsLoading(false);
      }
    };
    
    void refreshOrder();
  }, [id]);

  const cancelOrder = async () => {
    if (!order) {
      return;
    }
    setIsCancelling(true);
    try {
      const updated = await updateOrderStatus(order.id, 'cancelled');
      setOrder(updated);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading || !order) {
    return <Card>{error ?? 'Loading order...'}</Card>;
  }

  const currentStep = timeline.indexOf(order.status);

  return (
    <section className="space-y-5">
      <Card className="space-y-3 rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">
            Order #{order.id.slice(0, 8)}
          </h1>
          <Badge>{ORDER_STATUS_LABELS[order.status] ?? order.status}</Badge>
        </div>
        <p className="text-sm text-[var(--color-text-soft)]">{order.deliveryAddress}</p>
        <p className="text-sm text-[var(--color-text-soft)]">
          Total: <strong>{formatCurrency(order.totalAmount)}</strong>
        </p>
        {order.status === 'pending' && (
          <Button
            variant="danger"
            onClick={() => void cancelOrder()}
            disabled={isCancelling}
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Order'}
          </Button>
        )}
      </Card>

      <Card className="space-y-4">
        <h2 className="text-xl font-semibold">Status Timeline</h2>
        <ol className="space-y-2">
          {timeline.map((status, index) => {
            const active = index <= currentStep;
            return (
              <li
                key={status}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  active
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-text)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-soft)]'
                }`}
              >
                {ORDER_STATUS_LABELS[status]}
              </li>
            );
          })}
        </ol>
      </Card>

      <Card className="space-y-2">
        <h2 className="text-xl font-semibold">Items</h2>
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <span>
              {item.quantity}x {item.name}
            </span>
            <span>{formatCurrency(item.price * item.quantity)}</span>
          </div>
        ))}
      </Card>
    </section>
  );
}
