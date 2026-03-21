import { Suspense, lazy, useEffect, useState, type ComponentProps } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const OrderRouteMap = lazy(() =>
  import('./OrderRouteMap').then((module) => ({ default: module.OrderRouteMap })),
);

type OrderRouteMapProps = ComponentProps<typeof import('./OrderRouteMap')['OrderRouteMap']>;

function useDeferredMapReady(delayMs = 180) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let timeoutId: number | null = null;
    let idleId: number | null = null;
    let didResolve = false;

    const flush = () => {
      if (didResolve) {
        return;
      }

      didResolve = true;
      setIsReady(true);
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(flush, { timeout: delayMs });
    }

    timeoutId = window.setTimeout(flush, delayMs);

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      if (idleId !== null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [delayMs]);

  return isReady;
}

function MapPanelFallback({ compact = false }: { compact?: boolean }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40 rounded-full" />
          <Skeleton className="h-4 w-full max-w-md rounded-full" />
        </div>
        <Skeleton className={compact ? 'h-64 rounded-[24px]' : 'h-80 rounded-[24px]'} />
      </CardContent>
    </Card>
  );
}

export function LazyOrderRouteMap(props: OrderRouteMapProps) {
  const isReady = useDeferredMapReady(props.compact ? 140 : 180);

  if (!isReady) {
    return <MapPanelFallback compact={props.compact} />;
  }

  return (
    <Suspense fallback={<MapPanelFallback compact={props.compact} />}>
      <OrderRouteMap {...props} />
    </Suspense>
  );
}
