import { memo, type ReactNode } from 'react';
import { m } from 'framer-motion';
import { StaggerItem } from '@/components/motion/Reveal';
import { Card, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  label: string;
  value: string | number;
  description: string;
  icon: ReactNode;
}

export const MetricCard = memo(function MetricCard({
  label,
  value,
  description,
  icon,
}: MetricCardProps) {
  return (
    <StaggerItem className="h-full">
      <Card className="h-full transform-gpu transition-transform duration-300 hover:-translate-y-1">
        <CardContent className="flex items-start justify-between gap-4 p-5">
          <div className="space-y-2">
            <p className="text-sm font-medium text-[color:var(--color-text-soft)]">{label}</p>
            <div className="text-3xl font-semibold tracking-tight text-[color:var(--color-text)]">
              {value}
            </div>
            <p className="text-sm text-[color:var(--color-text-muted)]">{description}</p>
          </div>
          <m.div
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary-dark)]"
            initial={{ scale: 0.88, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 0.22, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            style={{
              willChange: 'transform, opacity',
              transform: 'translateZ(0)',
            }}
          >
            {icon}
          </m.div>
        </CardContent>
      </Card>
    </StaggerItem>
  );
});
