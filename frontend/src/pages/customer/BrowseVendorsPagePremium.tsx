import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { List, MapIcon, Store } from 'lucide-react';
import { demoVendors, getVendorDistanceKm, isNearSantaMariaBulacan, santaMariaBulacanCenter } from '@/data/demoVendors';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { useVisiblePolling } from '@/hooks/useVisiblePolling';
import { getOrders } from '@/services/orderService';
import { getVendors } from '@/services/vendorService';
import { Order, Vendor } from '@/types';
import { toast } from 'sonner';
import { BrowseOverviewSection } from '@/features/customer/browse/BrowseOverviewSection';
import { BrowseResultsSection } from '@/features/customer/browse/BrowseResultsSection';
import type { BrowseSort, BrowseVendor, BrowseViewMode } from '@/features/customer/browse/types';

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

export function BrowseVendorsPagePremium() {
  const [liveVendors, setLiveVendors] = useState<Vendor[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<BrowseSort>('distance');
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

      <BrowseOverviewSection
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onResetArea={() => {
          setCoords(santaMariaBulacanCenter);
          toast.success('Centered back on Santa Maria, Bulacan');
        }}
        browseCount={browseVendors.length}
        topRatedCount={topRatedCount}
        featuredCount={featuredCount}
        selectedVendor={selectedVendor}
        activeOrder={activeOrder}
      />

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
  );
}
