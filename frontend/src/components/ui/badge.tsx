import * as React from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger';

const styles: Record<BadgeVariant, string> = {
  default: 'bg-[color:var(--color-surface-2)] text-[color:var(--color-text-soft)]',
  success: 'bg-[color:var(--color-success-soft)] text-[color:var(--color-success)]',
  warning: 'bg-[color:var(--color-warning-soft)] text-[color:var(--color-warning)]',
  danger: 'bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger)]',
};

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-[color:var(--color-shell-border)] px-2.5 py-1 text-xs font-medium',
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
