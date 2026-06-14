import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ShoppingBag, Star, Gift, Bike, Percent, MessageSquare } from "lucide-react";
import {
  getDemoVendorById,
  isDemoVendorId,
  type DemoVendor,
} from "@/data/demoVendors";
import {
  defaultMapStyle,
  type MapStyleKey,
} from "@/components/maps/map-styles";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/motion/Reveal";
import { useCart } from "@/hooks/useCart";
import { getVendorMenu } from "@/services/menuService";
import { getVendorById } from "@/services/vendorService";
import { getActivePromotions } from "@/services/promotionService";
import { getVendorRatings } from "@/services/ratingService";
import { MenuItem, Vendor, Promotion, Rating } from "@/types";
import { formatCurrency } from "@/utils/helpers";
import { toast } from "sonner";
import { VendorMenuFilters } from "@/features/customer/vendor-menu/VendorMenuFilters";
import { VendorMenuSections } from "@/features/customer/vendor-menu/VendorMenuSections";
import { VendorSidebar } from "@/features/customer/vendor-menu/VendorSidebar";
import { VendorStorefrontHero } from "@/features/customer/vendor-menu/VendorStorefrontHero";

export function VendorMenuPage() {
  const { id } = useParams<{ id: string }>();
  const { items, addItem, updateQuantity } = useCart();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuSearch, setMenuSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [style, setStyle] = useState<MapStyleKey>(defaultMapStyle);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalRatingCount, setTotalRatingCount] = useState(0);
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
        const [vendorData, menuData, promoData, ratingData] = await Promise.all([
          getVendorById(id),
          getVendorMenu(id),
          getActivePromotions(id).catch(() => [] as Promotion[]),
          getVendorRatings(id).catch(() => ({ averageScore: 0, totalRatings: 0, ratings: [] })),
        ]);
        setVendor(vendorData);
        setMenuItems(menuData);
        setPromotions(promoData);
        setRatings(ratingData.ratings);
        setAvgRating(ratingData.averageScore);
        setTotalRatingCount(ratingData.totalRatings);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Failed to load menu",
        );
        toast.error("Failed to load menu data");
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

      if (
        activeCategory !== "all" &&
        (item.category?.trim() || "Chef specials") !== activeCategory
      ) {
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
    return filteredItems.reduce<Record<string, MenuItem[]>>(
      (accumulator, item) => {
        const category = item.category?.trim() || "Chef specials";
        accumulator[category] = accumulator[category] ?? [];
        accumulator[category].push(item);
        return accumulator;
      },
      {},
    );
  }, [filteredItems]);

  const categories = useMemo(
    () => [
      "all",
      ...new Set(
        menuItems.map((item) => item.category?.trim() || "Chef specials"),
      ),
    ],
    [menuItems],
  );

  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory("all");
    }
  }, [activeCategory, categories]);

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
        caughtError instanceof Error
          ? caughtError.message
          : "Could not add item",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-[1600px] mx-auto px-6 py-12 lg:px-12">
        <Skeleton className="h-64 rounded-none border-b border-border" />
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px] mt-12">
          <div className="space-y-8">
            <Skeleton className="h-32 rounded-none border border-border" />
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-56 rounded-none border border-border" />
            ))}
          </div>
          <Skeleton className="h-[420px] rounded-none border border-border" />
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center border-b border-border">
        <h1 className="text-4xl font-medium tracking-tighter mb-4">Vendor not available</h1>
        <p className="text-lg text-muted-foreground mb-8">
          {error || "The vendor you are looking for could not be loaded right now."}
        </p>
        <Link to="/browse" className="border border-border px-6 py-3 font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors">
          Back to browse
        </Link>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="w-full max-w-[1600px] mx-auto px-6 py-12 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b-2 border-foreground pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Vendor</p>
            <h1 className="text-5xl font-medium tracking-tighter text-foreground">{vendor.name}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/browse" className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
              Back to shops
            </Link>
            {cartCount > 0 ? (
              <Link to="/cart" className="flex items-center gap-2 border border-border bg-foreground text-background px-6 py-3 text-sm font-bold uppercase tracking-widest transition-colors hover:opacity-90">
                <ShoppingBag className="h-4 w-4" />
                View cart ({cartCount})
              </Link>
            ) : null}
          </div>
        </div>

        <section className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="space-y-12">
            <Reveal delay={0.02}>
              <VendorStorefrontHero
                vendor={vendor}
                vendorMeta={vendorMeta}
                filteredCount={filteredItems.length}
              />
            </Reveal>

            <Reveal delay={0.08}>
              <VendorMenuFilters
                menuSearch={menuSearch}
                onMenuSearchChange={setMenuSearch}
                showAvailableOnly={showAvailableOnly}
                onToggleAvailableOnly={() =>
                  setShowAvailableOnly((current) => !current)
                }
                categories={categories}
                activeCategory={activeCategory}
                onActiveCategoryChange={setActiveCategory}
              />
            </Reveal>

            {/* Active Promotions */}
            {promotions.length > 0 && (
              <div className="space-y-3">
                {promotions.map((promo) => {
                  const Icon = promo.type === 'percentage' ? Percent : promo.type === 'free_delivery' ? Bike : Gift;
                  return (
                    <div key={promo.id} className="border border-primary/20 bg-primary/5 p-4 flex items-center gap-4">
                      <Icon className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-foreground">{promo.name}</p>
                        {promo.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{promo.description}</p>
                        )}
                      </div>
                      {promo.minOrderAmount && promo.minOrderAmount > 0 && (
                        <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0 border border-border px-2 py-1">
                          Min. {formatCurrency(promo.minOrderAmount)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <VendorMenuSections
              groupedItems={groupedItems}
              getItemQuantity={getItemQuantity}
              onAddItem={handleAddItem}
              onUpdateQuantity={updateQuantity}
            />

            {/* Customer Reviews */}
            {ratings.length > 0 && (
              <div className="border-t border-border pt-12 mt-12">
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Reviews</p>
                    <h2 className="text-3xl font-medium tracking-tighter">What customers say</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold tracking-tight">{avgRating.toFixed(1)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < Math.round(avgRating) ? 'text-yellow-400' : 'text-muted-foreground/30'}`} fill={i < Math.round(avgRating) ? 'currentColor' : 'none'} />
                      ))}
                      <span className="text-[10px] text-muted-foreground ml-1">({totalRatingCount})</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {ratings.slice(0, 5).map((rating) => (
                    <div key={rating.id} className="border border-border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < rating.score ? 'text-yellow-400' : 'text-muted-foreground/30'}`} fill={i < rating.score ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                      {rating.feedback && (
                        <p className="text-sm text-muted-foreground leading-relaxed">"{rating.feedback}"</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-2 font-bold uppercase tracking-widest">
                        {rating.customerName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border xl:border-none pt-12 xl:pt-0">
            <VendorSidebar
              cartCount={cartCount}
              cartTotal={cartTotal}
              vendor={vendor}
              vendorMeta={vendorMeta}
              style={style}
              onStyleChange={setStyle}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
