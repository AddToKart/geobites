import { useEffect, useState } from 'react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { getOrders, updateOrderStatus } from '../../services/orderService';
import { Order } from '../../types';
import { ORDER_STATUS_LABELS } from '../../utils/constants';

const sellerActions: Record<string, Array<'accepted' | 'rejected' | 'preparing' | 'ready_for_pickup'>> = {
  pending: ['accepted', 'rejected'],
  accepted: ['preparing'],
  preparing: ['ready_for_pickup'],
};

export function OrderManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      const response = await getOrders({ page: 1, limit: 30 });
      setOrders(response.data);
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load orders');
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

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

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold text-[var(--color-text)]">Order Management</h1>
      {error && <Card className="text-sm text-[var(--color-danger)]">{error}</Card>}

      <div className="space-y-3">
        {orders.map((order) => {
          const actions = sellerActions[order.status] ?? [];
          return (
            <Card key={order.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-[var(--color-text-soft)]">{order.deliveryAddress}</p>
                </div>
                <Badge>{ORDER_STATUS_LABELS[order.status]}</Badge>
              </div>
              {actions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {actions.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={status === 'rejected' ? 'danger' : 'secondary'}
                      onClick={() => void changeStatus(order, status)}
                    >
                      {ORDER_STATUS_LABELS[status]}
                    </Button>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
