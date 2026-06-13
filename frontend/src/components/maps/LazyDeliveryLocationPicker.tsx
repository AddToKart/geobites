import { Suspense, lazy, type ComponentProps } from 'react';
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24 rounded-none" />
        <Skeleton className="h-4 w-16 rounded-none" />
      </div>
      <div className="border border-border p-4 bg-secondary/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-2/3 rounded-none" />
          <Skeleton className="h-3.5 w-1/2 rounded-none" />
        </div>
        <Skeleton className="h-11 w-24 rounded-none shrink-0" />
      </div>
    </div>
  );
}

export function LazyDeliveryLocationPicker(props: DeliveryLocationPickerProps) {
  return (
    <Suspense fallback={<DeliveryPickerFallback />}>
      <DeliveryLocationPicker {...props} />
    </Suspense>
  );
}
