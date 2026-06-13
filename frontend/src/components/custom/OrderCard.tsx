import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, MapPin, Package2 } from 'lucide-react';
import { Order } from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { Card, CardContent, CardHeader } from '../ui/card';
import { StatusBadge } from '../ui/status-badge';

export function OrderCard({ order }: { order: Order }) {
  return (
    <Card className="defer-card h-full">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
              Order
            </p>
            <h3 className="text-xl font-semibold">#{order.id.slice(0, 8)}</h3>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-4">
        <div className="grid gap-3 text-sm text-[color:var(--color-text-soft)]">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[color:var(--color-primary-dark)]" />
            <span>{formatDate(order.createdAt)}</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 text-[color:var(--color-primary-dark)]" />
            <span className="line-clamp-2">{order.deliveryAddress}</span>
          </div>
          <div className="flex items-center gap-2">
            <Package2 className="h-4 w-4 text-[color:var(--color-primary-dark)]" />
            <span>{order.items.length} item(s)</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between rounded-[18px] bg-[color:var(--color-surface-2)] px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
              Total
            </p>
            <p className="text-lg font-semibold text-[color:var(--color-text)]">
              {formatCurrency(order.totalAmount)}
            </p>
          </div>
          <Link
            to={`/orders/${order.id}`}
            className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium text-[color:var(--color-primary-dark)] shadow-[var(--shadow-soft)] transition hover:text-[color:var(--color-primary)]"
          >
            View details
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
