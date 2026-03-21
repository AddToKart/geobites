import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Clock3,
  MapPin,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
} from 'lucide-react';
import { getDemoVendorById, isDemoVendorId, type DemoVendor } from '@/data/demoVendors';
import { MapStyleSelect } from '@/components/maps/MapStyleSelect';
import { defaultMapStyle, mapStyles, type MapStyleKey } from '@/components/maps/map-styles';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal';
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  useMap,
} from '@/components/ui/map';
import { useCart } from '@/hooks/useCart';
import { cn } from '@/lib/utils';
import { getVendorMenu } from '@/services/menuService';
import { getVendorById } from '@/services/vendorService';
import { MenuItem, Vendor } from '@/types';
import { formatCurrency } from '@/utils/helpers';
import { toast } from 'sonner';

function VendorMapCamera({
  vendor,
  is3D,
}: {
  vendor: Vendor;
  is3D: boolean;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!isLoaded || !map) {
      return;
    }

    map.jumpTo({
      center: [vendor.longitude, vendor.latitude],
      zoom: 15.1,
    });
  }, [isLoaded, map, vendor.latitude, vendor.longitude]);

  useEffect(() => {
    if (!isLoaded || !map) {
      return;
    }

    map.easeTo({
      bearing: is3D ? -18 : 0,
      pitch: is3D ? 60 : 0,
      duration: 260,
    });
  }, [is3D, isLoaded, map]);

  return null;
}

