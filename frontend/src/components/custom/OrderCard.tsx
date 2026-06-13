import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, MapPin, Package2 } from 'lucide-react';
import { Order } from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { StatusBadge } from '../ui/status-badge';

export function OrderCard({ order }: { order: Order }) {
  return (
    <article className="border border-border p-8 bg-background flex flex-col justify-between hover:bg-secondary/5 transition-colors group">
      <div>
        <div className="flex items-start justify-between mb-8">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Order
            </p>
            <h3 className="text-3xl font-medium tracking-tighter group-hover:text-primary transition-colors">#{order.id.slice(0, 8)}</h3>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>{formatDate(order.createdAt)}</span>
          </div>
          <div className="flex items-start gap-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5" />
            <span className="line-clamp-2">{order.deliveryAddress}</span>
          </div>
          <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            <Package2 className="h-4 w-4" />
            <span>{order.items.length} item(s)</span>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between border-t border-border pt-6 mt-auto">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Total
          </p>
          <p className="text-2xl font-medium tracking-tighter text-foreground">
            {formatCurrency(order.totalAmount)}
          </p>
        </div>
        <Link
          to={`/orders/${order.id}`}
          className="text-xs font-bold uppercase tracking-widest text-foreground hover:text-primary transition-colors flex items-center gap-2"
        >
          View details
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
        </Link>
      </div>
    </article>
  );
}
