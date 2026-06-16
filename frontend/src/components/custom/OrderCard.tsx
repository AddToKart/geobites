import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, MapPin, Package2, PackageCheck, RefreshCw } from 'lucide-react';
import { Order } from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { StatusBadge } from '../ui/status-badge';

export const OrderCard = memo(function OrderCard({ order, onReorder, onDeliver }: { order: Order; onReorder?: () => void; onDeliver?: () => void }) {
  const address = [order.street, order.barangay].filter(Boolean).join(', ') || order.deliveryAddress || 'No address specified';

  return (
    <article className="border border-border p-8 bg-background flex flex-col justify-between hover:bg-secondary/5 transition-colors group" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 300px', contain: 'layout style paint' }}>
      <div>
        <div className="flex items-start justify-between mb-8 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Order
            </p>
            <h3 className="text-3xl font-medium tracking-tighter group-hover:text-primary transition-colors">#{order.id.slice(0, 8)}</h3>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-sm text-text-soft font-medium tracking-tight">
            <CalendarDays className="h-4.5 w-4.5 text-muted-foreground/75" />
            <span>{formatDate(order.createdAt)}</span>
          </div>
          <div className="flex items-start gap-3 text-sm text-text-soft font-medium tracking-tight">
            <MapPin className="h-4.5 w-4.5 mt-0.5 text-muted-foreground/75 shrink-0" />
            <span className="line-clamp-2 leading-relaxed">{address}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-text-soft font-medium tracking-tight">
            <Package2 className="h-4.5 w-4.5 text-muted-foreground/75" />
            <span>{order.items.length} item(s)</span>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-6 mt-auto space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Total
          </p>
          <p className="text-2xl font-medium tracking-tighter text-foreground">
            {formatCurrency(order.totalAmount)}
          </p>
        </div>
        <div className="flex gap-3">
          {onReorder && (
            <button
              onClick={(e) => { e.preventDefault(); onReorder(); }}
              className="text-xs font-bold uppercase tracking-widest flex-1 flex items-center justify-center gap-2 border border-border py-3.5 bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.5} />
              Reorder
            </button>
          )}
          {onDeliver && (
            <button
              onClick={(e) => { e.preventDefault(); onDeliver(); }}
              className="text-xs font-bold uppercase tracking-widest flex-1 flex items-center justify-center gap-2 border border-border py-3.5 bg-background hover:bg-green-600 hover:text-white hover:border-green-600 transition-colors"
            >
              <PackageCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
              Mark delivered
            </button>
          )}
          <Link
            to={`/orders/${order.id}`}
            className={`text-xs font-bold uppercase tracking-widest text-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 border border-border py-3.5 bg-background hover:bg-secondary/10 ${onReorder || onDeliver ? '' : 'w-full'}`}
          >
            View details
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </article>
  );
});
