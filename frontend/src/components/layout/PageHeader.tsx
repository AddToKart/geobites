import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  actions,
  className,
}: PageHeaderProps) {
  if (!actions) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap items-center justify-end gap-3 mb-6', className)}>
      {actions}
    </div>
  );
}
