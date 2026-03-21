import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Clock3,
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
import { MapStyleSelect } from '@/components/maps/MapStyleSelect';
import { defaultMapStyle, mapStyles, type MapStyleKey } from '@/components/maps/map-styles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  useMap,
} from '@/components/ui/map';
import { VendorCardPremium } from '@/components/custom/VendorCardPremium';
import { PageHeader } from '@/components/layout/PageHeader';
import { getOrders } from '@/services/orderService';
import { getVendors } from '@/services/vendorService';
import { cn } from '@/lib/utils';
import { Order, Vendor } from '@/types';
import { toast } from 'sonner';

type BrowseVendor = Vendor & Partial<Pick<DemoVendor, 'etaMinutes' | 'neighborhood' | 'specialties' | 'priceBand' | 'spotlight'>>;

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

function BrowseMapViewport({
  vendorPoints,
  centerPoint,
  is3D,
}: {
  vendorPoints: BrowseVendor[];
  centerPoint: { lat: number; lng: number };
  is3D: boolean;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!isLoaded || !map) {
      return;
    }

    const points = vendorPoints.length
      ? vendorPoints.map((vendor) => ({ lat: vendor.latitude, lng: vendor.longitude }))
      : [centerPoint];

    if (points.length === 1) {
      map.easeTo({
        center: [points[0].lng, points[0].lat],
        zoom: 14.3,
        bearing: is3D ? -18 : 0,
        pitch: is3D ? 60 : 0,
        duration: 900,
      });
      return;
    }

    const lngs = points.map((point) => point.lng);
    const lats = points.map((point) => point.lat);

    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      {
        padding: 88,
        duration: 900,
        maxZoom: 14.7,
      },
    );

    const frameId = window.requestAnimationFrame(() => {
      map.easeTo({
        bearing: is3D ? -18 : 0,
        pitch: is3D ? 60 : 0,
        duration: 450,
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [centerPoint, is3D, isLoaded, map, vendorPoints]);

  return null;
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
  const [style, setStyle] = useState<MapStyleKey>(defaultMapStyle);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(demoVendors[0]?.id ?? null);

  const selectedStyle = mapStyles[style];
  const is3D = style === 'openstreetmap3d';

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

  useEffect(() => {
    const loadActiveOrder = async () => {
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
    };

    void loadActiveOrder();

    const intervalId = window.setInterval(() => {
      void loadActiveOrder();
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const browseVendors = useMemo(() => {
    const merged = [
      ...demoVendors,
      ...liveVendors
        .map((vendor) => toBrowseVendor(vendor))
        .filter((vendor): vendor is BrowseVendor => Boolean(vendor))
        .filter((vendor) => !demoVendors.some((demoVendor) => demoVendor.id === vendor.id)),
    ];

    const normalizedSearch = search.trim().toLowerCase();

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
  }, [coords, liveVendors, search, sortBy]);

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
  const center: [number, number] = [coords.lng, coords.lat];

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
        <div className="panel-card space-y-5 p-5">
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

          <div className="grid gap-3 md:grid-cols-3">
            <div className="panel-muted px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
                Nearby now
              </p>
              <p className="mt-2 text-3xl font-semibold text-[color:var(--color-text)]">
                {browseVendors.length}
              </p>
              <p className="mt-1 text-sm text-[color:var(--color-text-soft)]">
                Visible shops inside the Santa Maria browse radius
              </p>
            </div>
            <div className="panel-muted px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
                Top rated
              </p>
              <p className="mt-2 text-3xl font-semibold text-[color:var(--color-text)]">
                {topRatedCount}
              </p>
              <p className="mt-1 text-sm text-[color:var(--color-text-soft)]">
                Local picks rated 4.7 and above
              </p>
            </div>
            <div className="panel-muted px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
                Browse anchor
              </p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--color-text)]">
                Santa Maria town center
              </p>
              <p className="mt-1 text-sm text-[color:var(--color-text-soft)]">
                Use locate on the map if you want your exact current spot
              </p>
            </div>
          </div>
        </div>

        <div className="panel-card flex h-full flex-col gap-4 p-5">
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
        </div>
      </section>

      {activeOrder ? (
        <section className="panel-card flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
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
        </section>
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
          <div className="panel-card p-4 md:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Santa Maria shop map</h2>
                <p className="subtle-copy">
                  A bigger map view with local pins, 3D mode, and a live selected-shop panel.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{browseVendors.length} pins</Badge>
                <Badge variant="success">{formatDistanceLabel(0)}</Badge>
              </div>
            </div>

            <div className="relative min-h-[560px] overflow-hidden rounded-[28px] border border-[color:var(--color-border)] h-[min(76vh,760px)]">
              <Map
                center={center}
                zoom={14.2}
                className="h-full w-full"
                styles={selectedStyle}
              >
                <BrowseMapViewport vendorPoints={browseVendors} centerPoint={coords} is3D={is3D} />

                <MapMarker longitude={coords.lng} latitude={coords.lat} anchor="bottom" offset={[0, 6]}>
                  <MarkerContent>
                    <div className="pointer-events-none flex items-center gap-2">
                      <span className="inline-flex h-4 w-4 rounded-full border-[3px] border-white bg-[#223547] shadow-[0_12px_22px_rgba(15,23,42,0.26)]" />
                      <span className="inline-flex rounded-full border border-[color:var(--color-overlay-border)] bg-[color:var(--color-overlay-bg)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)] shadow-[0_14px_28px_rgba(15,23,42,0.14)] backdrop-blur-sm">
                        Anchor
                      </span>
                    </div>
                  </MarkerContent>
                  <MarkerPopup closeButton className="min-w-[220px] rounded-2xl border-[color:var(--color-overlay-border)] p-4">
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary-dark)]">
                        Browse center
                      </p>
                      <p className="text-sm font-semibold text-[color:var(--color-text)]">
                        Santa Maria, Bulacan
                      </p>
                      <p className="text-xs leading-5 text-[color:var(--color-text-soft)]">
                        This is the default local anchor for distance sorting and browse focus.
                      </p>
                    </div>
                  </MarkerPopup>
                </MapMarker>

                {browseVendors.map((vendor) => {
                  const isSelected = vendor.id === selectedVendor?.id;

                  return (
                    <MapMarker
                      key={vendor.id}
                      longitude={vendor.longitude}
                      latitude={vendor.latitude}
                      anchor="bottom"
                      offset={[0, 4]}
                      onClick={() => setSelectedVendorId(vendor.id)}
                    >
                      <MarkerContent>
                        <div className="pointer-events-none flex items-center gap-2">
                          <span
                            className={cn(
                              'relative inline-flex h-4 w-4 rounded-full border-[3px] border-white bg-[#eb6a2d] shadow-[0_12px_22px_rgba(15,23,42,0.22)] transition duration-200',
                              isSelected && 'scale-125 bg-[#223547]',
                            )}
                          />
                          {isSelected ? (
                            <span className="inline-flex rounded-full border border-[color:var(--color-overlay-border)] bg-[color:var(--color-overlay-bg)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)] shadow-[0_14px_28px_rgba(15,23,42,0.14)] backdrop-blur-sm">
                              {vendor.name}
                            </span>
                          ) : null}
                        </div>
                      </MarkerContent>
                      <MarkerPopup closeButton className="min-w-[260px] rounded-2xl border-[color:var(--color-overlay-border)] p-4">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary-dark)]">
                              {vendor.neighborhood || 'Santa Maria'}
                            </p>
                            <p className="text-sm font-semibold text-[color:var(--color-text)]">
                              {vendor.name}
                            </p>
                            <p className="text-xs leading-5 text-[color:var(--color-text-soft)]">
                              {vendor.address}
                            </p>
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
                          <Button asChild size="sm" className="w-full">
                            <Link to={`/vendor/${vendor.id}`}>Open menu</Link>
                          </Button>
                        </div>
                      </MarkerPopup>
                    </MapMarker>
                  );
                })}

                <MapControls
                  position="bottom-right"
                  showZoom
                  showCompass
                  showLocate
                  showFullscreen
                  onLocate={({ latitude, longitude }) => {
                    setCoords({ lat: latitude, lng: longitude });
                    toast.success('Using your current location for nearby sorting');
                  }}
                />
              </Map>

              <div className="absolute right-3 top-3 z-10">
                <MapStyleSelect value={style} onChange={setStyle} />
              </div>

              {selectedVendor ? (
                <div className="absolute bottom-4 left-4 z-10 hidden max-w-sm rounded-[24px] border border-[color:var(--color-overlay-border)] bg-[color:var(--color-overlay-bg)] p-4 shadow-[0_20px_40px_rgba(15,23,42,0.18)] backdrop-blur-sm md:block">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary-dark)]">
                        Highlighted shop
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-[color:var(--color-text)]">
                        {selectedVendor.name}
                      </h3>
                    </div>
                    <Badge>{selectedVendor.spotlight || 'Nearby'}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--color-text-soft)]">
                    {selectedVendor.description}
                  </p>
                  <div className="mt-4 grid gap-2 text-sm text-[color:var(--color-text-soft)]">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[color:var(--color-primary-dark)]" />
                      <span>{selectedVendor.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-[color:var(--color-primary-dark)]" />
                      <span>{selectedVendor.etaMinutes || '20-35 min'}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button asChild size="sm">
                      <Link to={`/vendor/${selectedVendor.id}`}>Open menu</Link>
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

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
          <div className="grid gap-4 md:grid-cols-3">
            {browseVendors.slice(0, 3).map((vendor) => (
              <div key={`${vendor.id}-feature`} className="panel-card p-5">
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
              </div>
            ))}
          </div>

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
