import type { ReactNode } from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

const motionEase = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  className,
  delay = 0,
  y = 10,
  mode = 'inView',
  viewportMargin = '0px 0px -10% 0px',
  amount = 0.14,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  mode?: 'immediate' | 'inView';
  viewportMargin?: string;
  amount?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  if (mode === 'immediate') {
    return (
      <m.div
        className={className}
        initial={{ opacity: 0, y }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, delay, ease: motionEase }}
      >
        {children}
      </m.div>
    );
  }

  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount, margin: viewportMargin }}
      transition={{ duration: 0.24, delay, ease: motionEase }}
    >
      {children}
    </m.div>
  );
}

export function Stagger({
  children,
  className,
  delayChildren = 0.02,
  stagger = 0.04,
  mode = 'inView',
  viewportMargin = '0px 0px -10% 0px',
  amount = 0.14,
}: {
  children: ReactNode;
  className?: string;
  delayChildren?: number;
  stagger?: number;
  mode?: 'immediate' | 'inView';
  viewportMargin?: string;
  amount?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const variants = {
    hidden: {},
    visible: {
      transition: {
        delayChildren,
        staggerChildren: stagger,
      },
    },
  };

  if (mode === 'immediate') {
    return (
      <m.div className={className} initial="hidden" animate="visible" variants={variants}>
        {children}
      </m.div>
    );
  }

  return (
    <m.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount, margin: viewportMargin }}
      variants={variants}
    >
      {children}
    </m.div>
  );
}

export function StaggerItem({
  children,
  className,
  y = 10,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      className={cn(className)}
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.24,
            ease: motionEase,
          },
        },
      }}
    >
      {children}
    </m.div>
  );
}
