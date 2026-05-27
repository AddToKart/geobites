import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import {
  getDemoVendorById,
  isDemoVendorId,
  type DemoVendor,
} from "@/data/demoVendors";
import {
  defaultMapStyle,
  type MapStyleKey,
} from "@/components/maps/map-styles";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/motion/Reveal";
import { useCart } from "@/hooks/useCart";
import { getVendorMenu } from "@/services/menuService";
import { getVendorById } from "@/services/vendorService";
import { MenuItem, Vendor } from "@/types";
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
        const [vendorData, menuData] = await Promise.all([
          getVendorById(id),
          getVendorMenu(id),
        ]);
        setVendor(vendorData);
        setMenuItems(menuData);
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
          {error ||
            "The vendor you are looking for could not be loaded right now."}
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link to="/browse">Back to browse</Link>
          </Button>
        </div>
      </Card>
    );
  }

  const visibleCategoryCount = Object.keys(groupedItems).length;

  return (
    <div className="page-stack pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <p className="eyebrow">Vendor</p>
          <h1 className="text-3xl font-bold tracking-tight">{vendor.name}</h1>
          <p className="subtle-copy mt-2 max-w-2xl">
            {vendor.description ||
              "Search the menu, filter by category, and order from a cleaner storefront instead of a long unstructured list."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="rounded-full font-bold px-6"
            asChild
          >
            <Link to="/browse">Back to browse</Link>
          </Button>
          {cartCount > 0 ? (
            <Button asChild className="rounded-full font-bold px-6">
              <Link to="/cart">
                <ShoppingBag className="h-4 w-4 mr-2" />
                View cart ({cartCount})
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Reveal delay={0.02}>
            <VendorStorefrontHero
              vendor={vendor}
              vendorMeta={vendorMeta}
              categoryCount={categories.length - 1}
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
              visibleCategoryCount={visibleCategoryCount}
            />
          </Reveal>

          <VendorMenuSections
            groupedItems={groupedItems}
            getItemQuantity={getItemQuantity}
            onAddItem={handleAddItem}
            onUpdateQuantity={updateQuantity}
          />
        </div>

        <VendorSidebar
          cartCount={cartCount}
          cartTotal={cartTotal}
          vendor={vendor}
          vendorMeta={vendorMeta}
          style={style}
          onStyleChange={setStyle}
        />
      </section>
    </div>
  );
}
