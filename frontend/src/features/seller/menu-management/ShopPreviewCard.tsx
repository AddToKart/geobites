import { Store } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Vendor } from '@/types';
import type { VendorFormState } from './types';

export function ShopPreviewCard({
  vendorPreview,
  vendorForm,
  vendorCoordinates,
  error,
}: {
  vendorPreview: Vendor;
  vendorForm: VendorFormState;
  vendorCoordinates: { lat: number; lng: number };
  error: string | null;
}) {
  return (
    <div className="space-y-4 xl:sticky xl:top-8 xl:self-start">
      <Card className="overflow-hidden">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.34),transparent_36%),linear-gradient(135deg,#ef7c42,#f6b372)] p-6 text-white">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/88">
              Customer preview
            </span>
            <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/88">
              {vendorPreview.isActive ? 'Open now' : 'Closed'}
            </span>
          </div>
          <h2 className="mt-8 text-3xl font-semibold leading-tight">{vendorPreview.name}</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/88">
            {vendorPreview.description}
          </p>
        </div>

        <CardContent className="space-y-4 p-5">
          <div className="panel-muted space-y-3 px-4 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[color:var(--color-text-soft)]">Address</span>
              <span className="font-medium text-[color:var(--color-text)] text-right">
                {vendorPreview.address}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[color:var(--color-text-soft)]">Map pin</span>
              <span className="font-medium text-[color:var(--color-text)]">
                {vendorCoordinates.lat.toFixed(4)}, {vendorCoordinates.lng.toFixed(4)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[color:var(--color-text-soft)]">Hero image</span>
              <span className="font-medium text-[color:var(--color-text)]">
                {vendorForm.imageUrl ? 'Custom image set' : 'Gradient fallback'}
              </span>
            </div>
          </div>

          <div className="rounded-[22px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary-dark)]">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[color:var(--color-text)]">
                  Browse and map ready
                </p>
                <p className="text-xs text-[color:var(--color-text-soft)]">
                  Customers will see this shop in the Santa Maria browse flow once saved.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardContent className="p-5 text-sm text-[color:var(--color-danger)]">{error}</CardContent>
        </Card>
      ) : null}
    </div>
  );
}
