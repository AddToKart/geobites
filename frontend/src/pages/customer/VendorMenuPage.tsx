import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock3, MapPin, Minus, Plus, ShoppingBag, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { useCart } from '@/hooks/useCart';
import { getVendorMenu } from '@/services/menuService';
import { getVendorById } from '@/services/vendorService';
import { MenuItem, Vendor } from '@/types';
import { formatCurrency } from '@/utils/helpers';
import { toast } from 'sonner';

export function VendorMenuPage() {
  const { id } = useParams<{ id: string }>();
  const { items, addItem, updateQuantity } = useCart();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [vendorData, menuData] = await Promise.all([
          getVendorById(id),
          getVendorMenu(id),
        ]);
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

  const groupedItems = useMemo(() => {
    return menuItems.reduce<Record<string, MenuItem[]>>((accumulator, item) => {
      const category = item.category?.trim() || 'Chef specials';
      accumulator[category] = accumulator[category] ?? [];
      accumulator[category].push(item);
      return accumulator;
    }, {});
  }, [menuItems]);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = items.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0,
  );

  const getItemQuantity = (itemId: string) =>
    items.find((item) => item.menuItem.id === itemId)?.quantity || 0;

  const handleAddItem = (item: MenuItem) => {
    try {
      addItem(item);
      toast.success(`Added ${item.name} to your cart`);
    } catch (caughtError) {
      toast.error(
        caughtError instanceof Error ? caughtError.message : 'Could not add item',
      );
    }
  };

  if (isLoading) {
    return (
      <div className="page-stack">
        <Skeleton className="h-48 rounded-[28px]" />
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-56 rounded-[28px]" />
          ))}
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

  return (
    <div className="page-stack pb-8">
      <PageHeader
        eyebrow="Vendor"
        title={vendor.name}
        description={
          vendor.description ||
          'Quick ordering, clear categories, and a cart summary that stays out of the way until you need it.'
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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_320px]">
              <div className="p-6 md:p-7">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={vendor.isActive ? 'success' : 'warning'}>
                    {vendor.isActive ? 'Open now' : 'Closed'}
                  </Badge>
                  <Badge>{Object.keys(groupedItems).length} categories</Badge>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
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
                      20-35 min
                    </div>
                  </div>
                  <div className="panel-muted px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                      Items
                    </p>
                    <div className="mt-2 text-lg font-semibold">{menuItems.length} available</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between bg-[linear-gradient(135deg,#ef7c42,#f6b372)] p-6 text-white">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                    Delivery address
                  </p>
                  <div className="mt-3 flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0" />
                    <p className="text-sm leading-6 text-white/90">{vendor.address}</p>
                  </div>
                </div>
                <p className="mt-8 text-sm leading-6 text-white/80">
                  Cart stays vendor-locked, so you always know exactly where your order is coming from.
                </p>
              </div>
            </div>
          </Card>

          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <section key={category} className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold">{category}</h2>
                  <p className="subtle-copy">{categoryItems.length} items</p>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {categoryItems.map((item) => {
                  const quantity = getItemQuantity(item.id);

                  return (
                    <Card key={item.id} className="overflow-hidden">
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
                              <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
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
                  );
                })}
              </div>
            </section>
          ))}
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
        </div>
      </section>
    </div>
  );
}
