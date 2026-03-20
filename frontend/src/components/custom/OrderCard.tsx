import { Link } from 'react-router-dom';
import { Order } from '../../types';
import { ORDER_STATUS_LABELS } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' {
  if (status === 'delivered') {
    return 'success';
  }
  if (status === 'rejected' || status === 'cancelled') {
    return 'danger';
  }
  if (status === 'pending' || status === 'ready_for_pickup') {
    return 'warning';
  }
  return 'default';
}

export function OrderCard({ order }: { order: Order }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
          <p className="mt-1 text-sm text-[var(--color-text-soft)]">{formatDate(order.createdAt)}</p>
        </div>
        <Badge variant={statusVariant(order.status)}>
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-[var(--color-text-soft)]">
          <span>{order.items.length} item(s)</span>
          <span className="font-semibold text-[var(--color-text)]">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>
        <Link
          to={`/orders/${order.id}`}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-[var(--color-border-strong)] px-4 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-2)]"
        >
          View Order
        </Link>
      </CardContent>
    </Card>
  );
}
