import { Suspense, lazy } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { VendorCardPremium } from "@/components/custom/VendorCardPremium";
import { getVendorDistanceKm } from "@/data/demoVendors";
import { BrowseListItem } from "./BrowseListItem";
import type { BrowseVendor, BrowseViewMode } from "./types";

const BrowseVendorMapPanel = lazy(() =>
  import("@/components/maps/BrowseVendorMapPanel").then((module) => ({
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
        <p className="text-lg font-semibold text-[color:var(--color-text)]">
          No shops found
        </p>
        <p className="mt-2 text-sm text-[color:var(--color-text-soft)]">
          Try a different search term or reset back to the Santa Maria anchor.
        </p>
      </section>
    );
  }

  if (viewMode === "map") {
    return (
      <section className="h-[calc(100vh-70px)] md:h-screen w-full relative">
        <Suspense fallback={<Skeleton className="h-full w-full" />}>
          <BrowseVendorMapPanel
            vendors={browseVendors}
            selectedVendor={selectedVendor}
            centerPoint={coords}
            onSelectVendor={onSelectVendor}
            onLocate={onLocate}
          />
        </Suspense>
      </section>
    );
  }

  if (viewMode === "list") {
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
      <Stagger
        className="grid gap-6 md:grid-cols-3"
        delayChildren={0.02}
        stagger={0.06}
      >
        {browseVendors.slice(0, 3).map((vendor) => (
          <StaggerItem
            key={`${vendor.id}-feature`}
            className="group relative flex flex-col justify-between h-full overflow-hidden rounded-[32px] bg-slate-50/60 dark:bg-gray-800/40 backdrop-blur-sm border border-slate-200/50 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-900 hover:shadow-[0_16px_40px_rgb(249,115,22,0.06)] hover:-translate-y-1 transition-all duration-500 cursor-pointer p-8"
            onClick={() => onSelectVendor(vendor.id)}
          >
            <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-gradient-to-br from-orange-400/10 to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 group-hover:text-orange-500 transition-colors">
                  {vendor.spotlight || "Featured nearby"}
                </p>
              </div>
              <h2 className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-white mb-3">
                {vendor.name}
              </h2>
              <p className="text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400 line-clamp-3">
                {vendor.description ||
                  "Discover our most popular picks from this top-rated local vendor."}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-2 relative z-10">
              {(vendor.specialties || []).slice(0, 3).map((specialty) => (
                <span
                  key={specialty}
                  className="rounded-full bg-white dark:bg-gray-800 px-3.5 py-1.5 text-[12px] font-semibold text-slate-500 dark:text-slate-400 shadow-sm border border-slate-100 border-b-slate-200 dark:border-gray-700/50 transition-colors group-hover:border-orange-200 group-hover:bg-orange-50 group-hover:text-orange-700 dark:group-hover:border-orange-900/30 dark:group-hover:bg-orange-900/20 dark:group-hover:text-orange-300"
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
