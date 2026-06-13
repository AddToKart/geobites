import { cn } from '@/lib/utils';
import { ORDER_STATUS_LABELS } from '@/utils/constants';
import { OrderStatus } from '@/types';

const statusStyles: Record<OrderStatus, string> = {
  pending: 'border-orange-500 text-orange-500',
  accepted: 'border-blue-500 text-blue-500',
  preparing: 'border-blue-500 text-blue-500',
  ready_for_pickup: 'border-purple-500 text-purple-500',
  picked_up: 'border-purple-500 text-purple-500',
  delivering: 'border-blue-500 text-blue-500',
  delivered: 'border-green-500 text-green-500',
  rejected: 'border-red-500 text-red-500',
  cancelled: 'border-red-500 text-red-500',
};

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'border px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-transparent',
        statusStyles[status],
        className,
      )}
    >
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}
