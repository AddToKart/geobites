import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Stagger, StaggerItem } from '@/components/motion/Reveal';
import { VendorCardPremium } from '@/components/custom/VendorCardPremium';
import { getVendorDistanceKm } from '@/data/demoVendors';
import { BrowseListItem } from './BrowseListItem';
import type { BrowseVendor, BrowseViewMode } from './types';

const BrowseVendorMapPanel = lazy(() =>
  import('@/components/maps/BrowseVendorMapPanel').then((module) => ({
    default: module.BrowseVendorMapPanel,
  })),
);

export function BrowseResultsSection({
  isLoading,
  browseVendors,
  viewMode,
  coords,
  selectedVendor,
  onSelectVendor,
  onLocate,
}: {
  isLoading: boolean;
  browseVendors: BrowseVendor[];
  viewMode: BrowseViewMode;
  coords: { lat: number; lng: number };
  selectedVendor: BrowseVendor | null;
  onSelectVendor: (vendorId: string) => void;
  onLocate: (coords: { lat: number; lng: number }) => void;
}) {
  if (isLoading) {
    return (
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-80 rounded-[28px]" />
        ))}
      </section>
    );
  }

  if (browseVendors.length === 0) {
    return (
      <section className="panel-card py-16 text-center">
        <p className="text-lg font-semibold text-[color:var(--color-text)]">No shops found</p>
        <p className="mt-2 text-sm text-[color:var(--color-text-soft)]">
          Try a different search term or reset back to the Santa Maria anchor.
        </p>
      </section>
    );
  }

  if (viewMode === 'map') {
    return (
      <section className="space-y-5">
        <Suspense fallback={<Skeleton className="h-[min(76vh,760px)] min-h-[560px] rounded-[28px]" />}>
          <BrowseVendorMapPanel
            vendors={browseVendors}
            selectedVendor={selectedVendor}
            centerPoint={coords}
            onSelectVendor={onSelectVendor}
            onLocate={onLocate}
          />
        </Suspense>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {browseVendors.map((vendor) => (
            <VendorCardPremium key={vendor.id} vendor={vendor} />
          ))}
        </div>
      </section>
    );
  }

  if (viewMode === 'list') {
    return (
      <section className="space-y-4">
        {browseVendors.map((vendor) => (
          <BrowseListItem
            key={vendor.id}
            vendor={vendor}
            distanceKm={getVendorDistanceKm(coords, {
              lat: vendor.latitude,
              lng: vendor.longitude,
            })}
            isSelected={vendor.id === selectedVendor?.id}
            onSelect={() => onSelectVendor(vendor.id)}
          />
        ))}
      </section>
    );
  }

  return (
    <section className="space-y-8 mt-8">
      <Stagger className="grid gap-6 md:grid-cols-3" delayChildren={0.02} stagger={0.06}>
        {browseVendors.slice(0, 3).map((vendor) => (
          <StaggerItem key={`${vendor.id}-feature`} className="panel-card bg-orange-50 border border-orange-100 shadow-[0_8px_24px_rgba(249,115,22,0.06)]">
            <p className="text-[11px] font-bold uppercase tracking-widest text-orange-600">
              {vendor.spotlight || 'Featured nearby'}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {vendor.name}
            </h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
              {vendor.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {(vendor.specialties || []).slice(0, 3).map((specialty) => (
                <span
                  key={specialty}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm"
                >
                  {specialty}
                </span>
              ))}
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {browseVendors.map((vendor) => (
          <VendorCardPremium key={vendor.id} vendor={vendor} />
        ))}
      </div>
    </section>
  );
}
