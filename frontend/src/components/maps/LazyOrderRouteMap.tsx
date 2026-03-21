import { Suspense, lazy, type ComponentProps } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const OrderRouteMap = lazy(() =>
  import('./OrderRouteMap').then((module) => ({ default: module.OrderRouteMap })),
);

type OrderRouteMapProps = ComponentProps<typeof import('./OrderRouteMap')['OrderRouteMap']>;

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
  return (
    <Suspense fallback={<MapPanelFallback compact={props.compact} />}>
      <OrderRouteMap {...props} />
    </Suspense>
  );
}
