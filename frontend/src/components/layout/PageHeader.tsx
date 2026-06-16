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
  title,
  description,
  eyebrow,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4 mb-6', className)}>
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        {title ? <h1 className="text-3xl font-bold tracking-tight">{title}</h1> : null}
        {description ? <p className="subtle-copy mt-2 max-w-2xl">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-3 shrink-0">{actions}</div> : null}
    </div>
  );
}
