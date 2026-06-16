import { Children, type ReactNode, cloneElement, isValidElement } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useInViewOnce } from '@/hooks/useInViewOnce';
import { cn } from '@/lib/utils';

export function Reveal({
  children,
  className,
  delay = 0,
  y = 10,
  mode = 'immediate',
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
  const { ref, inView } = useInViewOnce(viewportMargin, amount);
  const shouldReduce = useReducedMotion();

  if (shouldReduce) {
    return <div className={className}>{children}</div>;
  }

  const willAnimate = mode === 'immediate' || inView;

  return (
    <div
      ref={mode === 'inView' ? ref : undefined}
      className={cn(willAnimate && 'animate-reveal', className)}
      style={{
        animationDelay: `${delay}s`,
        '--reveal-y': `${y}px`,
        ...(willAnimate ? {} : { opacity: 0, transform: `translateY(${y}px)` }),
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

export function Stagger({
  children,
  className,
  delayChildren = 0.02,
  stagger = 0.04,
  mode = 'immediate',
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
  const { ref, inView } = useInViewOnce(viewportMargin, amount);
  const shouldReduce = useReducedMotion();

  if (shouldReduce) {
    return <div className={className}>{children}</div>;
  }

  const willAnimate = mode === 'immediate' || inView;

  const mapped = Children.map(children, (child, i) => {
    if (isValidElement<{ style?: React.CSSProperties }>(child)) {
      return cloneElement(child, {
        style: {
          ...child.props.style,
          '--stagger-delay': `${delayChildren + i * stagger}s`,
        } as React.CSSProperties,
      });
    }
    return child;
  });

  return (
    <div
      ref={mode === 'inView' ? ref : undefined}
      className={cn(willAnimate && 'animate-stagger', className)}
    >
      {mapped}
    </div>
  );
}

export function StaggerItem({
  children,
  className,
  y = 10,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  onClick?: () => void;
}) {
  const shouldReduce = useReducedMotion();

  if (shouldReduce) {
    return <div className={className} onClick={onClick}>{children}</div>;
  }

  return (
    <div
      className={cn('animate-stagger-item', className)}
      onClick={onClick}
      style={{ '--reveal-y': `${y}px` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
