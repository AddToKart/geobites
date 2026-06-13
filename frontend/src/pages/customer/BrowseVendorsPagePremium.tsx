import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { List, MapIcon, Store } from 'lucide-react';
import { demoVendors, getVendorDistanceKm, isNearSantaMariaBulacan, santaMariaBulacanCenter } from '@/data/demoVendors';
import { useVisiblePolling } from '@/hooks/useVisiblePolling';
import { getOrders } from '@/services/orderService';
import { getVendors } from '@/services/vendorService';
import { Order, Vendor } from '@/types';
import { toast } from 'sonner';
import { BrowseOverviewSection } from '@/features/customer/browse/BrowseOverviewSection';
import { BrowseResultsSection } from '@/features/customer/browse/BrowseResultsSection';
import type { BrowseSort, BrowseVendor, BrowseViewMode } from '@/features/customer/browse/types';

function toBrowseVendor(vendor: Vendor, coords: { lat: number; lng: number }): BrowseVendor | null {
  if (
    typeof vendor.latitude !== 'number' ||
    typeof vendor.longitude !== 'number' ||
    !Number.isFinite(vendor.latitude) ||
    !Number.isFinite(vendor.longitude) ||
    !isNearSantaMariaBulacan(vendor.latitude, vendor.longitude)
  ) {
    return null;
  }

  const distance = getVendorDistanceKm(coords, { lat: vendor.latitude, lng: vendor.longitude });

  return {
    ...vendor,
    distance,
    etaMinutes: '22-34 min',
    neighborhood: 'Santa Maria',
    specialties: ['Local meals', 'Delivery ready'],
    priceBand: '₱₱',
    spotlight: 'Live shop',
  };
}

export function BrowseVendorsPagePremium() {
  const [liveVendors, setLiveVendors] = useState<Vendor[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy] = useState<BrowseSort>('distance');
  const [coords, setCoords] = useState(santaMariaBulacanCenter);
  const [viewMode, setViewMode] = useState<BrowseViewMode>('grid');
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
      startTransition(() => {
        setActiveOrder(trackedOrder);
      });
    } catch {
      startTransition(() => {
        setActiveOrder(null);
      });
    }
  }, 15000);

  const browseVendors = useMemo(() => {
    const merged = [
      ...demoVendors.map((vendor) => ({
        ...vendor,
        distance: getVendorDistanceKm(coords, { lat: vendor.latitude, lng: vendor.longitude }),
      })),
      ...liveVendors
        .map((vendor) => toBrowseVendor(vendor, coords))
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
        return firstVendor.distance - secondVendor.distance;
      }

      return secondVendor.rating - firstVendor.rating;
    });
  }, [coords, deferredSearch, liveVendors, sortBy]);

  const selectedVendor = useMemo(
    () => (selectedVendorId ? browseVendors.find((vendor) => vendor.id === selectedVendorId) ?? null : null),
    [browseVendors, selectedVendorId],
  );

  useEffect(() => {
    if (!browseVendors.length) {
      setSelectedVendorId(null);
      return;
    }

    if (selectedVendorId && !browseVendors.some((vendor) => vendor.id === selectedVendorId)) {
      setSelectedVendorId(browseVendors[0]?.id ?? null);
    }
  }, [browseVendors, selectedVendorId]);

  if (viewMode === 'map') {
    return (
      <div className="absolute inset-0 z-0 h-[100dvh] w-full overflow-hidden bg-background">
        <BrowseResultsSection
          isLoading={isLoading}
          browseVendors={browseVendors}
          viewMode="map"
          coords={coords}
          selectedVendor={selectedVendor}
          onSelectVendor={setSelectedVendorId}
          onLocate={(nextCoords) => {
            setCoords(nextCoords);
            toast.success('Using your current location for nearby sorting');
          }}
        />
        <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none p-4 md:p-8 pt-[80px] md:pt-8">
          <div className="pointer-events-auto max-w-3xl mx-auto">
            <BrowseOverviewSection
              search={search}
              onSearchChange={setSearch}
              browseCount={browseVendors.length}
              activeOrder={activeOrder}
              isMapMode={true}
            />
          </div>
        </div>
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center bg-background border-2 border-foreground">
          <button className="px-6 py-3 text-sm font-bold uppercase tracking-widest text-foreground hover:bg-secondary transition-colors" onClick={() => setViewMode('grid')}>
            <span className="flex items-center gap-2"><Store className="h-4 w-4" /> Grid</span>
          </button>
          <div className="w-px h-12 bg-foreground" />
          <button className="px-6 py-3 text-sm font-bold uppercase tracking-widest text-foreground hover:bg-secondary transition-colors" onClick={() => setViewMode('list')}>
            <span className="flex items-center gap-2"><List className="h-4 w-4" /> List</span>
          </button>
          <div className="w-px h-12 bg-foreground" />
          <button className="px-6 py-3 text-sm font-bold uppercase tracking-widest bg-foreground text-background" onClick={() => setViewMode('map')}>
            <span className="flex items-center gap-2"><MapIcon className="h-4 w-4" /> Map</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="flex flex-col w-full max-w-[1600px] mx-auto px-6 py-12 lg:px-12 lg:py-16">
        <BrowseOverviewSection
          search={search}
          onSearchChange={setSearch}
          browseCount={browseVendors.length}
          activeOrder={activeOrder}
        />
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mt-16 mb-4">
          <h2 className="text-3xl font-medium tracking-tighter text-foreground mb-4 sm:mb-0">
            Explore local kitchens
          </h2>
          <div className="flex items-center border border-border">
            <button className={`px-6 py-3 text-sm font-bold uppercase tracking-widest transition-colors ${viewMode === 'grid' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`} onClick={() => setViewMode('grid')}>
              Grid
            </button>
            <div className="w-px h-full bg-border" />
            <button className={`px-6 py-3 text-sm font-bold uppercase tracking-widest transition-colors ${viewMode === 'list' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`} onClick={() => setViewMode('list')}>
              List
            </button>
            <div className="w-px h-full bg-border" />
            <button className="px-6 py-3 text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" onClick={() => setViewMode('map')}>
              Map
            </button>
          </div>
        </div>

        <BrowseResultsSection
          isLoading={isLoading}
          browseVendors={browseVendors}
          viewMode={viewMode}
          coords={coords}
          selectedVendor={selectedVendor}
          onSelectVendor={setSelectedVendorId}
          onLocate={(nextCoords) => {
            setCoords(nextCoords);
            toast.success('Using your current location for nearby sorting');
          }}
        />
      </div>
    </div>
  );
}
