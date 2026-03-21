import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ORDER_STATUS_LABELS } from '@/utils/constants';
import { OrderStatus } from '@/types';

const statusStyles: Record<OrderStatus, string> = {
  pending: 'bg-[color:var(--color-status-pending)] text-[color:var(--color-status-pending-text)]',
  accepted: 'bg-[color:var(--color-status-accepted)] text-[color:var(--color-status-accepted-text)]',
  preparing: 'bg-[color:var(--color-status-preparing)] text-[color:var(--color-status-preparing-text)]',
  ready_for_pickup:
    'bg-[color:var(--color-status-ready)] text-[color:var(--color-status-ready-text)]',
  picked_up: 'bg-[color:var(--color-status-picked)] text-[color:var(--color-status-picked-text)]',
  delivering: 'bg-[color:var(--color-status-accepted)] text-[color:var(--color-status-accepted-text)]',
  delivered:
    'bg-[color:var(--color-status-delivered)] text-[color:var(--color-status-delivered-text)]',
  rejected: 'bg-[color:var(--color-status-rejected)] text-[color:var(--color-status-rejected-text)]',
  cancelled:
    'bg-[color:var(--color-status-cancelled)] text-[color:var(--color-status-cancelled-text)]',
};

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <Badge
      className={cn(
        'rounded-full border-0 px-3 py-1.5 text-xs font-semibold',
        statusStyles[status],
        className,
      )}
    >
      {ORDER_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
