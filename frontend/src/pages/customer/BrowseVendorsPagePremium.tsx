import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, List, MapIcon, Search, SlidersHorizontal } from 'lucide-react';
import { OrderRouteMap } from '@/components/maps/OrderRouteMap';
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
import { useApi } from '@/hooks/useApi';
import { getOrders } from '@/services/orderService';
import { getVendors } from '@/services/vendorService';
import { Order, Vendor } from '@/types';
import { toast } from 'sonner';

const defaultCenter: [number, number] = [104.9282, 11.5564]; // Phnom Penh [lng, lat]

function BrowseMapViewport({
  vendorPoints,
  userPoint,
  is3D,
}: {
  vendorPoints: Array<Pick<Vendor, 'id' | 'name' | 'address' | 'latitude' | 'longitude'>>;
  userPoint: { lat: number; lng: number } | null;
  is3D: boolean;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!isLoaded || !map) {
      return;
    }

    const points = [
      ...vendorPoints.map((vendor) => ({ lat: vendor.latitude, lng: vendor.longitude })),
      ...(userPoint ? [userPoint] : []),
    ];

    if (points.length === 0) {
      map.easeTo({
        center: defaultCenter,
        zoom: 12.5,
        bearing: is3D ? -16 : 0,
        pitch: is3D ? 60 : 0,
        duration: 900,
      });
      return;
    }

    if (points.length === 1) {
      map.easeTo({
        center: [points[0].lng, points[0].lat],
        zoom: 14.6,
        bearing: is3D ? -16 : 0,
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
        padding: 80,
        duration: 900,
        maxZoom: 14.8,
      },
    );

    const frameId = window.requestAnimationFrame(() => {
      map.easeTo({
        bearing: is3D ? -16 : 0,
        pitch: is3D ? 60 : 0,
        duration: 500,
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [is3D, isLoaded, map, userPoint, vendorPoints]);

  return null;
}

export function BrowseVendorsPagePremium() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'distance' | 'name'>('rating');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'grid'>('grid');
  const [style, setStyle] = useState<MapStyleKey>(defaultMapStyle);

  const { execute, isLoading } = useApi(getVendors);
  const selectedStyle = mapStyles[style];
  const is3D = style === 'openstreetmap3d';

  useEffect(() => {
    if (!navigator.geolocation) {
      setCoords({ lat: defaultCenter[1], lng: defaultCenter[0] });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords: position }) => {
        setCoords({ lat: position.latitude, lng: position.longitude });
      },
      () => {
        setCoords({ lat: defaultCenter[1], lng: defaultCenter[0] });
      },
      { enableHighAccuracy: false, timeout: 5000 },
    );
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const response = await execute({
          search,
          sortBy,
          lat: sortBy === 'distance' ? coords?.lat : undefined,
          lng: sortBy === 'distance' ? coords?.lng : undefined,
          page: 1,
          limit: 50,
        });
        setVendors(response.data);
      } catch {
        toast.error('Failed to load restaurants');
      }
    })();
  }, [coords?.lat, coords?.lng, execute, search, sortBy]);

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

  const activeVendors = useMemo(
    () => vendors.filter((vendor) => vendor.isActive),
    [vendors],
  );

  const topRatedCount = useMemo(
    () => activeVendors.filter((vendor) => vendor.rating >= 4.5).length,
    [activeVendors],
  );

  const center: [number, number] = coords ? [coords.lng, coords.lat] : defaultCenter;
  const vendorMapPoints = useMemo(
    () =>
      activeVendors.filter(
        (vendor) =>
          typeof vendor.latitude === 'number' && Number.isFinite(vendor.latitude) &&
          typeof vendor.longitude === 'number' && Number.isFinite(vendor.longitude),
      ),
    [activeVendors],
  );

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Customer"
        title="Browse restaurants"
        description="A quieter browse flow with clear filters, cleaner cards, and a focused map when you switch to map mode."
        actions={
          <>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <SlidersHorizontal className="h-4 w-4" />
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

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="panel-card p-4 md:p-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-text-light)]" />
              <Input
                placeholder="Search restaurants or cuisines"
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
              className="h-11 rounded-2xl border border-[color:var(--color-border)] bg-white/85 px-4 text-sm text-[color:var(--color-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
            >
              <option value="rating">Top rated first</option>
              <option value="distance">Closest first</option>
              <option value="name">A to Z</option>
            </select>
          </div>
        </div>

        <div className="panel-card flex flex-wrap gap-3 p-4 md:flex-col md:gap-4 md:p-5">
          <div>
            <p className="eyebrow">Overview</p>
            <p className="mt-2 text-3xl font-semibold text-[color:var(--color-text)]">
              {activeVendors.length}
            </p>
            <p className="subtle-copy">Available restaurants</p>
          </div>
          <div className="panel-muted flex items-center gap-3 px-4 py-3">
            <Compass className="h-4 w-4 text-[color:var(--color-primary-dark)]" />
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text)]">
                {coords ? 'Location ready' : 'Using fallback area'}
              </p>
              <p className="text-xs text-[color:var(--color-text-soft)]">
                Distance sorting works better with location enabled
              </p>
            </div>
          </div>
          <div className="panel-muted px-4 py-3">
            <p className="text-sm font-medium text-[color:var(--color-text)]">
              {topRatedCount} top rated
            </p>
            <p className="text-xs text-[color:var(--color-text-soft)]">Rated 4.5 and above</p>
          </div>
        </div>
      </section>

      {activeOrder ? (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_280px]">
          <OrderRouteMap
            order={activeOrder}
            title={`Active order #${activeOrder.id.slice(0, 8)}`}
            description="Your current order stays visible here so you can jump straight into delivery progress without leaving browse."
            compact
          />
          <div className="panel-card p-5">
            <p className="eyebrow">Current delivery</p>
            <h2 className="mt-2 text-2xl font-semibold capitalize">
              {activeOrder.status.replaceAll('_', ' ')}
            </h2>
            <p className="mt-3 subtle-copy">
              Shop, rider progress, and your drop-off pin stay linked on the same map.
            </p>
            <div className="mt-5">
              <Button asChild>
                <Link to={`/orders/${activeOrder.id}`}>Open live tracking</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {viewMode === 'map' ? (
        <section className="panel-card p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Restaurant map</h2>
              <p className="subtle-copy">
                Click the selector for a custom map style, then keep the 3D view active.
              </p>
            </div>
            <Badge>{activeVendors.length} pins</Badge>
          </div>

          <div className="relative h-[460px] overflow-hidden rounded-[24px] border border-[color:var(--color-border)]">
            <Map
              center={center}
              zoom={13.5}
              className="h-full w-full"
              styles={
                selectedStyle
                  ? { light: selectedStyle, dark: selectedStyle }
                  : undefined
              }
            >
              <BrowseMapViewport vendorPoints={vendorMapPoints} userPoint={coords} is3D={is3D} />

              {coords ? (
                <MapMarker
                  longitude={coords.lng}
                  latitude={coords.lat}
                  anchor="bottom"
                  offset={[0, 6]}
                >
                  <MarkerContent>
                    <div className="pointer-events-none flex items-center gap-2">
                      <span className="inline-flex h-4 w-4 rounded-full border-[3px] border-white bg-[#223547] shadow-[0_12px_22px_rgba(15,23,42,0.26)]" />
                      <span className="inline-flex rounded-full border border-white/85 bg-white/92 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)] shadow-[0_14px_28px_rgba(15,23,42,0.14)] backdrop-blur-sm">
                        You
                      </span>
                    </div>
                  </MarkerContent>
                  <MarkerPopup closeButton className="min-w-[220px] rounded-2xl border-white/70 p-4">
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary-dark)]">
                        Your location
                      </p>
                      <p className="text-sm font-semibold text-[color:var(--color-text)]">
                        Distance-aware browsing
                      </p>
                      <p className="text-xs leading-5 text-[color:var(--color-text-soft)]">
                        Nearby restaurants sort more accurately once your location is available.
                      </p>
                    </div>
                  </MarkerPopup>
                </MapMarker>
              ) : null}

              {vendorMapPoints.map((vendor) => (
                <MapMarker
                  key={vendor.id}
                  longitude={vendor.longitude}
                  latitude={vendor.latitude}
                  anchor="bottom"
                  offset={[0, 4]}
                >
                  <MarkerContent>
                    <div className="pointer-events-none relative">
                      <span className="absolute -inset-1 rounded-full bg-[#eb6a2d]/25 blur-sm" />
                      <span className="relative inline-flex h-4 w-4 rounded-full border-[3px] border-white bg-[#eb6a2d] shadow-[0_12px_22px_rgba(15,23,42,0.22)]" />
                    </div>
                  </MarkerContent>
                  <MarkerPopup closeButton className="min-w-[240px] rounded-2xl border-white/70 p-4">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary-dark)]">
                          Restaurant
                        </p>
                        <p className="text-sm font-semibold text-[color:var(--color-text)]">
                          {vendor.name}
                        </p>
                        <p className="text-xs leading-5 text-[color:var(--color-text-soft)]">
                          {vendor.address}
                        </p>
                      </div>
                      <Button asChild size="sm" className="w-full">
                        <Link to={`/vendors/${vendor.id}`}>Open menu</Link>
                      </Button>
                    </div>
                  </MarkerPopup>
                </MapMarker>
              ))}

              <MapControls
                position="bottom-right"
                showZoom
                showCompass
                showLocate
                showFullscreen
                onLocate={({ latitude, longitude }) => {
                  setCoords({ lat: latitude, lng: longitude });
                }}
              />
            </Map>

            <div className="absolute right-3 top-3 z-10">
              <MapStyleSelect value={style} onChange={setStyle} />
            </div>
          </div>
        </section>
      ) : viewMode === 'list' ? (
        <section className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-80 rounded-[24px]" />
              ))}
            </div>
          ) : activeVendors.length === 0 ? (
            <div className="panel-card py-16 text-center">
              <p className="text-lg font-semibold text-[color:var(--color-text)]">
                No restaurants found
              </p>
              <p className="mt-2 text-sm text-[color:var(--color-text-soft)]">
                Try a different search or sort order.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {activeVendors.map((vendor) => (
                <VendorCardPremium key={vendor.id} vendor={vendor} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-80 rounded-[24px]" />
              ))}
            </div>
          ) : activeVendors.length === 0 ? (
            <div className="panel-card py-16 text-center">
              <p className="text-lg font-semibold text-[color:var(--color-text)]">
                No restaurants found
              </p>
              <p className="mt-2 text-sm text-[color:var(--color-text-soft)]">
                Try a different search or sort order.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {activeVendors.map((vendor) => (
                <VendorCardPremium key={vendor.id} vendor={vendor} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
