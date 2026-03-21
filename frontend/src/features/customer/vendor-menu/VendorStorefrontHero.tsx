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
    <Card className="overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_320px]">
        <div className="space-y-5 p-6 md:p-7">
          <div className="flex flex-wrap gap-2">
            <Badge variant={vendor.isActive ? 'success' : 'warning'}>
              {vendor.isActive ? 'Open now' : 'Closed'}
            </Badge>
            <Badge>{categoryCount} categories</Badge>
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
              <div className="mt-2 text-lg font-semibold">{filteredCount}</div>
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
  );
}
