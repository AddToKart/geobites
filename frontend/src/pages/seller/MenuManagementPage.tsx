import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createMenuItem, deleteMenuItem, getVendorMenu, updateMenuItem } from '@/services/menuService';
import { createVendor, getVendors, updateVendor } from '@/services/vendorService';
import { santaMariaBulacanCenter } from '@/data/demoVendors';
import { MenuItem, Vendor } from '@/types';
import { toast } from 'sonner';
import { MenuItemsSection } from '@/features/seller/menu-management/MenuItemsSection';
import { ShopPreviewCard } from '@/features/seller/menu-management/ShopPreviewCard';
import { ShopProfileSection } from '@/features/seller/menu-management/ShopProfileSection';
import type { NewMenuItemFormState, VendorFormState } from '@/features/seller/menu-management/types';

const defaultVendorForm: VendorFormState = {
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
  const [newItem, setNewItem] = useState<NewMenuItemFormState>({
    name: '',
    description: '',
    category: '',
    price: '',
  });
  const [vendorForm, setVendorForm] = useState<VendorFormState>(defaultVendorForm);
  const [error, setError] = useState<string | null>(null);
  const [isSavingVendor, setIsSavingVendor] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);

  const syncVendorForm = useCallback((currentVendor: Vendor | null) => {
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
  }, []);

  const loadData = useCallback(async () => {
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
  }, [user, syncVendorForm]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        {/* Editorial Header */}
        <div className="border-b-2 border-foreground pb-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Seller</p>
            <h1 className="text-6xl md:text-8xl font-medium tracking-tighter leading-[0.9] mb-4">Shop customization.</h1>
            <p className="text-xl text-muted-foreground mt-4 max-w-xl">
              Edit the storefront customers actually browse: shop name, live status, address, hero image, and the exact Santa Maria pin.
            </p>
          </div>
        </div>

        <section className="grid gap-12 xl:grid-cols-[minmax(0,1.2fr)_380px] mb-12">
          <div className="space-y-6">
            <ShopProfileSection
              vendorForm={vendorForm}
              setVendorForm={setVendorForm}
              onSubmit={saveVendorProfile}
              isSavingVendor={isSavingVendor}
              vendorCoordinates={vendorCoordinates}
            />
          </div>

          <ShopPreviewCard
            vendorPreview={vendorPreview}
            vendorForm={vendorForm}
            vendorCoordinates={vendorCoordinates}
            error={error}
          />
        </section>

        <MenuItemsSection
          newItem={newItem}
          setNewItem={setNewItem}
          onSubmit={addMenuItem}
          isAddingItem={isAddingItem}
          menuItems={menuItems}
          onToggleAvailability={(item) => void toggleAvailability(item)}
          onRemoveItem={(itemId) => void removeItem(itemId)}
        />
      </div>
    </div>
  );
}
