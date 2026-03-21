import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, PencilLine, Save, Store, Trash2 } from 'lucide-react';
import { LazyDeliveryLocationPicker } from '@/components/maps/LazyDeliveryLocationPicker';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { createMenuItem, deleteMenuItem, getVendorMenu, updateMenuItem } from '@/services/menuService';
import { createVendor, getVendors, updateVendor } from '@/services/vendorService';
import { santaMariaBulacanCenter } from '@/data/demoVendors';
import { MenuItem, Vendor } from '@/types';
import { formatCurrency } from '@/utils/helpers';
import { toast } from 'sonner';

const defaultVendorForm = {
  name: '',
  description: '',
  address: '',
  imageUrl: '',
  latitude: santaMariaBulacanCenter.lat.toFixed(6),
  longitude: santaMariaBulacanCenter.lng.toFixed(6),
  isActive: true,
};

export function MenuManagementPage() {
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
  });
  const [vendorForm, setVendorForm] = useState(defaultVendorForm);
  const [error, setError] = useState<string | null>(null);
  const [isSavingVendor, setIsSavingVendor] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);

  const syncVendorForm = (currentVendor: Vendor | null) => {
    if (!currentVendor) {
      setVendorForm(defaultVendorForm);
      return;
    }

    setVendorForm({
      name: currentVendor.name,
      description: currentVendor.description || '',
      address: currentVendor.address,
      imageUrl: currentVendor.imageUrl || '',
      latitude: Number(currentVendor.latitude).toFixed(6),
      longitude: Number(currentVendor.longitude).toFixed(6),
      isActive: currentVendor.isActive,
    });
  };

  const loadData = async () => {
    if (!user) {
      return;
    }

    try {
      const vendors = await getVendors({ page: 1, limit: 100 });
      const myVendor = vendors.data.find((entry) => entry.userId === user.id) ?? null;
      setVendor(myVendor);
      syncVendorForm(myVendor);

      if (myVendor) {
        const menu = await getVendorMenu(myVendor.id);
        setMenuItems(menu);
      } else {
        setMenuItems([]);
      }
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Failed to load menu data';
      setError(message);
      toast.error(message);
    }
  };

  useEffect(() => {
    void loadData();
  }, [user]);

  const vendorCoordinates = useMemo(
    () => ({
      lat: Number(vendorForm.latitude) || santaMariaBulacanCenter.lat,
      lng: Number(vendorForm.longitude) || santaMariaBulacanCenter.lng,
    }),
    [vendorForm.latitude, vendorForm.longitude],
  );

  const vendorPreview: Vendor = useMemo(
    () => ({
      id: vendor?.id ?? 'preview-shop',
      userId: vendor?.userId ?? user?.id ?? 'preview-seller',
      name: vendorForm.name || 'Your Santa Maria shop',
      description:
        vendorForm.description ||
        'Customize your shop name, image, description, and exact pin so customers see a polished storefront.',
      address: vendorForm.address || 'Set your full shop address in Santa Maria, Bulacan',
      latitude: vendorCoordinates.lat,
      longitude: vendorCoordinates.lng,
      rating: vendor?.rating ?? 4.8,
      totalRatings: vendor?.totalRatings ?? 42,
      imageUrl: vendorForm.imageUrl || undefined,
      isActive: vendorForm.isActive,
      createdAt: vendor?.createdAt ?? new Date().toISOString(),
      updatedAt: vendor?.updatedAt ?? new Date().toISOString(),
    }),
    [user?.id, vendor, vendorCoordinates.lat, vendorCoordinates.lng, vendorForm],
  );

  const ensureVendor = async (): Promise<Vendor> => {
    if (vendor) {
      return vendor;
    }

    const createdVendor = await createVendor({
      name: vendorForm.name || 'My Santa Maria Shop',
      description: vendorForm.description || 'Seller profile scaffold',
      address: vendorForm.address || 'Santa Maria, Bulacan',
      imageUrl: vendorForm.imageUrl || undefined,
      latitude: vendorCoordinates.lat,
      longitude: vendorCoordinates.lng,
      isActive: vendorForm.isActive,
    });

    setVendor(createdVendor);
    syncVendorForm(createdVendor);
    return createdVendor;
  };

  const saveVendorProfile = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSavingVendor(true);

    try {
      const payload = {
        name: vendorForm.name.trim() || 'My Santa Maria Shop',
        description: vendorForm.description.trim() || undefined,
        address: vendorForm.address.trim() || 'Santa Maria, Bulacan',
        imageUrl: vendorForm.imageUrl.trim() || undefined,
        latitude: vendorCoordinates.lat,
        longitude: vendorCoordinates.lng,
        isActive: vendorForm.isActive,
      };

      const savedVendor = vendor
        ? await updateVendor(vendor.id, payload)
        : await createVendor(payload);

      setVendor(savedVendor);
      syncVendorForm(savedVendor);
      toast.success('Shop profile updated');
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Failed to save shop profile';
      setError(message);
      toast.error(message);
    } finally {
      setIsSavingVendor(false);
    }
  };

  const addMenuItem = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsAddingItem(true);

    try {
      const targetVendor = await ensureVendor();
      await createMenuItem({
        vendorId: targetVendor.id,
        name: newItem.name,
        description: newItem.description,
        category: newItem.category,
        price: Number(newItem.price),
        isAvailable: true,
      });
      setNewItem({ name: '', description: '', category: '', price: '' });
      toast.success('Menu item added');
      await loadData();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Failed to add menu item';
      setError(message);
      toast.error(message);
    } finally {
      setIsAddingItem(false);
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await updateMenuItem(item.id, { isAvailable: !item.isAvailable });
      toast.success(`${item.name} updated`);
      await loadData();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Failed to update item';
      setError(message);
      toast.error(message);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await deleteMenuItem(itemId);
      toast.success('Menu item removed');
      await loadData();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Failed to remove item';
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Seller"
        title="Shop customization"
        description="Edit the storefront customers actually browse: shop name, live status, address, hero image, and the exact Santa Maria pin."
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <div className="space-y-6">
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

              <form className="grid gap-4 md:grid-cols-2" onSubmit={saveVendorProfile}>
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
        </div>

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
      </section>

      <Card>
        <CardContent className="space-y-5 p-5">
          <div>
            <p className="eyebrow">Menu</p>
            <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-text)]">
              Menu management
            </h2>
            <p className="mt-2 subtle-copy">
              Add items, keep them available, and build the menu customers open from your customized shop card.
            </p>
          </div>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={addMenuItem}>
            <Input
              placeholder="Item name"
              value={newItem.name}
              onChange={(event) =>
                setNewItem((current) => ({ ...current, name: event.target.value }))
              }
              required
            />
            <Input
              placeholder="Category"
              value={newItem.category}
              onChange={(event) =>
                setNewItem((current) => ({ ...current, category: event.target.value }))
              }
            />
            <Input
              placeholder="Description"
              value={newItem.description}
              onChange={(event) =>
                setNewItem((current) => ({ ...current, description: event.target.value }))
              }
            />
            <Input
              type="number"
              min="1"
              step="0.01"
              placeholder="Price"
              value={newItem.price}
              onChange={(event) =>
                setNewItem((current) => ({ ...current, price: event.target.value }))
              }
              required
            />
            <div className="md:col-span-2">
              <Button type="submit" disabled={isAddingItem}>
                {isAddingItem ? 'Adding item...' : 'Add item'}
              </Button>
            </div>
          </form>

          {menuItems.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-[color:var(--color-border)] px-4 py-6 text-sm text-[color:var(--color-text-soft)]">
              No menu items yet. Save your shop profile, then add your first menu item here.
            </div>
          ) : (
            <div className="space-y-4">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="panel-muted flex flex-wrap items-center justify-between gap-4 px-4 py-4"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-[color:var(--color-text)]">{item.name}</p>
                    <p className="text-sm text-[color:var(--color-text-soft)]">
                      {formatCurrency(item.price)}
                    </p>
                    <p className="text-xs text-[color:var(--color-text-muted)]">
                      {item.category || 'Uncategorized'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button size="sm" variant="ghost" onClick={() => void toggleAvailability(item)}>
                      <PencilLine className="h-4 w-4" />
                      {item.isAvailable ? 'Mark unavailable' : 'Mark available'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-soft)]"
                      onClick={() => void removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
