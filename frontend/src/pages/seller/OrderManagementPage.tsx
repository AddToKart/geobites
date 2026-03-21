import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/status-badge';
import { getOrders, updateOrderStatus } from '../../services/orderService';
import { Order } from '../../types';
import { ORDER_STATUS_LABELS } from '../../utils/constants';
import { formatCurrency } from '../../utils/helpers';

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

  const pendingCount = useMemo(
    () => orders.filter((order) => order.status === 'pending').length,
    [orders],
  );

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Seller"
        title="Order management"
        description="Every order card keeps the status visible and only exposes the actions that make sense next."
      />

      {error ? (
        <Card>
          <CardContent className="p-5 text-sm text-[color:var(--color-danger)]">{error}</CardContent>
        </Card>
      ) : null}

      <section className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[color:var(--color-text-soft)]">Total orders</p>
            <p className="mt-2 text-3xl font-semibold">{orders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[color:var(--color-text-soft)]">Awaiting action</p>
            <p className="mt-2 text-3xl font-semibold">{pendingCount}</p>
          </CardContent>
        </Card>
      </section>

      <div className="space-y-4">
        {orders.map((order) => {
          const actions = sellerActions[order.status] ?? [];

          return (
            <Card key={order.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-semibold">#{order.id.slice(0, 8)}</h2>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-[color:var(--color-text-soft)]">{order.deliveryAddress}</p>
                    <p className="text-sm text-[color:var(--color-text-muted)]">
                      {formatCurrency(order.totalAmount)}
                    </p>
                  </div>
                </div>

                {actions.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {actions.map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={status === 'rejected' ? 'ghost' : 'default'}
                        className={status === 'rejected' ? 'text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-soft)]' : ''}
                        onClick={() => void changeStatus(order, status)}
                      >
                        {status === 'rejected' ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        {ORDER_STATUS_LABELS[status]}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[color:var(--color-text-soft)]">
                    No seller action required right now.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
