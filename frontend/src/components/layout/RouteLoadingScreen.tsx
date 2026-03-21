import { Skeleton } from '@/components/ui/skeleton';

export function RouteLoadingScreen() {
  return (
    <div className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="page-hero overflow-hidden">
          <div className="route-loader-grid">
            <div className="space-y-4">
              <div className="route-loader-bar h-3 w-28 rounded-full" />
              <div className="route-loader-bar h-10 w-full max-w-xl rounded-full" />
              <div className="route-loader-bar h-4 w-full max-w-2xl rounded-full" />
            </div>
            <div className="flex justify-start lg:justify-end">
              <div className="route-loader-bar h-11 w-40 rounded-2xl" />
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-[24px]" />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
          <Skeleton className="h-[26rem] rounded-[28px]" />
          <div className="space-y-5">
            <Skeleton className="h-64 rounded-[28px]" />
            <Skeleton className="h-44 rounded-[28px]" />
          </div>
        </section>
      </div>
    </div>
  );
}
