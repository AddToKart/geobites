import type { ReactNode } from 'react';
import { ParallaxSection } from '@/components/motion/Parallax';
import { Reveal } from '@/components/motion/Reveal';
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
    <section className={cn('page-hero', className)}>
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <ParallaxSection className="max-w-3xl" offset={14}>
          <Reveal className="space-y-3" delay={0.02}>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <div className="space-y-2">
              <h1>{title}</h1>
              <p className="max-w-2xl subtle-copy">{description}</p>
            </div>
          </Reveal>
        </ParallaxSection>
        {actions ? (
          <ParallaxSection offset={10} reverse>
            <Reveal className="flex flex-wrap items-center gap-3" delay={0.12} y={12}>
              {actions}
            </Reveal>
          </ParallaxSection>
        ) : null}
      </div>
    </section>
  );
}