export function VendorMenuPage() {
  const { id } = useParams<{ id: string }>();
  const { items, addItem, updateQuantity } = useCart();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuSearch, setMenuSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [style, setStyle] = useState<MapStyleKey>(defaultMapStyle);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const deferredMenuSearch = useDeferredValue(menuSearch);

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [vendorData, menuData] = await Promise.all([getVendorById(id), getVendorMenu(id)]);
        setVendor(vendorData);
        setMenuItems(menuData);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load menu');
        toast.error('Failed to load menu data');
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [id]);

  const vendorMeta = useMemo<DemoVendor | null>(() => {
    if (!id || !isDemoVendorId(id)) {
      return null;
    }

    return getDemoVendorById(id);
  }, [id]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = deferredMenuSearch.trim().toLowerCase();

    return menuItems.filter((item) => {
      if (showAvailableOnly && !item.isAvailable) {
        return false;
      }

      if (activeCategory !== 'all' && (item.category?.trim() || 'Chef specials') !== activeCategory) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [item.name, item.description, item.category]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch));
    });
  }, [activeCategory, deferredMenuSearch, menuItems, showAvailableOnly]);

  const groupedItems = useMemo(() => {
    return filteredItems.reduce<Record<string, MenuItem[]>>((accumulator, item) => {
      const category = item.category?.trim() || 'Chef specials';
      accumulator[category] = accumulator[category] ?? [];
      accumulator[category].push(item);
      return accumulator;
    }, {});
  }, [filteredItems]);

  const categories = useMemo(
    () => ['all', ...new Set(menuItems.map((item) => item.category?.trim() || 'Chef specials'))],
    [menuItems],
  );

  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory('all');
    }
  }, [activeCategory, categories]);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);

  const getItemQuantity = (itemId: string) =>
    items.find((item) => item.menuItem.id === itemId)?.quantity || 0;

  const handleAddItem = (item: MenuItem) => {
    try {
      addItem(item);
      toast.success(`Added ${item.name} to your cart`);
    } catch (caughtError) {
      toast.error(caughtError instanceof Error ? caughtError.message : 'Could not add item');
    }
  };

  if (isLoading) {
    return (
      <div className="page-stack">
        <Skeleton className="h-56 rounded-[28px]" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <Skeleton className="h-32 rounded-[28px]" />
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-56 rounded-[28px]" />
            ))}
          </div>
          <Skeleton className="h-[420px] rounded-[28px]" />
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <Card className="mx-auto max-w-2xl p-8 text-center">
        <h1 className="text-2xl font-semibold">Vendor not available</h1>
        <p className="mt-3 subtle-copy">
          {error || 'The vendor you are looking for could not be loaded right now.'}
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link to="/browse">Back to browse</Link>
          </Button>
        </div>
      </Card>
    );
  }

  const selectedStyle = mapStyles[style];
  const is3D = style === 'openstreetmap3d';
  const visibleCategoryCount = Object.keys(groupedItems).length;

  return (
    <div className="page-stack pb-8">
      <PageHeader
        eyebrow="Vendor"
        title={vendor.name}
        description={
          vendor.description ||
          'Search the menu, filter by category, and order from a cleaner storefront instead of a long unstructured list.'
        }
        actions={
          <>
            <Button variant="ghost" asChild>
              <Link to="/browse">Back to browse</Link>
            </Button>
            {cartCount > 0 ? (
              <Button asChild>
                <Link to="/cart">
                  <ShoppingBag className="h-4 w-4" />
                  View cart ({cartCount})
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Reveal delay={0.02}>
            <Card className="overflow-hidden">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_320px]">
              <div className="space-y-5 p-6 md:p-7">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={vendor.isActive ? 'success' : 'warning'}>
                    {vendor.isActive ? 'Open now' : 'Closed'}
                  </Badge>
                  <Badge>{categories.length - 1} categories</Badge>
                  {vendorMeta ? <Badge>{vendorMeta.spotlight}</Badge> : null}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="panel-muted px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                      Rating
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
                      <Star className="h-4 w-4 fill-[color:var(--color-primary)] text-[color:var(--color-primary)]" />
                      {vendor.rating.toFixed(1)}
                    </div>
                  </div>
                  <div className="panel-muted px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                      ETA
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
                      <Clock3 className="h-4 w-4 text-[color:var(--color-primary-dark)]" />
                      {vendorMeta?.etaMinutes || '20-35 min'}
                    </div>
                  </div>
                  <div className="panel-muted px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                      Visible items
                    </p>
                    <div className="mt-2 text-lg font-semibold">{filteredItems.length}</div>
                  </div>
                </div>

                {(vendorMeta?.specialties?.length ?? 0) > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {vendorMeta!.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-xs font-medium text-[color:var(--color-text-soft)]"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col justify-between bg-[linear-gradient(135deg,#ef7c42,#f6b372)] p-6 text-white">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                    Shop address
                  </p>
                  <div className="mt-3 flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0" />
                    <p className="text-sm leading-6 text-white/90">{vendor.address}</p>
                  </div>
                </div>
                <p className="mt-8 text-sm leading-6 text-white/80">
                  Browse is structured here now: search the menu, jump between categories, and keep the cart summary visible without blocking the menu.
                </p>
              </div>
            </div>
            </Card>
          </Reveal>

          <Reveal delay={0.08}>
            <Card>
            <CardContent className="space-y-5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold">Menu filters</h2>
                  <p className="subtle-copy">
                    Search dishes, narrow by category, or hide unavailable items.
                  </p>
                </div>
                <Badge>{visibleCategoryCount} sections showing</Badge>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-text-light)]" />
                  <Input
                    placeholder="Search dishes or categories"
                    value={menuSearch}
                    onChange={(event) => setMenuSearch(event.target.value)}
                    className="pl-11"
                  />
                </label>
                <Button
                  variant={showAvailableOnly ? 'default' : 'ghost'}
                  onClick={() => setShowAvailableOnly((current) => !current)}
                >
                  <Sparkles className="h-4 w-4" />
                  {showAvailableOnly ? 'Showing available only' : 'Show available only'}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                      activeCategory === category
                        ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary-dark)]'
                        : 'border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text-soft)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text)]',
                    )}
                  >
                    {category === 'all' ? 'All items' : category}
                  </button>
                ))}
              </div>
            </CardContent>
            </Card>
          </Reveal>

          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-[color:var(--color-text-soft)]">
                No menu items matched the current filters.
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedItems).map(([category, categoryItems]) => (
              <section key={category} className="space-y-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold">{category}</h2>
                    <p className="subtle-copy">{categoryItems.length} items</p>
                  </div>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <Stagger delayChildren={0.02} stagger={0.05} className="contents">
                  {categoryItems.map((item) => {
                    const quantity = getItemQuantity(item.id);

                    return (
                      <StaggerItem key={item.id}>
                        <Card className="overflow-hidden">
                        <div className="h-36 bg-[linear-gradient(135deg,#fff2e5,#f9d2b7)]">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-end p-5">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-primary-dark)]">
                                  {item.category || 'Fresh pick'}
                                </p>
                                <p className="mt-2 text-lg font-semibold text-[color:var(--color-text)]">
                                  {item.name}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        <CardContent className="space-y-4 p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-semibold">{item.name}</h3>
                              <p className="mt-2 text-sm text-[color:var(--color-text-soft)]">
                                {item.description ||
                                  'Prepared fresh and ready for a straightforward checkout.'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold">{formatCurrency(item.price)}</p>
                              <p className="text-xs text-[color:var(--color-text-muted)]">
                                {item.isAvailable ? 'Available' : 'Unavailable'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 rounded-[20px] bg-[color:var(--color-surface-2)] px-4 py-3">
                            <span className="text-sm text-[color:var(--color-text-soft)]">
                              {item.category || 'Chef specials'}
                            </span>
                            {quantity > 0 ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => updateQuantity(item.id, quantity - 1)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center text-sm font-semibold">
                                  {quantity}
                                </span>
                                <Button
                                  size="icon-sm"
                                  onClick={() => handleAddItem(item)}
                                  disabled={!item.isAvailable}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleAddItem(item)}
                                disabled={!item.isAvailable}
                              >
                                Add to cart
                              </Button>
                            )}
                          </div>
                        </CardContent>
                        </Card>
                      </StaggerItem>
                    );
                  })}
                  </Stagger>
                </div>
              </section>
            ))
          )}
        </div>

        <div className="space-y-4 xl:sticky xl:top-8 xl:self-start">
          <Card>
            <CardContent className="space-y-5 p-5">
              <div>
                <p className="eyebrow">Cart</p>
                <h2 className="mt-2 text-2xl font-semibold">{cartCount} item(s)</h2>
                <p className="subtle-copy">
                  Keep everything from one vendor together and check out when you are ready.
                </p>
              </div>
              <div className="panel-muted space-y-3 px-4 py-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[color:var(--color-text-soft)]">Current subtotal</span>
                  <span className="font-semibold text-[color:var(--color-text)]">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[color:var(--color-text-soft)]">Vendor</span>
                  <span className="font-medium text-[color:var(--color-text)]">{vendor.name}</span>
                </div>
              </div>
              {cartCount > 0 ? (
                <Button asChild>
                  <Link to="/cart">
                    <ShoppingBag className="h-4 w-4" />
                    Go to cart
                  </Link>
                </Button>
              ) : (
                <Button disabled>
                  <ShoppingBag className="h-4 w-4" />
                  Go to cart
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold">Shop map</h2>
                  <p className="subtle-copy">See the pickup point customers and riders use.</p>
                </div>
                <Badge>{vendorMeta?.neighborhood || 'Local shop'}</Badge>
              </div>

              <div className="relative h-72 overflow-hidden rounded-[24px] border border-[color:var(--color-border)]">
                <Map
                  center={[vendor.longitude, vendor.latitude]}
                  zoom={15}
                  className="h-full w-full"
                  styles={selectedStyle}
                >
                  <VendorMapCamera vendor={vendor} is3D={is3D} />
                  <MapMarker longitude={vendor.longitude} latitude={vendor.latitude} anchor="bottom" offset={[0, 6]}>
                    <MarkerContent>
                      <div className="pointer-events-none flex items-center gap-2">
                        <span className="inline-flex h-4 w-4 rounded-full border-[3px] border-white bg-[#eb6a2d] shadow-[0_12px_22px_rgba(15,23,42,0.26)]" />
                        <span className="inline-flex rounded-full border border-[color:var(--color-overlay-border)] bg-[color:var(--color-overlay-bg)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)] shadow-[0_14px_28px_rgba(15,23,42,0.14)] backdrop-blur-sm">
                          Shop
                        </span>
                      </div>
                    </MarkerContent>
                    <MarkerPopup closeButton className="min-w-[220px] rounded-2xl border-[color:var(--color-overlay-border)] p-4">
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary-dark)]">
                          Pickup point
                        </p>
                        <p className="text-sm font-semibold text-[color:var(--color-text)]">
                          {vendor.name}
                        </p>
                        <p className="text-xs leading-5 text-[color:var(--color-text-soft)]">
                          {vendor.address}
                        </p>
                      </div>
                    </MarkerPopup>
                  </MapMarker>
                  <MapControls position="bottom-right" showZoom showCompass showFullscreen />
                </Map>

                <div className="absolute right-3 top-3 z-10">
                  <MapStyleSelect value={style} onChange={setStyle} />
                </div>
              </div>

              <div className="panel-muted space-y-2 px-4 py-4 text-sm text-[color:var(--color-text-soft)]">
                <p>{vendor.address}</p>
                <p>
                  {vendorMeta?.priceBand || '₱₱'} • {vendorMeta?.etaMinutes || '20-35 min'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
