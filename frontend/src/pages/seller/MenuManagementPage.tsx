import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { createMenuItem, deleteMenuItem, getVendorMenu, updateMenuItem } from '@/services/menuService';
import { createVendor, deleteVendor, getVendors, updateVendor } from '@/services/vendorService';
import { santaMariaBulacanCenter } from '@/data/demoVendors';
import { MenuItem, Vendor, OperatingHours } from '@/types';
import { toast } from 'sonner';
import { MenuItemsSection } from '@/features/seller/menu-management/MenuItemsSection';
import { ShopPreviewCard } from '@/features/seller/menu-management/ShopPreviewCard';
import { ShopProfileSection } from '@/features/seller/menu-management/ShopProfileSection';
import type { NewMenuItemFormState, VendorFormState, OperatingHoursFormState } from '@/features/seller/menu-management/types';

const defaultOperatingHours: OperatingHoursFormState[] = [
  { dayOfWeek: 0, openTime: '08:00', closeTime: '22:00', isClosed: false },
  { dayOfWeek: 1, openTime: '08:00', closeTime: '22:00', isClosed: false },
  { dayOfWeek: 2, openTime: '08:00', closeTime: '22:00', isClosed: false },
  { dayOfWeek: 3, openTime: '08:00', closeTime: '22:00', isClosed: false },
  { dayOfWeek: 4, openTime: '08:00', closeTime: '23:00', isClosed: false },
  { dayOfWeek: 5, openTime: '08:00', closeTime: '23:00', isClosed: false },
  { dayOfWeek: 6, openTime: '09:00', closeTime: '22:00', isClosed: false },
];

const defaultVendorForm: VendorFormState = {
  name: '',
  description: '',
  address: '',
  imageUrl: '',
  latitude: santaMariaBulacanCenter.lat.toFixed(6),
  longitude: santaMariaBulacanCenter.lng.toFixed(6),
  isActive: true,
  businessPermit: '',
  businessPermitExpiry: '',
  foodSafetyCert: '',
  foodSafetyCertExpiry: '',
  commissionRate: '0.25',
  operatingHours: defaultOperatingHours,
};

