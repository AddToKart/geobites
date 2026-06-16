import { type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { Camera, CheckCircle2, Save, Clock, ShieldCheck, Percent, X } from 'lucide-react';
import { santaMariaBulacanCenter } from '@/data/demoVendors';
import { LazyDeliveryLocationPicker } from '@/components/maps/LazyDeliveryLocationPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { uploadUrl } from '@/utils/upload';
import { OperatingHoursEditor } from './OperatingHoursEditor';
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
    <div className="space-y-12">
      {/* Header and Toggle Block */}
      <div className="flex flex-wrap items-start justify-between gap-6 pb-6 border-b border-border">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Storefront</p>
          <h2 className="text-3xl font-medium tracking-tighter text-foreground">
            Shop profile
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            This is the seller-side setup for how your shop appears in browse, list, and map views.
          </p>
        </div>
        <Button
          type="button"
          variant={vendorForm.isActive ? 'default' : 'outline'}
          className="rounded-none border border-foreground font-bold uppercase tracking-widest text-xs"
          onClick={() =>
            setVendorForm((current) => ({ ...current, isActive: !current.isActive }))
          }
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          {vendorForm.isActive ? 'Shop is open' : 'Mark as open'}
        </Button>
      </div>

      <form className="grid gap-8 md:grid-cols-2" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Shop name
          </label>
          <Input
            placeholder="Example: Santa Maria Grill House"
            value={vendorForm.name}
            onChange={(event) =>
              setVendorForm((current) => ({ ...current, name: event.target.value }))
            }
            className="h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Hero image
          </label>
          <div className="flex items-start gap-4">
            <div className="h-28 w-48 shrink-0 bg-secondary/15 flex items-center justify-center border border-border overflow-hidden">
              {vendorForm.imagePreview ? (
                <img src={vendorForm.imagePreview} alt="Shop preview" className="h-full w-full object-cover" />
              ) : vendorForm.imageUrl ? (
                <img src={uploadUrl(vendorForm.imageUrl)} alt="Shop" className="h-full w-full object-cover" />
              ) : (
                <span className="text-4xl">🏪</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (!file.type.match(/^image\/(png|jpe?g|webp)$/)) {
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    return;
                  }
                  setVendorForm((current) => ({
                    ...current,
                    imageFile: file,
                    imagePreview: URL.createObjectURL(file),
                    imageUrl: '',
                  }));
                }}
                className="hidden"
                id="shop-hero-upload"
              />
              <label
                htmlFor="shop-hero-upload"
                className="h-10 px-5 bg-foreground text-background hover:opacity-90 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 transition-opacity cursor-pointer"
              >
                <Camera className="h-3.5 w-3.5" />
                {(vendorForm.imagePreview || vendorForm.imageUrl) ? 'Change photo' : 'Upload photo'}
              </label>
              {(vendorForm.imagePreview || vendorForm.imageUrl) && (
                <button
                  type="button"
                  onClick={() => {
                    if (vendorForm.imagePreview) URL.revokeObjectURL(vendorForm.imagePreview);
                    setVendorForm((current) => ({
                      ...current,
                      imageFile: null,
                      imagePreview: null,
                      imageUrl: '',
                    }));
                  }}
                  className="h-10 px-5 border border-border hover:bg-secondary/20 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Shop description
          </label>
          <textarea
            className="min-h-28 w-full border-0 border-b border-border bg-transparent px-0 py-3 text-sm outline-none focus:border-foreground resize-none"
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
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Full address
          </label>
          <Input
            placeholder="Barangay, street, landmark, Santa Maria, Bulacan"
            value={vendorForm.address}
            onChange={(event) =>
              setVendorForm((current) => ({ ...current, address: event.target.value }))
            }
            className="h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Latitude
          </label>
          <Input
            type="number"
            step="0.000001"
            value={vendorForm.latitude}
            onChange={(event) =>
              setVendorForm((current) => ({ ...current, latitude: event.target.value }))
            }
            className="h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Longitude
          </label>
          <Input
            type="number"
            step="0.000001"
            value={vendorForm.longitude}
            onChange={(event) =>
              setVendorForm((current) => ({ ...current, longitude: event.target.value }))
            }
            className="h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Percent className="h-3.5 w-3.5" />
            Platform commission rate
          </label>
          <Input
            type="number"
            min="0"
            max="1"
            step="0.01"
            placeholder="0.25"
            value={vendorForm.commissionRate}
            onChange={(event) =>
              setVendorForm((current) => ({ ...current, commissionRate: event.target.value }))
            }
            className="h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Decimal value (e.g. 0.25 = 25%). This affects payout calculations.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 md:col-span-2 pt-4 border-t border-border">
          <Button
            type="submit"
            disabled={isSavingVendor}
            className="h-14 px-8 bg-primary text-primary-foreground hover:opacity-90 font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-opacity disabled:opacity-50 rounded-none animate-none"
          >
            <Save className="h-4 w-4" />
            {isSavingVendor ? 'Saving profile...' : 'Save shop profile'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-14 px-8 border border-border hover:bg-secondary/20 font-bold uppercase tracking-widest text-xs transition-colors rounded-none"
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

      {/* Operating Hours Schedule */}
      <OperatingHoursEditor
        operatingHours={vendorForm.operatingHours}
        onChange={(hours) =>
          setVendorForm((current) => ({ ...current, operatingHours: hours }))
        }
      />

      {/* Compliance & Certification */}
      <div className="pt-6 border-t border-border space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <p className="text-sm font-bold uppercase tracking-widest">
            Compliance & certification
          </p>
        </div>
        <p className="text-xs text-muted-foreground -mt-4">
          Uploaded permits and certificates are displayed on your storefront and required for platform compliance.
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Business permit URL
            </label>
            <Input
              placeholder="https://..."
              value={vendorForm.businessPermit}
              onChange={(event) =>
                setVendorForm((current) => ({ ...current, businessPermit: event.target.value }))
              }
              className="h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Business permit expiry
            </label>
            <Input
              type="date"
              value={vendorForm.businessPermitExpiry}
              onChange={(event) =>
                setVendorForm((current) => ({ ...current, businessPermitExpiry: event.target.value }))
              }
              className="h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Food safety certificate URL
            </label>
            <Input
              placeholder="https://..."
              value={vendorForm.foodSafetyCert}
              onChange={(event) =>
                setVendorForm((current) => ({ ...current, foodSafetyCert: event.target.value }))
              }
              className="h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Food safety cert expiry
            </label>
            <Input
              type="date"
              value={vendorForm.foodSafetyCertExpiry}
              onChange={(event) =>
                setVendorForm((current) => ({ ...current, foodSafetyCertExpiry: event.target.value }))
              }
              className="h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground"
            />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-border">
        <p className="text-sm font-bold uppercase tracking-widest border-b border-border pb-2 mb-6">
          Shop pin location
        </p>
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
      </div>
    </div>
  );
}
