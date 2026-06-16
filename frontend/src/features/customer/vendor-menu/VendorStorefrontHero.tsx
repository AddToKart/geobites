import {
  Clock3,
  MapPin,
  Star,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import type { DemoVendor } from "@/data/demoVendors";
import type { Vendor } from "@/types";

export function VendorStorefrontHero({
  vendor,
  vendorMeta,
  filteredCount,
}: {
  vendor: Vendor;
  vendorMeta: DemoVendor | null;
  filteredCount: number;
}) {
  return (
    <div className="flex flex-col border-t border-border mt-12 pt-12">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row gap-12 justify-between items-start mb-16">
        <div className="flex-1 max-w-3xl">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {vendor.isTemporarilyClosed ? (
              <span className="text-xs font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5 border border-amber-500 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Temporarily Closed
              </span>
            ) : vendor.isActive ? (
              <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5 border border-primary px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Taking Orders
              </span>
            ) : (
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 border border-border px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                Currently Closed
              </span>
            )}
            <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <Star className="h-4 w-4 fill-primary text-primary" />
              {vendor.rating.toFixed(1)}{" "}
              <span className="text-muted-foreground ml-1">
                ({vendor.totalRatings})
              </span>
            </div>
            {vendorMeta ? (
              <span className="text-xs font-bold uppercase tracking-widest text-background bg-foreground px-3 py-1">
                {vendorMeta.spotlight}
              </span>
            ) : null}
          </div>

          <h1 className="text-5xl md:text-7xl font-medium tracking-tighter text-foreground mb-6 leading-[0.9]">
            {vendor.name}
          </h1>
          
          <div className="flex items-center gap-3 mt-8 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            <MapPin className="h-5 w-5 text-primary" />
            <span>{vendor.address}</span>
          </div>
        </div>

        <div className="md:w-72 shrink-0 space-y-8">
          <div className="border-l-2 border-primary pl-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Delivery Time
            </p>
            <p className="text-4xl font-medium tracking-tighter text-foreground flex items-center gap-3">
              <Clock3 className="w-8 h-8 text-primary" />
              {vendorMeta?.etaMinutes || "20-35 min"}
            </p>
          </div>
          <div className="border-l-2 border-border pl-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Menu Size
            </p>
            <p className="text-4xl font-medium tracking-tighter text-foreground flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
              {filteredCount} <span className="text-lg text-muted-foreground">items</span>
            </p>
          </div>
        </div>
      </div>

      {/* Hero Visual */}
      <div className="w-full h-[40vh] min-h-[300px] border border-border relative overflow-hidden bg-secondary/20">
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent"></div>

        <div className="absolute top-6 right-6 border border-primary text-primary bg-background px-4 py-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">
            Trending Now
          </span>
        </div>

        <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
            Signature Item
          </p>
          <h3 className="text-3xl md:text-5xl font-medium tracking-tighter text-foreground">
            {vendorMeta?.specialties?.[0] || "Chef's Special"}
          </h3>
        </div>
      </div>
    </div>
  );
}
