import { useEffect, useMemo, useState } from 'react';
import { VendorCard } from '../../components/custom/VendorCard';
import { Skeleton } from '../../components/ui/skeleton';
import { useApi } from '../../hooks/useApi';
import { getVendors } from '../../services/vendorService';
import { Vendor } from '../../types';

export function BrowseVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'distance' | 'name'>('rating');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const { execute, isLoading } = useApi(getVendors);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords: position }) => {
        setCoords({ lat: position.latitude, lng: position.longitude });
      },
      () => {
        setCoords(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
      },
    );
  }, []);

  useEffect(() => {
    void (async () => {
      const response = await execute({
        search,
        sortBy,
        lat: sortBy === 'distance' ? coords?.lat : undefined,
        lng: sortBy === 'distance' ? coords?.lng : undefined,
        page: 1,
        limit: 20,
      });
      setVendors(response.data);
    })();
  }, [coords?.lat, coords?.lng, execute, search, sortBy]);

  const activeVendors = useMemo(
    () => vendors.filter((vendor) => vendor.isActive),
    [vendors],
  );

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h1 className="text-3xl font-semibold text-[var(--color-text)]">Browse Vendors</h1>
        <p className="mt-1 text-sm text-[var(--color-text-soft)]">
          Discover local food businesses and place your next order.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            className="h-11 min-w-[240px] flex-1 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-[var(--color-primary)]"
            placeholder="Search vendor name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="h-11 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm"
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as 'rating' | 'distance' | 'name')
            }
          >
            <option value="rating">Sort by rating</option>
            <option value="distance">Sort by distance</option>
            <option value="name">Sort by name</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-48" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeVendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      )}
    </section>
  );
}