export function MenuManagementPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newItem, setNewItem] = useState<NewMenuItemFormState>({
    name: '',
    description: '',
    category: '',
    price: '',
    prepTimeMinutes: '',
    stockQuantity: '',
  });
  const [vendorForm, setVendorForm] = useState<VendorFormState>(defaultVendorForm);
  const [error, setError] = useState<string | null>(null);
  const [isSavingVendor, setIsSavingVendor] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'profile' | 'menu'>('profile');

  const syncVendorForm = useCallback((currentVendor: Vendor | null) => {
    if (!currentVendor) {
      setVendorForm(defaultVendorForm);
      return;
    }

    const operatingHours: OperatingHoursFormState[] = currentVendor.operatingHours?.map((oh) => ({
      dayOfWeek: oh.dayOfWeek,
      openTime: oh.openTime,
      closeTime: oh.closeTime,
      isClosed: oh.isClosed,
    })) ?? defaultOperatingHours;

    setVendorForm({
      name: currentVendor.name,
      description: currentVendor.description || '',
      address: currentVendor.address,
      imageUrl: currentVendor.imageUrl || '',
      latitude: Number(currentVendor.latitude).toFixed(6),
      longitude: Number(currentVendor.longitude).toFixed(6),
      isActive: currentVendor.isActive,
      businessPermit: currentVendor.businessPermit || '',
      businessPermitExpiry: currentVendor.businessPermitExpiry || '',
      foodSafetyCert: currentVendor.foodSafetyCert || '',
      foodSafetyCertExpiry: currentVendor.foodSafetyCertExpiry || '',
      commissionRate: String(currentVendor.commissionRate ?? 0.25),
      operatingHours,
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
      commissionRate: Number(vendorForm.commissionRate) || 0.25,
      operatingHours: vendorForm.operatingHours,
      businessPermit: vendorForm.businessPermit || undefined,
      businessPermitExpiry: vendorForm.businessPermitExpiry || undefined,
      foodSafetyCert: vendorForm.foodSafetyCert || undefined,
      foodSafetyCertExpiry: vendorForm.foodSafetyCertExpiry || undefined,
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
      operatingHours: vendorForm.operatingHours.map((oh) => ({
        dayOfWeek: oh.dayOfWeek,
        openTime: oh.openTime,
        closeTime: oh.closeTime,
        isClosed: oh.isClosed,
      })),
      businessPermit: vendorForm.businessPermit || undefined,
      businessPermitExpiry: vendorForm.businessPermitExpiry || undefined,
      foodSafetyCert: vendorForm.foodSafetyCert || undefined,
      foodSafetyCertExpiry: vendorForm.foodSafetyCertExpiry || undefined,
      commissionRate: Number(vendorForm.commissionRate) || 0.25,
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
        operatingHours: vendorForm.operatingHours.map((oh) => ({
          dayOfWeek: oh.dayOfWeek,
          openTime: oh.openTime,
          closeTime: oh.closeTime,
          isClosed: oh.isClosed,
        })),
        businessPermit: vendorForm.businessPermit.trim() || undefined,
        businessPermitExpiry: vendorForm.businessPermitExpiry.trim() || undefined,
        foodSafetyCert: vendorForm.foodSafetyCert.trim() || undefined,
        foodSafetyCertExpiry: vendorForm.foodSafetyCertExpiry.trim() || undefined,
        commissionRate: Number(vendorForm.commissionRate) || 0.25,
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

  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleCloseShop = async () => {
    if (!vendor) return;
    setIsClosing(true);
    try {
      await deleteVendor(vendor.id);
      toast.success("Shop closed successfully");
      navigate("/seller");
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Failed to close shop";
      toast.error(message);
    } finally {
      setIsClosing(false);
      setShowCloseConfirm(false);
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
        prepTimeMinutes: newItem.prepTimeMinutes ? Number(newItem.prepTimeMinutes) : undefined,
        stockQuantity: newItem.stockQuantity ? Number(newItem.stockQuantity) : undefined,
      });
      setNewItem({ name: '', description: '', category: '', price: '', prepTimeMinutes: '', stockQuantity: '' });
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

  const updateStock = async (itemId: string, quantity: number) => {
    try {
      await updateMenuItem(itemId, { stockQuantity: quantity });
      await loadData();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Failed to update stock';
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
        <div className="border-b border-border pb-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Seller</p>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Shop customization</h1>
            <p className="text-base text-muted-foreground mt-2 max-w-xl">
              Edit the storefront customers actually browse: shop name, live status, address, hero image, and the exact Santa Maria pin.
            </p>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex border-b border-border mb-12 overflow-x-auto" role="tablist" aria-label="Catalog Workspace">
          {[
            { id: 'profile' as const, label: 'Shop Profile' },
            { id: 'menu' as const, label: 'Menu Catalog' },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeWorkspaceTab === tab.id}
              onClick={() => setActiveWorkspaceTab(tab.id)}
              className={`px-8 py-4 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                activeWorkspaceTab === tab.id
                  ? 'border-foreground text-foreground bg-secondary/10'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeWorkspaceTab === 'profile' && (
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
        )}

        {activeWorkspaceTab === 'profile' && vendor && (
          <div className="border-t border-red-500/30 pt-12 mt-12">
            <div className="max-w-xl">
              <h3 className="text-lg font-bold tracking-tight text-red-500 mb-2">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Closing your shop will permanently delete your vendor profile, menu items, and promotions. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowCloseConfirm(true)}
                className="border border-red-500 text-red-500 px-8 py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors"
              >
                Close Shop
              </button>
            </div>
          </div>
        )}

        {showCloseConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-background border border-border p-8 mx-4">
              <h3 className="text-2xl font-bold tracking-tight text-red-500 mb-4">Close shop?</h3>
              <p className="text-muted-foreground mb-8">
                This will permanently delete your vendor profile, all menu items, and promotions. Customers will no longer find your shop.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  className="flex-1 border border-border px-6 py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseShop}
                  disabled={isClosing}
                  className="flex-1 bg-red-500 text-white px-6 py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isClosing ? "Closing..." : "Yes, close shop"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeWorkspaceTab === 'menu' && (
          <MenuItemsSection
            newItem={newItem}
            setNewItem={setNewItem}
            onSubmit={addMenuItem}
            isAddingItem={isAddingItem}
            menuItems={menuItems}
            onToggleAvailability={(item) => void toggleAvailability(item)}
            onRemoveItem={(itemId) => void removeItem(itemId)}
            onUpdateStock={(itemId, qty) => void updateStock(itemId, qty)}
          />
        )}
      </div>
    </div>
  );
}
