import { Suspense, lazy } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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
          Try a different search term or browse available categories above.
        </p>
        <Button
          variant="outline"
          className="mt-6 rounded-full"
          onClick={() => window.location.reload()}
        >
          <Search className="h-4 w-4 mr-2" />
          Reset search
        </Button>
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
            className="group bento-card flex flex-col justify-between h-full cursor-pointer p-8"
            onClick={() => onSelectVendor(vendor.id)}
          >
            <div className="bento-accent transition-opacity duration-700 opacity-0 group-hover:opacity-100" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[var(--shadow-glow)]" />
                <p className="eyebrow group-hover:text-primary transition-colors">
                  {vendor.spotlight || "Featured nearby"}
                </p>
              </div>
              <h2 className="text-[22px] font-bold tracking-tight text-foreground mb-3">
                {vendor.name}
              </h2>
              <p className="subtle-copy line-clamp-3">
                {vendor.description ||
                  "Discover our most popular picks from this top-rated local vendor."}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-2 relative z-10">
              {(vendor.specialties || []).slice(0, 3).map((specialty) => (
                <span
                  key={specialty}
                  className="rounded-full bg-surface px-3.5 py-1.5 text-[12px] font-semibold text-text-soft shadow-sm border border-white/30 dark:border-white/5 transition-colors group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary"
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
