import { Suspense, lazy, type ComponentProps } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const DeliveryLocationPicker = lazy(() =>
  import('./DeliveryLocationPicker').then((module) => ({
    default: module.DeliveryLocationPicker,
  })),
);

type DeliveryLocationPickerProps = ComponentProps<
  typeof import('./DeliveryLocationPicker')['DeliveryLocationPicker']
>;

function DeliveryPickerFallback() {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-4 w-full max-w-md rounded-full" />
        </div>
        <Skeleton className="h-24 rounded-[24px]" />
        <Skeleton className="h-11 w-40 rounded-2xl" />
      </CardContent>
    </Card>
  );
}

export function LazyDeliveryLocationPicker(props: DeliveryLocationPickerProps) {
  return (
    <Suspense fallback={<DeliveryPickerFallback />}>
      <DeliveryLocationPicker {...props} />
    </Suspense>
  );
}
