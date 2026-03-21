import { useRef, type ReactNode } from 'react';
import { m, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
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

  const outputRange = reverse ? [-offset, offset] : [offset, -offset];
  const rawY = useTransform(scrollYProgress, [0, 1], outputRange);
  const y = useSpring(rawY, {
    stiffness: 90,
    damping: 22,
    mass: 0.2,
  });

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
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}
    >
      {children}
    </m.div>
  );
}
