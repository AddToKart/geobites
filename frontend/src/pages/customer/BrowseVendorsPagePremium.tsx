import { Suspense, lazy, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Compass,
  List,
  MapIcon,
  MapPin,
  Search,
  Sparkles,
  Star,
  Store,
  Truck,
} from 'lucide-react';
import { demoVendors, getVendorDistanceKm, isNearSantaMariaBulacan, santaMariaBulacanCenter, type DemoVendor } from '@/data/demoVendors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { VendorCardPremium } from '@/components/custom/VendorCardPremium';
import { PageHeader } from '@/components/layout/PageHeader';
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal';
import { useVisiblePolling } from '@/hooks/useVisiblePolling';
import { getOrders } from '@/services/orderService';
import { getVendors } from '@/services/vendorService';
import { cn } from '@/lib/utils';
import { Order, Vendor } from '@/types';
import { toast } from 'sonner';

type BrowseVendor = Vendor & Partial<Pick<DemoVendor, 'etaMinutes' | 'neighborhood' | 'specialties' | 'priceBand' | 'spotlight'>>;

const BrowseVendorMapPanel = lazy(() =>
  import('@/components/maps/BrowseVendorMapPanel').then((module) => ({
    default: module.BrowseVendorMapPanel,
  })),
);

function toBrowseVendor(vendor: Vendor): BrowseVendor | null {
  if (
    typeof vendor.latitude !== 'number' ||
    typeof vendor.longitude !== 'number' ||
    !Number.isFinite(vendor.latitude) ||
    !Number.isFinite(vendor.longitude) ||
    !isNearSantaMariaBulacan(vendor.latitude, vendor.longitude)
  ) {
    return null;
  }

  return {
    ...vendor,
    etaMinutes: '22-34 min',
    neighborhood: 'Santa Maria',
    specialties: ['Local meals', 'Delivery ready'],
    priceBand: '₱₱',
    spotlight: 'Live shop',
  };
}

function formatDistanceLabel(distanceKm: number | null) {
  if (distanceKm === null) {
    return 'Santa Maria area';
  }

  return distanceKm < 1
    ? `${Math.round(distanceKm * 1000)} m away`
    : `${distanceKm.toFixed(1)} km away`;
}

