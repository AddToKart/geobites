import { type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { CheckCircle2, Save } from 'lucide-react';
import { santaMariaBulacanCenter } from '@/data/demoVendors';
import { LazyDeliveryLocationPicker } from '@/components/maps/LazyDeliveryLocationPicker';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { VendorFormState } from './types';

export function ShopProfileSection({
  vendorForm,
  setVendorForm,
  onSubmit,
  isSavingVendor,
  vendorCoordinates,
}: {
  vendorForm: VendorFormState;
  setVendorForm: Dispatch<SetStateAction<VendorFormState>>;
  onSubmit: (event: FormEvent) => void;
  isSavingVendor: boolean;
  vendorCoordinates: { lat: number; lng: number };
}) {
  return (
    <>
      <Card>
        <CardContent className="space-y-6 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Storefront</p>
              <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-text)]">
                Shop profile
              </h2>
              <p className="mt-2 subtle-copy">
                This is the seller-side setup for how your shop appears in browse, list, and map views.
              </p>
            </div>
            <Button
              type="button"
              variant={vendorForm.isActive ? 'default' : 'ghost'}
              onClick={() =>
                setVendorForm((current) => ({ ...current, isActive: !current.isActive }))
              }
            >
              <CheckCircle2 className="h-4 w-4" />
              {vendorForm.isActive ? 'Shop is open' : 'Mark as open'}
            </Button>
          </div>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-text)]">
                Shop name
              </label>
              <Input
                placeholder="Example: Santa Maria Grill House"
                value={vendorForm.name}
                onChange={(event) =>
                  setVendorForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-text)]">
                Hero image URL
              </label>
              <Input
                placeholder="https://..."
                value={vendorForm.imageUrl}
                onChange={(event) =>
                  setVendorForm((current) => ({ ...current, imageUrl: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[color:var(--color-text)]">
                Shop description
              </label>
              <textarea
                className="min-h-28 w-full rounded-[20px] border border-[color:var(--color-border)] bg-white/85 px-4 py-3 text-sm text-[color:var(--color-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none"
                placeholder="Tell customers what your shop is known for."
                value={vendorForm.description}
                onChange={(event) =>
                  setVendorForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[color:var(--color-text)]">
                Full address
              </label>
              <Input
                placeholder="Barangay, street, landmark, Santa Maria, Bulacan"
                value={vendorForm.address}
                onChange={(event) =>
                  setVendorForm((current) => ({ ...current, address: event.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-text)]">
                Latitude
              </label>
              <Input
                type="number"
                step="0.000001"
                value={vendorForm.latitude}
                onChange={(event) =>
                  setVendorForm((current) => ({ ...current, latitude: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[color:var(--color-text)]">
                Longitude
              </label>
              <Input
                type="number"
                step="0.000001"
                value={vendorForm.longitude}
                onChange={(event) =>
                  setVendorForm((current) => ({ ...current, longitude: event.target.value }))
                }
              />
            </div>

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <Button type="submit" disabled={isSavingVendor}>
                <Save className="h-4 w-4" />
                {isSavingVendor ? 'Saving profile...' : 'Save shop profile'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  setVendorForm((current) => ({
                    ...current,
                    latitude: santaMariaBulacanCenter.lat.toFixed(6),
                    longitude: santaMariaBulacanCenter.lng.toFixed(6),
                  }))
                }
              >
                Use Santa Maria center
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <LazyDeliveryLocationPicker
        value={vendorCoordinates}
        onChange={({ lat, lng }) =>
          setVendorForm((current) => ({
            ...current,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6),
          }))
        }
        title="Shop map pin"
        description="Click or drag the marker so customers and riders see the exact pickup point for your shop."
        actionLabel="Use my shop location"
        markerLabel="Shop pin"
        popupEyebrow="Pickup point"
        popupTitle="Exact shop location"
        popupDescription="This pin is what shows up on the customer, seller, and rider maps."
        selectedText={(coords) =>
          `Shop pin set at ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
        }
        emptyText="No shop pin selected yet."
        initialCenter={santaMariaBulacanCenter}
      />
    </>
  );
}
