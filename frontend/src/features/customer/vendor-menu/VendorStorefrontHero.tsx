import { Clock3, MapPin, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { DemoVendor } from '@/data/demoVendors';
import type { Vendor } from '@/types';

export function VendorStorefrontHero({
  vendor,
  vendorMeta,
  categoryCount,
  filteredCount,
}: {
  vendor: Vendor;
  vendorMeta: DemoVendor | null;
  categoryCount: number;
  filteredCount: number;
}) {
  return (
    <Card className="overflow-hidden rounded-[32px] border border-slate-100 dark:border-gray-800 shadow-[var(--shadow-panel)]">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_320px]">
        <div className="space-y-6 p-6 md:p-8 bg-white dark:bg-gray-900">
          <div className="flex flex-wrap gap-2">
            <Badge className={`rounded-[16px] px-3 py-1 font-semibold text-xs border-none ${vendor.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white'}`}>
              {vendor.isActive ? 'Open now' : 'Closed'}
            </Badge>
            <Badge variant="secondary" className="rounded-[16px] px-3 py-1 font-semibold text-xs">{categoryCount} categories</Badge>
            {vendorMeta ? <Badge className="rounded-[16px] px-3 py-1 font-semibold text-xs bg-orange-100 text-orange-700 hover:bg-orange-200 border-none">{vendorMeta.spotlight}</Badge> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] bg-slate-50 dark:bg-gray-800 px-5 py-5 border border-slate-100 dark:border-gray-700">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Rating
              </p>
              <div className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                <Star className="h-5 w-5 fill-orange-500 text-orange-500" />
                {vendor.rating.toFixed(1)}
              </div>
            </div>
            <div className="rounded-[24px] bg-slate-50 dark:bg-gray-800 px-5 py-5 border border-slate-100 dark:border-gray-700">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                ETA
              </p>
              <div className="mt-2 flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                <Clock3 className="h-5 w-5 text-orange-500" />
                {vendorMeta?.etaMinutes || '20-35 min'}
              </div>
            </div>
            <div className="rounded-[24px] bg-slate-50 dark:bg-gray-800 px-5 py-5 border border-slate-100 dark:border-gray-700">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Visible items
              </p>
              <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{filteredCount}</div>
            </div>
          </div>

          {(vendorMeta?.specialties?.length ?? 0) > 0 ? (
            <div className="flex flex-wrap gap-2">
              {vendorMeta!.specialties.map((specialty) => (
                <span
                  key={specialty}
                  className="rounded-full bg-slate-100 dark:bg-gray-800 px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  {specialty}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col justify-between bg-gradient-to-br from-orange-500 to-orange-400 p-6 md:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">
              Shop address
            </p>
            <div className="mt-3 flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-white/90" />
              <p className="text-sm font-medium leading-relaxed text-white">{vendor.address}</p>
            </div>
          </div>
          <p className="mt-8 text-sm font-medium leading-relaxed text-white/80 relative z-10">
            Browse is structured here now: search the menu, jump between categories, and keep the cart summary visible without blocking the menu.
          </p>
        </div>
      </div>
    </Card>
  );
}
