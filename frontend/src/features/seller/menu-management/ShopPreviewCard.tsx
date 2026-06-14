import { Store } from 'lucide-react';
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
    <div className="space-y-6 xl:sticky xl:top-8 xl:self-start">
      <div className="border border-border bg-background">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.34),transparent_36%),linear-gradient(135deg,var(--color-primary),var(--color-primary-light))] p-6 text-white rounded-none">
          <div className="flex flex-wrap gap-2">
            <span className="border border-white/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/90">
              Customer preview
            </span>
            <span className="border border-white/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/90">
              {vendorPreview.isActive ? 'Open now' : 'Closed'}
            </span>
          </div>
          <h2 className="mt-8 text-3xl font-semibold leading-tight">{vendorPreview.name}</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/90">
            {vendorPreview.description}
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm border-b border-border pb-3">
              <span className="text-muted-foreground">Address</span>
              <span className="font-medium text-foreground text-right max-w-[180px] truncate" title={vendorPreview.address}>
                {vendorPreview.address}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm border-b border-border pb-3">
              <span className="text-muted-foreground">Map pin</span>
              <span className="font-medium text-foreground">
                {vendorCoordinates.lat.toFixed(4)}, {vendorCoordinates.lng.toFixed(4)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm border-b border-border pb-3">
              <span className="text-muted-foreground">Hero image</span>
              <span className="font-medium text-foreground">
                {vendorForm.imageUrl ? 'Custom image set' : 'Gradient fallback'}
              </span>
            </div>
          </div>

          <div className="border border-border p-4 bg-secondary/5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-primary/10 text-primary shrink-0">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Browse and map ready
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  Customers will see this shop in the Santa Maria browse flow once saved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="border-l-4 border-[color:var(--color-danger)] bg-[color:var(--color-danger-soft)]/20 px-6 py-4 text-sm text-[color:var(--color-danger)]">
          {error}
        </div>
      ) : null}
    </div>
  );
}
