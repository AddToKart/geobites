import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  label: string;
  value: string | number;
  description: string;
  icon: ReactNode;
}

export function MetricCard({ label, value, description, icon }: MetricCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-[color:var(--color-text-soft)]">{label}</p>
          <div className="text-3xl font-semibold tracking-tight text-[color:var(--color-text)]">
            {value}
          </div>
          <p className="text-sm text-[color:var(--color-text-muted)]">{description}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary-dark)]">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
