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
  onSelectVendor: (vendorId: string | null) => void;
  onLocate: (coords: { lat: number; lng: number }) => void;
}) {
  if (isLoading) {
    return (
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-80 rounded-none border-b border-border" />
        ))}
      </section>
    );
  }

  if (browseVendors.length === 0) {
    return (
      <section className="border border-border py-24 text-center mt-12 bg-secondary/10">
        <h2 className="text-4xl font-medium tracking-tighter text-foreground">
          No shops found.
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Try a different search term or browse available categories above.
        </p>
        <Button
          variant="outline"
          className="mt-8 rounded-none border-border px-8 py-6 text-lg font-bold shadow-none hover:bg-foreground hover:text-background transition-colors"
          onClick={() => window.location.reload()}
        >
          <Search className="h-5 w-5 mr-3" />
          Reset search
        </Button>
      </section>
    );
  }

  if (viewMode === "map") {
    return (
      <section className="h-[calc(100vh-70px)] md:h-screen w-full relative border border-border">
        <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
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
      <section className="border-t border-border mt-12">
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
    <section className="space-y-16 mt-16">
      <div className="border-t border-border pt-16">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-8">
          Featured Spots
        </h2>
        <Stagger
          className="grid gap-x-12 gap-y-16 md:grid-cols-3"
          delayChildren={0.02}
          stagger={0.06}
        >
          {browseVendors.slice(0, 3).map((vendor) => (
            <StaggerItem
              key={`${vendor.id}-feature`}
              className="group flex flex-col justify-between h-full cursor-pointer"
              onClick={() => onSelectVendor(vendor.id)}
            >
              <div className="relative z-10 border-l-2 border-primary pl-6">
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
                  {vendor.spotlight || "Nearby"}
                </p>
                <h2 className="text-3xl font-medium tracking-tighter text-foreground mb-4 group-hover:text-primary transition-colors">
                  {vendor.name}
                </h2>
                <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                  {vendor.description ||
                    "Discover our most popular picks from this top-rated local vendor."}
                </p>
                <div className="mt-8 flex flex-wrap gap-2">
                  {(vendor.specialties || []).slice(0, 3).map((specialty) => (
                    <span
                      key={specialty}
                      className="border border-border px-3 py-1 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors group-hover:border-primary group-hover:text-primary"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      <div className="border-t border-border pt-16">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-8">
          All Restaurants
        </h2>
        <div className="grid gap-x-0 gap-y-0 md:grid-cols-2 xl:grid-cols-3 border-t border-border">
          {browseVendors.map((vendor) => (
            <VendorCardPremium key={vendor.id} vendor={vendor} />
          ))}
        </div>
      </div>
    </section>
  );
}