function BrowseListItem({
  vendor,
  distanceKm,
  isSelected,
  onSelect,
}: {
  vendor: BrowseVendor;
  distanceKm: number | null;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <Link to={`/vendor/${vendor.id}`} className="block" onMouseEnter={onSelect} onFocus={onSelect}>
      <article
        className={cn(
          'grid overflow-hidden rounded-[28px] border border-[color:var(--color-shell-border)] bg-[color:var(--color-shell-bg)] shadow-[var(--shadow-card)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-panel)] xl:grid-cols-[260px_minmax(0,1fr)_220px]',
          isSelected && 'border-[color:var(--color-primary)] shadow-[0_22px_46px_rgba(235,106,45,0.18)]',
        )}
      >
        <div className="relative min-h-[220px] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.38),transparent_36%),linear-gradient(135deg,#ef7c42,#f6b372)] p-6 text-white">
          <div className="flex flex-wrap gap-2">
            <Badge variant={vendor.isActive ? 'success' : 'warning'}>
              {vendor.isActive ? 'Open now' : 'Closed'}
            </Badge>
            <Badge>{vendor.spotlight || 'Nearby'}</Badge>
          </div>
          <div className="mt-10 max-w-[14rem]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
              {vendor.neighborhood || 'Santa Maria'}
            </p>
            <h2 className="mt-3 text-2xl font-semibold leading-tight">{vendor.name}</h2>
            <p className="mt-3 text-sm leading-6 text-white/85">
              {vendor.description || 'Local food and reliable delivery around Santa Maria, Bulacan.'}
            </p>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[color:var(--color-text)]">{vendor.name}</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-text-soft)]">
                {vendor.description || 'Prepared fast and pinned close to Santa Maria for easier ordering.'}
              </p>
            </div>
            <ArrowRight className="mt-1 h-5 w-5 text-[color:var(--color-text-light)]" />
          </div>

          <div className="flex items-start gap-2 text-sm text-[color:var(--color-text-soft)]">
            <MapPin className="mt-0.5 h-4 w-4 text-[color:var(--color-primary-dark)]" />
            <span>{vendor.address}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {(vendor.specialties || []).slice(0, 3).map((specialty) => (
              <span
                key={specialty}
                className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-xs font-medium text-[color:var(--color-text-soft)]"
              >
                {specialty}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-6 xl:border-l xl:border-t-0">
          <div className="grid gap-3">
            <div className="panel-muted flex items-center justify-between px-4 py-3">
              <span className="text-sm text-[color:var(--color-text-soft)]">Rating</span>
              <span className="flex items-center gap-1 text-sm font-semibold text-[color:var(--color-text)]">
                <Star className="h-4 w-4 fill-[color:var(--color-primary)] text-[color:var(--color-primary)]" />
                {vendor.rating.toFixed(1)}
              </span>
            </div>
            <div className="panel-muted flex items-center justify-between px-4 py-3">
              <span className="text-sm text-[color:var(--color-text-soft)]">Distance</span>
              <span className="text-sm font-semibold text-[color:var(--color-text)]">
                {formatDistanceLabel(distanceKm)}
              </span>
            </div>
            <div className="panel-muted flex items-center justify-between px-4 py-3">
              <span className="text-sm text-[color:var(--color-text-soft)]">ETA</span>
              <span className="text-sm font-semibold text-[color:var(--color-text)]">
                {vendor.etaMinutes || '20-35 min'}
              </span>
            </div>
          </div>

          <Button asChild className="w-full">
            <span>
              Open menu
              <ArrowRight className="h-4 w-4" />
            </span>
          </Button>
        </div>
      </article>
    </Link>
  );
}

export function BrowseVendorsPagePremium() {
  const [liveVendors, setLiveVendors] = useState<Vendor[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'distance' | 'name'>('distance');
  const [coords, setCoords] = useState(santaMariaBulacanCenter);
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'grid'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(demoVendors[0]?.id ?? null);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    const loadBrowseData = async () => {
      setIsLoading(true);

      try {
        const response = await getVendors({ page: 1, limit: 100 });
        setLiveVendors(response.data);
      } catch {
        setLiveVendors([]);
        toast.error('Live shops could not be loaded. Showing Santa Maria demos instead.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadBrowseData();
  }, []);

  useVisiblePolling(async () => {
    try {
      const response = await getOrders({ page: 1, limit: 12 });
      const trackedOrder =
        response.data.find((order) =>
          ['accepted', 'preparing', 'ready_for_pickup', 'picked_up', 'delivering'].includes(
            order.status,
          ),
        ) ?? null;
      setActiveOrder(trackedOrder);
    } catch {
      setActiveOrder(null);
    }
  }, 15000);

  const browseVendors = useMemo(() => {
    const merged = [
      ...demoVendors,
      ...liveVendors
        .map((vendor) => toBrowseVendor(vendor))
        .filter((vendor): vendor is BrowseVendor => Boolean(vendor))
        .filter((vendor) => !demoVendors.some((demoVendor) => demoVendor.id === vendor.id)),
    ];

    const normalizedSearch = deferredSearch.trim().toLowerCase();

    const filtered = merged.filter((vendor) => {
      if (!normalizedSearch) {
        return true;
      }

      return [vendor.name, vendor.description, vendor.address, vendor.neighborhood]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch));
    });

    return filtered.sort((firstVendor, secondVendor) => {
      if (sortBy === 'name') {
        return firstVendor.name.localeCompare(secondVendor.name);
      }

      if (sortBy === 'distance') {
        return (
          getVendorDistanceKm(coords, { lat: firstVendor.latitude, lng: firstVendor.longitude }) -
          getVendorDistanceKm(coords, { lat: secondVendor.latitude, lng: secondVendor.longitude })
        );
      }

      return secondVendor.rating - firstVendor.rating;
    });
  }, [coords, deferredSearch, liveVendors, sortBy]);

  const selectedVendor = useMemo(
    () => browseVendors.find((vendor) => vendor.id === selectedVendorId) ?? browseVendors[0] ?? null,
    [browseVendors, selectedVendorId],
  );

  useEffect(() => {
    if (!browseVendors.length) {
      setSelectedVendorId(null);
      return;
    }

    if (!selectedVendorId || !browseVendors.some((vendor) => vendor.id === selectedVendorId)) {
      setSelectedVendorId(browseVendors[0].id);
    }
  }, [browseVendors, selectedVendorId]);

  const topRatedCount = useMemo(
    () => browseVendors.filter((vendor) => vendor.rating >= 4.7).length,
    [browseVendors],
  );

  const featuredCount = demoVendors.length;
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Customer"
        title="Browse Santa Maria"
        description="Grid, list, and map now behave like separate views, with everything centered around Santa Maria, Bulacan instead of a dead generic layout."
        actions={
          <>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Store className="h-4 w-4" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
              List
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('map')}
            >
              <MapIcon className="h-4 w-4" />
              Map
            </Button>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_330px]">
        <Reveal className="panel-card space-y-5 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Santa Maria, Bulacan</Badge>
            <Badge variant="success">{featuredCount} demo shops pinned</Badge>
            <Badge variant="warning">Map-first local radius</Badge>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-text-light)]" />
              <Input
                placeholder="Search shops, food types, or neighborhoods"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-11"
              />
            </label>

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as 'rating' | 'distance' | 'name')
              }
              className="h-11 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/88 px-4 text-sm text-[color:var(--color-text)] shadow-[var(--shadow-inset-soft)]"
            >
              <option value="distance">Closest to Santa Maria</option>
              <option value="rating">Top rated first</option>
              <option value="name">A to Z</option>
            </select>

            <Button
              variant="ghost"
              onClick={() => {
                setCoords(santaMariaBulacanCenter);
                toast.success('Centered back on Santa Maria, Bulacan');
              }}
            >
              <Compass className="h-4 w-4" />
              Reset area
            </Button>
          </div>

          <Stagger className="grid gap-3 md:grid-cols-3" delayChildren={0.08} stagger={0.06}>
            <StaggerItem className="panel-muted px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
                Nearby now
              </p>
              <p className="mt-2 text-3xl font-semibold text-[color:var(--color-text)]">
                {browseVendors.length}
              </p>
              <p className="mt-1 text-sm text-[color:var(--color-text-soft)]">
                Visible shops inside the Santa Maria browse radius
              </p>
            </StaggerItem>
            <StaggerItem className="panel-muted px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
                Top rated
              </p>
              <p className="mt-2 text-3xl font-semibold text-[color:var(--color-text)]">
                {topRatedCount}
              </p>
              <p className="mt-1 text-sm text-[color:var(--color-text-soft)]">
                Local picks rated 4.7 and above
              </p>
            </StaggerItem>
            <StaggerItem className="panel-muted px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
                Browse anchor
              </p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--color-text)]">
                Santa Maria town center
              </p>
              <p className="mt-1 text-sm text-[color:var(--color-text-soft)]">
                Use locate on the map if you want your exact current spot
              </p>
            </StaggerItem>
          </Stagger>
        </Reveal>

        <Reveal className="panel-card flex h-full flex-col gap-4 p-5" delay={0.08}>
          <div>
            <p className="eyebrow">Selected area</p>
            <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-text)]">
              Santa Maria, Bulacan
            </h2>
            <p className="mt-2 subtle-copy">
              The browse flow now stays focused on one usable service zone instead of a vague empty map.
            </p>
          </div>
          <div className="panel-muted space-y-3 px-4 py-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-[color:var(--color-primary-dark)]" />
              <p className="text-sm text-[color:var(--color-text)]">
                Demo vendors are mixed in so the page always looks populated while you build real seller data.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="h-4 w-4 text-[color:var(--color-primary-dark)]" />
              <p className="text-sm text-[color:var(--color-text)]">
                Distance sorting uses the Santa Maria anchor unless you hit locate from the map view.
              </p>
            </div>
          </div>
          {selectedVendor ? (
            <div className="rounded-[24px] bg-[linear-gradient(135deg,#223547,#314b61)] p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                Currently highlighted
              </p>
              <h3 className="mt-3 text-xl font-semibold">{selectedVendor.name}</h3>
              <p className="mt-2 text-sm leading-6 text-white/82">
                {selectedVendor.description}
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-white/85">
                <MapPin className="h-4 w-4" />
                <span>{selectedVendor.neighborhood || 'Santa Maria'}</span>
              </div>
            </div>
          ) : null}
        </Reveal>
      </section>

      {activeOrder ? (
        <Reveal className="panel-card flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between" delay={0.1}>
          <div>
            <p className="eyebrow">Current delivery</p>
            <h2 className="mt-2 text-2xl font-semibold capitalize">
              {activeOrder.status.replaceAll('_', ' ')}
            </h2>
            <p className="mt-2 subtle-copy">
              Browse stays clean here. Open the live tracking page when you want the detailed delivery map.
            </p>
          </div>
          <Button asChild>
            <Link to={`/orders/${activeOrder.id}`}>
              Open live tracking
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Reveal>
      ) : null}

      {isLoading ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-80 rounded-[28px]" />
          ))}
        </section>
      ) : browseVendors.length === 0 ? (
        <section className="panel-card py-16 text-center">
          <p className="text-lg font-semibold text-[color:var(--color-text)]">No shops found</p>
          <p className="mt-2 text-sm text-[color:var(--color-text-soft)]">
            Try a different search term or reset back to the Santa Maria anchor.
          </p>
        </section>
      ) : viewMode === 'map' ? (
        <section className="space-y-5">
          <Suspense fallback={<Skeleton className="h-[min(76vh,760px)] min-h-[560px] rounded-[28px]" />}>
            <BrowseVendorMapPanel
              vendors={browseVendors}
              selectedVendor={selectedVendor}
              centerPoint={coords}
              onSelectVendor={setSelectedVendorId}
              onLocate={(nextCoords) => {
                setCoords(nextCoords);
                toast.success('Using your current location for nearby sorting');
              }}
            />
          </Suspense>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {browseVendors.map((vendor) => (
              <VendorCardPremium key={vendor.id} vendor={vendor} />
            ))}
          </div>
        </section>
      ) : viewMode === 'list' ? (
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
              onSelect={() => setSelectedVendorId(vendor.id)}
            />
          ))}
        </section>
      ) : (
        <section className="space-y-5">
          <Stagger className="grid gap-4 md:grid-cols-3" delayChildren={0.02} stagger={0.06}>
            {browseVendors.slice(0, 3).map((vendor) => (
              <StaggerItem key={`${vendor.id}-feature`} className="panel-card p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary-dark)]">
                  {vendor.spotlight || 'Featured nearby'}
                </p>
                <h2 className="mt-3 text-xl font-semibold text-[color:var(--color-text)]">
                  {vendor.name}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[color:var(--color-text-soft)]">
                  {vendor.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(vendor.specialties || []).slice(0, 3).map((specialty) => (
                    <span
                      key={specialty}
                      className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-xs font-medium text-[color:var(--color-text-soft)]"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {browseVendors.map((vendor) => (
              <VendorCardPremium key={vendor.id} vendor={vendor} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
