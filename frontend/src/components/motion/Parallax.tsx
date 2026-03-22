import { useRef, type ReactNode } from 'react';
import { m, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

export function ParallaxSection({
  children,
  className,
  offset = 18,
  reverse = false,
}: {
  children: ReactNode;
  className?: string;
  offset?: number;
  reverse?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reverse ? [-offset, offset] : [offset, -offset],
  );

  if (shouldReduceMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <m.div
      ref={ref}
      className={cn(className)}
      style={{
        y,
      }}
    >
      {children}
    </m.div>
  );
}
