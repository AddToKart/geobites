import {
  Clock3,
  MapPin,
  Star,
  ShoppingBag,
  Info,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
    <div className="bento-grid gap-4">
      {/* Primary Hero Info */}
      <div className="col-span-1 md:col-span-4 lg:col-span-8 xl:col-span-8 p-8 md:p-10 bg-card min-h-[320px] flex flex-col justify-between rounded-[32px] shadow-[var(--shadow-card)] relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-900/10 pointer-events-none transition-opacity duration-500 opacity-50 group-hover:opacity-100"></div>
        <div className="flex flex-wrap items-center gap-4 mb-8 relative z-10">
          <Badge
            className={`rounded-full px-4 py-2 font-bold text-[11px] uppercase tracking-widest border-none shadow-sm ${vendor.isActive ? "bg-primary text-primary-foreground" : "bg-muted text-text-muted"}`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full mr-2 inline-block ${vendor.isActive ? "bg-white animate-pulse" : "bg-text-muted"}`}
            ></div>
            {vendor.isActive ? "Taking Orders" : "Currently Closed"}
          </Badge>
          <div className="flex items-center gap-1.5 bg-card rounded-full px-4 py-2 text-[13px] font-bold text-foreground shadow-sm">
            <Star className="h-4 w-4 fill-primary text-primary" />
            {vendor.rating.toFixed(1)}{" "}
            <span className="text-text-muted font-medium">
              ({vendor.totalRatings})
            </span>
          </div>
          {vendorMeta ? (
            <Badge className="rounded-full px-4 py-2 font-bold text-[11px] uppercase tracking-widest bg-foreground text-background border-none shadow-sm">
              {vendorMeta.spotlight}
            </Badge>
          ) : null}
        </div>

        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4 leading-tight">
            {vendor.name}
          </h1>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary-soft flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <p className="text-[16px] font-medium text-text-soft">
              {vendor.address}
            </p>
          </div>
        </div>
      </div>

      {/* Specialty Image Bento */}
      <div className="col-span-1 md:col-span-2 lg:col-span-4 xl:col-span-4 min-h-[320px] relative overflow-hidden group rounded-[32px] shadow-[var(--shadow-card)]">
        {vendor.imageUrl ? (
          <img
            src={vendor.imageUrl}
            alt="Specialty"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center transition-transform duration-700 group-hover:scale-105">
            <ShoppingBag className="w-12 h-12 text-text-muted opacity-50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent"></div>

        <div className="absolute top-5 right-5 bg-white/20 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 flex items-center gap-2 shadow-sm">
          <TrendingUp className="w-4 h-4 text-white" />
          <span className="text-[11px] font-bold text-white uppercase tracking-widest">
            Trending Now
          </span>
        </div>

        <div className="absolute bottom-0 left-0 p-8 w-full">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-400 mb-2 drop-shadow-sm">
            Signature Item
          </p>
          <h3 className="text-2xl font-bold text-white drop-shadow-md line-clamp-2 leading-snug">
            {vendorMeta?.specialties?.[0] || "Chef's Special"}
          </h3>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="col-span-1 md:col-span-2 lg:col-span-4 xl:col-span-4 p-8 bg-card flex items-center gap-6 rounded-[32px] shadow-[var(--shadow-card)] hover:-translate-y-1 transition-transform duration-300">
        <div className="w-16 h-16 rounded-[24px] bg-primary-soft text-primary flex items-center justify-center shrink-0 shadow-sm border border-primary/20">
          <Clock3 className="w-7 h-7" />
        </div>
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-text-muted mb-1">
            Average ETA
          </p>
          <p className="text-3xl font-extrabold tracking-tight text-foreground">
            {vendorMeta?.etaMinutes || "20-35 min"}
          </p>
        </div>
      </div>

      <div className="col-span-1 md:col-span-2 lg:col-span-4 xl:col-span-4 p-8 bg-card flex items-center gap-6 rounded-[32px] shadow-[var(--shadow-card)] hover:-translate-y-1 transition-transform duration-300">
        <div className="w-16 h-16 rounded-[24px] bg-accent text-text-soft flex items-center justify-center shrink-0 shadow-sm border border-border">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-text-muted mb-1">
            Menu Size
          </p>
          <p className="text-3xl font-extrabold tracking-tight text-foreground">
            {filteredCount}{" "}
            <span className="text-[18px] font-semibold text-text-muted tracking-normal inline-block ml-1">
              items
            </span>
          </p>
        </div>
      </div>

      <div className="col-span-1 md:col-span-4 lg:col-span-4 xl:col-span-4 p-8 bg-slate-950 dark:bg-black text-white flex flex-col justify-center relative overflow-hidden rounded-[32px] shadow-[var(--shadow-card)] hover:-translate-y-1 transition-transform duration-300">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/20 blur-[60px] rounded-full pointer-events-none"></div>
        <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-text-muted mb-3 flex items-center gap-2 relative z-10">
          <Info className="w-4 h-4 text-primary" /> Order Context
        </p>
        <p className="text-[15px] font-medium leading-relaxed text-white/60 relative z-10 max-w-sm">
          {vendor.description ||
            "Highly rated local favorite. Explore the full menu below to view options and build your cart."}
        </p>
      </div>
    </div>
  );
}
