import { Suspense, lazy, memo, useCallback, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { VendorCardPremium } from "@/components/custom/VendorCardPremium";
import { BrowseListItem } from "./BrowseListItem";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { usePagination } from "@/hooks/usePagination";
import type { BrowseVendor, BrowseViewMode } from "./types";

const BrowseVendorMapPanel = lazy(() =>
  import("@/components/maps/BrowseVendorMapPanel").then((module) => ({
    default: module.BrowseVendorMapPanel,
  })),
);

const ITEMS_PER_PAGE = 12;

const timeSlotKeywords: Record<string, string[]> = {
  breakfast: ['breakfast', 'morning', 'coffee', 'silog', 'tapsi', 'pancake', 'tocino', 'longganisa', 'pandesal', 'almusal'],
  lunch: ['lunch', 'grill', 'ihaw', 'bbq', 'pancit', 'burger', 'fried', 'merienda', 'rice meals', 'silog'],
  merienda: ['merienda', 'desserts', 'pancit', 'lumpia', 'halo', 'sweets', 'snacks', 'coffee', 'cold drinks'],
  dinner: ['dinner', 'grill', 'sisig', 'inasal', 'lechon', 'stews', 'sizzling', 'platters', 'adobo', 'sinigang', 'bulalo', 'kare'],
  'late-night': ['pulutan', 'sisig', 'ihaw', 'bbq', 'comfort', 'silog', 'noodles', 'bowls'],
};

function getTimeSlot(hour: number): string {
  if (hour >= 5 && hour < 10) return 'breakfast';
  if (hour >= 10 && hour < 14) return 'lunch';
  if (hour >= 14 && hour < 17) return 'merienda';
  if (hour >= 17 && hour < 22) return 'dinner';
  return 'late-night';
}

function scoreVendorForSlot(vendor: BrowseVendor, slot: string): number {
  const keywords = timeSlotKeywords[slot] ?? [];
  let score = 0;
  if (keywords.some((kw) => vendor.spotlight?.toLowerCase().includes(kw))) score += 5;
  score += (vendor.specialties?.filter((s) => keywords.some((kw) => s.toLowerCase().includes(kw))).length ?? 0) * 3;
  if (keywords.some((kw) => vendor.name?.toLowerCase().includes(kw))) score += 2;
  return score;
}

function PaginationControls({
  currentPage,
  visiblePages,
  goNext,
  goPrev,
  goTo,
  isFirstPage,
  isLastPage,
  startIndex,
  endIndex,
  totalItems,
}: {
  currentPage: number;
  visiblePages: (number | "ellipsis")[];
  goNext: () => void;
  goPrev: () => void;
  goTo: (page: number) => void;
  isFirstPage: boolean;
  isLastPage: boolean;
  startIndex: number;
  endIndex: number;
  totalItems: number;
}) {
  return (
    <div className="flex flex-col items-center gap-4 pt-12 pb-6 border-t border-border mt-16">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Showing {startIndex}&ndash;{endIndex} of {totalItems}
      </p>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious disabled={isFirstPage} onClick={goPrev} />
          </PaginationItem>
          {visiblePages.map((page, index) =>
            page === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={page === currentPage}
                  onClick={() => goTo(page)}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext disabled={isLastPage} onClick={goNext} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

function useDelayedNavigation(goTo: (page: number) => void, goNext: () => void, goPrev: () => void) {
  const [isPending, setIsPending] = useState(false);

  const scrollUp = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const delayedGoTo = useCallback(
    (page: number) => {
      setIsPending(true);
      scrollUp();
      setTimeout(() => {
        goTo(page);
        setIsPending(false);
      }, 800);
    },
    [goTo, scrollUp],
  );

  const delayedGoNext = useCallback(() => {
    setIsPending(true);
    scrollUp();
    setTimeout(() => {
      goNext();
      setIsPending(false);
    }, 800);
  }, [goNext, scrollUp]);

  const delayedGoPrev = useCallback(() => {
    setIsPending(true);
    scrollUp();
    setTimeout(() => {
      goPrev();
      setIsPending(false);
    }, 800);
  }, [goPrev, scrollUp]);

  return { isPending, delayedGoTo, delayedGoNext, delayedGoPrev };
}

export const BrowseResultsSection = memo(function BrowseResultsSection({
  isLoading,
  browseVendors,
  allVendors,
  viewMode,
  coords,
  selectedVendor,
  onSelectVendor,
  onLocate,
}: {
  isLoading: boolean;
  browseVendors: BrowseVendor[];
  allVendors: BrowseVendor[];
  viewMode: BrowseViewMode;
  coords: { lat: number; lng: number };
  selectedVendor: BrowseVendor | null;
  onSelectVendor: (vendorId: string | null) => void;
  onLocate: (coords: { lat: number; lng: number }) => void;
}) {
  const featuredVendors = useMemo(() => {
    if (allVendors.length === 0) return [];
    const slot = getTimeSlot(new Date().getHours());
    const scored = allVendors.map((v) => ({
      vendor: v,
      score: scoreVendorForSlot(v, slot),
    }));
    scored.sort((a, b) => b.score - a.score || b.vendor.rating - a.vendor.rating);
    return scored.slice(0, Math.min(3, allVendors.length)).map((s) => s.vendor);
  }, [allVendors]);

  const featuredIds = useMemo(() => new Set(featuredVendors.map((v) => v.id)), [featuredVendors]);
  const restVendors = useMemo(
    () => browseVendors.filter((v) => !featuredIds.has(v.id)),
    [browseVendors, featuredIds],
  );
  const listPagination = usePagination(
    viewMode === "list" ? browseVendors : [],
    ITEMS_PER_PAGE,
  );
  const gridPagination = usePagination(
    viewMode === "grid" ? restVendors : [],
    ITEMS_PER_PAGE,
  );

  const listPaging = useDelayedNavigation(listPagination.goTo, listPagination.goNext, listPagination.goPrev);
  const gridPaging = useDelayedNavigation(gridPagination.goTo, gridPagination.goNext, gridPagination.goPrev);

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
    const {
      currentPage,
      totalPages,
      paginatedItems,
      goNext,
      goPrev,
      goTo,
      isFirstPage,
      isLastPage,
      startIndex,
      endIndex,
      visiblePages,
    } = listPagination;

    const { isPending, delayedGoNext, delayedGoPrev, delayedGoTo } = listPaging;

    return (
      <section className="mt-12">
        <div className="border-t border-border divide-y divide-border">
          <AnimatePresence mode="popLayout" initial={false}>
            {isPending ? (
              <m.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-24 col-span-full"
              >
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </m.div>
            ) : (
              paginatedItems.map((vendor) => (
                <m.div
                  key={vendor.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <BrowseListItem
                    vendor={vendor}
                    distanceKm={vendor.distance}
                    isSelected={vendor.id === selectedVendor?.id}
                    onSelect={() => onSelectVendor(vendor.id)}
                  />
                </m.div>
              ))
            )}
          </AnimatePresence>
        </div>
        {totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            visiblePages={visiblePages}
            goNext={delayedGoNext}
            goPrev={delayedGoPrev}
            goTo={delayedGoTo}
            isFirstPage={isFirstPage || isPending}
            isLastPage={isLastPage || isPending}
            startIndex={startIndex}
            endIndex={endIndex}
            totalItems={browseVendors.length}
          />
        )}
      </section>
    );
  }

  const {
    currentPage,
    totalPages,
    paginatedItems,
    goNext,
    goPrev,
    goTo,
    isFirstPage,
    isLastPage,
    startIndex,
    endIndex,
    visiblePages,
  } = gridPagination;

  const { isPending, delayedGoNext, delayedGoPrev, delayedGoTo } = gridPaging;

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
          {featuredVendors.map((vendor) => (
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

      {restVendors.length > 0 && (
        <div className="border-t border-border pt-16">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-8">
            All Restaurants
          </h2>
          <div className="grid gap-x-0 gap-y-0 md:grid-cols-2 xl:grid-cols-3 border-t border-border">
            <AnimatePresence mode="popLayout" initial={false}>
              {isPending ? (
                <m.div
                  key="loader"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center py-24 col-span-full"
                >
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </m.div>
              ) : (
                paginatedItems.map((vendor) => (
                  <m.div
                    key={vendor.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                  >
                    <VendorCardPremium vendor={vendor} />
                  </m.div>
                ))
              )}
            </AnimatePresence>
          </div>
          {totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
              visiblePages={visiblePages}
              goNext={delayedGoNext}
              goPrev={delayedGoPrev}
              goTo={delayedGoTo}
              isFirstPage={isFirstPage || isPending}
              isLastPage={isLastPage || isPending}
              startIndex={startIndex}
              endIndex={endIndex}
              totalItems={restVendors.length}
            />
          )}
        </div>
      )}
    </section>
  );
});
