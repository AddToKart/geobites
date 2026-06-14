import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { List, MapIcon, Store, Plus, Search } from 'lucide-react';
import { demoVendors, getVendorDistanceKm, isNearSantaMariaBulacan, santaMariaBulacanCenter } from '@/data/demoVendors';
import { useVisiblePolling } from '@/hooks/useVisiblePolling';
import { getOrders } from '@/services/orderService';
import { getVendors } from '@/services/vendorService';
import { searchMenuItems, DishSearchResult } from '@/services/menuService';
import { Order, Vendor, MenuItem } from '@/types';
import { toast } from 'sonner';
import { BrowseOverviewSection } from '@/features/customer/browse/BrowseOverviewSection';
import { BrowseResultsSection } from '@/features/customer/browse/BrowseResultsSection';
import type { BrowseSort, BrowseVendor, BrowseViewMode } from '@/features/customer/browse/types';
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal';
import { formatCurrency } from '@/utils/helpers';
import { useCart } from '@/hooks/useCart';

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

const CATEGORIES = [
  'All',
  'Silog',
  'Ihaw-Ihaw',
  'Pancit & Noodles',
  'Desserts & Sweet',
  'Burgers & Fast Food',
  'Coffee & Drinks',
  'Street Food',
];

export function BrowseVendorsPagePremium() {
  const navigate = useNavigate();
  const { addItem, vendorId: cartVendorId, clearCart } = useCart();
  const [liveVendors, setLiveVendors] = useState<Vendor[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy] = useState<BrowseSort>('distance');
  const [coords, setCoords] = useState(santaMariaBulacanCenter);
  const [viewMode, setViewMode] = useState<BrowseViewMode>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(demoVendors[0]?.id ?? null);
  const [dishResults, setDishResults] = useState<DishSearchResult[]>([]);
  const [searchingDishes, setSearchingDishes] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (search.trim().length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [search]);

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

  // Dish search — runs when deferred search changes
  useEffect(() => {
    const trimmed = deferredSearch.trim();
    if (trimmed.length < 2) {
      setDishResults([]);
      return;
    }
    let cancelled = false;
    setSearchingDishes(true);
    searchMenuItems(trimmed).then((results) => {
      if (!cancelled) {
        setDishResults(results);
        setSearchingDishes(false);
      }
    });
    return () => { cancelled = true; };
  }, [deferredSearch]);

  const allVendors = useMemo(() => {
    return [
      ...demoVendors.map((vendor) => ({
        ...vendor,
        distance: getVendorDistanceKm(coords, { lat: vendor.latitude, lng: vendor.longitude }),
      })),
      ...liveVendors
        .map((vendor) => toBrowseVendor(vendor, coords))
        .filter((vendor): vendor is BrowseVendor => Boolean(vendor))
        .filter((vendor) => !demoVendors.some((demoVendor) => demoVendor.id === vendor.id)),
    ];
  }, [coords, liveVendors]);

  const browseVendors = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    const filtered = allVendors.filter((vendor) => {
      // 1. Search query filter
      const matchesSearch = !normalizedSearch || [vendor.name, vendor.description, vendor.address, vendor.neighborhood]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch));

      if (!matchesSearch) return false;

      // 2. Category selection filter
      if (selectedCategory === 'All') return true;

      const categoryLower = selectedCategory.toLowerCase();
      const keywords: Record<string, string[]> = {
        'silog': ['silog', 'breakfast', 'almusal', 'tapsi'],
        'ihaw-ihaw': ['ihaw', 'grill', 'barbecue', 'bbq', 'liempo', 'inasal'],
        'pancit & noodles': ['pancit', 'noodles', 'bihon', 'canton', 'mami'],
        'desserts & sweet': ['dessert', 'sweet', 'halo-halo', 'ice cream', 'cake', 'flan', 'buko'],
        'burgers & fast food': ['burger', 'fries', 'chicken', 'fast food', 'pizza'],
        'coffee & drinks': ['coffee', 'drinks', 'kape', 'beverage', 'latte', 'tea', 'cooler'],
        'street food': ['street food', 'tusok-tusok', 'snack', 'siomai', 'kwek-kwek', 'fishball'],
      };

      const targetKeywords = keywords[categoryLower] || [categoryLower];
      const vendorText = [
        vendor.name,
        vendor.description,
        ...(vendor.specialties || []),
      ].join(' ').toLowerCase();

      return targetKeywords.some(keyword => vendorText.includes(keyword));
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
  }, [allVendors, deferredSearch, sortBy, selectedCategory]);

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

  const handleAddDishToCart = (item: MenuItem, vendorId: string) => {
    if (cartVendorId && cartVendorId !== vendorId) {
      clearCart();
    }
    addItem(item);
    toast.success(`${item.name} added to cart`, {
      action: { label: "View Cart", onClick: () => navigate('/cart') },
    });
  };

  const dishSuggestions = deferredSearch.trim().length >= 2 && dishResults.length > 0 ? (
    <Reveal className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[400px] overflow-y-auto border border-border bg-background/98 backdrop-blur-md shadow-2xl">
      <div className="divide-y divide-border">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-background/50">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {searchingDishes ? "Searching dishes..." : `${dishResults.reduce((s, r) => s + r.items.length, 0)} dish(es) found across ${dishResults.length} vendor(s)`}
          </p>
        </div>
        <Stagger className="divide-y divide-border">
          {dishResults.map((result) => (
            <StaggerItem key={result.vendor.id}>
              <div className="px-6 py-5 hover:bg-secondary/10 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <Link to={`/vendor/${result.vendor.id}`} className="group/vendor">
                    <p className="text-sm font-bold tracking-tight text-foreground group-hover/vendor:text-primary transition-colors">
                      {result.vendor.name} →
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      ★ {result.vendor.rating.toFixed(1)} ({result.vendor.totalRatings})
                    </p>
                  </Link>
                </div>
                <div className="grid gap-2">
                  {result.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 pl-4 border-l-2 border-border hover:border-primary transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-md">{item.description}</p>
                        )}
                        <p className="text-sm font-bold text-foreground mt-0.5">{formatCurrency(item.price)}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddDishToCart(item, result.vendor.id);
                        }}
                        className="ml-4 shrink-0 h-10 w-10 border border-border flex items-center justify-center hover:bg-foreground hover:text-background transition-colors cursor-pointer"
                        title="Add to cart"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </Reveal>
  ) : null;

  if (viewMode === 'map') {
    return (
      <div className="absolute inset-0 z-0 h-[100dvh] w-full overflow-hidden bg-background">
        <BrowseResultsSection
          isLoading={isLoading}
          browseVendors={browseVendors}
          allVendors={allVendors}
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
          <div className="pointer-events-auto max-w-3xl mx-auto" ref={searchContainerRef}>
            <BrowseOverviewSection
              search={search}
              onSearchChange={setSearch}
              browseCount={browseVendors.length}
              activeOrder={activeOrder}
              isMapMode={true}
              suggestions={showSuggestions ? dishSuggestions : null}
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
        <div ref={searchContainerRef} className="relative w-full z-40">
          <BrowseOverviewSection
            search={search}
            onSearchChange={setSearch}
            browseCount={browseVendors.length}
            activeOrder={activeOrder}
            suggestions={showSuggestions ? dishSuggestions : null}
          />
        </div>

        {/* Sticky Categories Bar */}
        <div className="sticky top-16 md:top-0 bg-background/95 backdrop-blur-md z-30 py-4 -mx-6 px-6 border-b border-border/50">
          <Reveal delay={0.1} className="flex flex-nowrap md:flex-wrap gap-3 overflow-x-auto md:overflow-x-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
            {CATEGORIES.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`shrink-0 border px-6 py-3 text-sm font-bold uppercase tracking-widest transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary font-extrabold'
                      : 'border-border bg-transparent text-foreground hover:bg-secondary/40'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </Reveal>
        </div>
        
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
          allVendors={allVendors}
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
