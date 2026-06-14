import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Home, Mail, MapPin, Phone, Plus, Shield, Star, Trash2, User, X, Loader2, Save, Settings, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LazyDeliveryLocationPicker } from '@/components/maps/LazyDeliveryLocationPicker';
import { updateProfile } from '@/services/authService';
import { getAddresses, createAddress, updateAddress, deleteAddress, SavedAddress, CreateAddressPayload } from '@/services/addressService';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { toast } from 'sonner';
import { Stagger, StaggerItem } from '@/components/motion/Reveal';

type SettingsTab = 'profile' | 'business' | 'addresses' | 'preferences';

export function SettingsPage() {
  const { user, refreshSession } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Profile Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Business Form States (for sellers)
  const [storeName, setStoreName] = useState('');
  const [businessPermit, setBusinessPermit] = useState('');

  // Preference States
  const [marketingEmails, setMarketingEmails] = useState(true);
  const [orderAlerts, setOrderAlerts] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  // Saved Addresses State
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressLabel, setAddressLabel] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressBarangay, setAddressBarangay] = useState('');
  const [addressLandmark, setAddressLandmark] = useState('');
  const [addressFloor, setAddressFloor] = useState('');
  const [addressPin, setAddressPin] = useState<{ lat: number; lng: number } | null>(null);
  const [addressIsDefault, setAddressIsDefault] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);

  // Load saved addresses
  useEffect(() => {
    if (activeTab === 'addresses') {
      setAddressesLoading(true);
      getAddresses().then(setAddresses).catch(() => {}).finally(() => setAddressesLoading(false));
    }
  }, [activeTab]);

  const resetAddressForm = () => {
    setAddressLabel('');
    setAddressStreet('');
    setAddressBarangay('');
    setAddressLandmark('');
    setAddressFloor('');
    setAddressPin(null);
    setAddressIsDefault(false);
    setEditingAddressId(null);
    setShowAddressForm(false);
  };

  const openEditAddress = (addr: SavedAddress) => {
    setAddressLabel(addr.label);
    setAddressStreet(addr.street || '');
    setAddressBarangay(addr.barangay || '');
    setAddressLandmark(addr.landmark || '');
    setAddressFloor(addr.floorOrGate || '');
    setAddressPin(addr.deliveryLat && addr.deliveryLng ? { lat: addr.deliveryLat, lng: addr.deliveryLng } : null);
    setAddressIsDefault(addr.isDefault);
    setEditingAddressId(addr.id);
    setShowAddressForm(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLabel.trim()) { toast.error('Address label is required'); return; }
    if (!addressStreet.trim()) { toast.error('Street address is required'); return; }
    setAddressSaving(true);
    try {
      const payload: CreateAddressPayload = {
        label: addressLabel.trim(),
        street: addressStreet.trim(),
        barangay: addressBarangay.trim() || undefined,
        landmark: addressLandmark.trim() || undefined,
        floorOrGate: addressFloor.trim() || undefined,
        deliveryLat: addressPin?.lat,
        deliveryLng: addressPin?.lng,
        isDefault: addressIsDefault,
      };
      if (editingAddressId) {
        await updateAddress(editingAddressId, payload);
        toast.success('Address updated');
      } else {
        await createAddress(payload);
        toast.success('Address saved');
      }
      resetAddressForm();
      const data = await getAddresses();
      setAddresses(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save address');
    } finally {
      setAddressSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success('Address deleted');
    } catch { toast.error('Failed to delete address'); }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await updateAddress(id, { isDefault: true });
      const data = await getAddresses();
      setAddresses(data);
      toast.success('Default address updated');
    } catch { toast.error('Failed to set default address'); }
  };

  // Initialize states from user profile data
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setStoreName(user.storeName || '');
      setBusinessPermit(user.businessPermit || '');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Full name is required');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
      });
      await refreshSession();
      toast.success('Profile details updated successfully');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBusinessDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      toast.error('Store name is required');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        storeName: storeName.trim(),
        businessPermit: businessPermit.trim() || undefined,
      });
      await refreshSession();
      toast.success('Business details updated successfully');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to update business details');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Preferences updated successfully');
    }, 400);
  };

  // Check if active tab has modified fields
  const hasProfileChanges =
    user && (name !== (user.name || '') || phone !== (user.phone || ''));

  const hasBusinessChanges =
    user &&
    (storeName !== (user.storeName || '') ||
      businessPermit !== (user.businessPermit || ''));

  const isSeller = user?.role === 'seller';

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        <div className="border-b border-border pb-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Configure</p>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Settings</h1>
            <p className="text-base text-muted-foreground mt-2 max-w-xl">
              Configure your profile settings, business details, default delivery addresses, and set system preferences.
            </p>
          </div>
          <Link to="/" className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            Back to dashboard
          </Link>
        </div>

        {/* Sub-settings Navigation Tabs */}
        <div className="flex border-b border-border mb-12 overflow-x-auto">
          {[
            { id: 'profile' as const, label: 'Profile Details', icon: <User className="h-4 w-4" /> },
            ...(isSeller
              ? [{ id: 'business' as const, label: 'Business Details', icon: <Shield className="h-4 w-4" /> }]
              : []),
            { id: 'addresses' as const, label: 'Saved Addresses', icon: <Home className="h-4 w-4" /> },
            { id: 'preferences' as const, label: 'System Preferences', icon: <Settings className="h-4 w-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-8 py-4 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-foreground text-foreground bg-secondary/10'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="max-w-4xl">
          {/* PROFILE DETAILS TAB */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-12">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2 mb-8">
                  Profile Details
                </h2>

                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" /> Full Name
                    </label>
                    <Input
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" /> Phone Number
                    </label>
                    <Input
                      placeholder="e.g. 09171234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                  <div className="border border-border p-6 bg-secondary/5 flex flex-col justify-between min-h-[120px]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-2">
                      <Mail className="h-3.5 w-3.5" /> Email Address
                    </span>
                    <p className="text-lg font-medium tracking-tighter text-muted-foreground/85 truncate">
                      {user?.email || 'Not set'}
                    </p>
                  </div>

                  <div className="border border-border p-6 bg-secondary/5 flex flex-col justify-between min-h-[120px]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-2">
                      <Shield className="h-3.5 w-3.5" /> Account Role
                    </span>
                    <p className="text-lg font-medium tracking-tighter text-muted-foreground/85 capitalize">
                      {user?.role || 'Customer'}
                    </p>
                  </div>
                </div>
              </div>

              {hasProfileChanges && (
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="h-14 px-8 bg-primary text-primary-foreground hover:opacity-90 font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-opacity disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (user) {
                        setName(user.name || '');
                        setPhone(user.phone || '');
                      }
                    }}
                    className="h-14 px-8 border border-border hover:bg-secondary/20 font-bold uppercase tracking-widest text-xs transition-colors"
                  >
                    Discard Changes
                  </button>
                </div>
              )}
            </form>
          )}

          {/* SAVED ADDRESSES TAB */}
          {activeTab === 'addresses' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
                  Saved Addresses
                </h2>
                <Button
                  onClick={() => { resetAddressForm(); setShowAddressForm(true); }}
                  className="h-10 px-5 bg-foreground text-background hover:opacity-90 font-bold uppercase tracking-widest text-[10px] rounded-none flex items-center gap-2"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>

              {/* Address Form Overlay */}
              {showAddressForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="w-full max-w-2xl bg-background border border-border p-8 md:p-12 mx-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
                          {editingAddressId ? 'Edit Address' : 'New Address'}
                        </p>
                        <h2 className="text-3xl font-medium tracking-tighter">
                          {editingAddressId ? 'Update address details' : 'Add a delivery address'}
                        </h2>
                      </div>
                      <button onClick={resetAddressForm} className="h-10 w-10 border border-border flex items-center justify-center hover:bg-foreground hover:text-background transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveAddress} className="space-y-6">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Label *</label>
                        <Input
                          placeholder="e.g. Home, Office, Grandma's House"
                          value={addressLabel}
                          onChange={(e) => setAddressLabel(e.target.value)}
                          className="h-14 rounded-none border-border bg-transparent focus-visible:ring-0 focus-visible:border-foreground shadow-none"
                          required
                        />
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Street / Unit *</label>
                          <Input
                            placeholder="Street, building, unit"
                            value={addressStreet}
                            onChange={(e) => setAddressStreet(e.target.value)}
                            className="h-14 rounded-none border-border bg-transparent focus-visible:ring-0 focus-visible:border-foreground shadow-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Barangay</label>
                          <Input
                            placeholder="Barangay"
                            value={addressBarangay}
                            onChange={(e) => setAddressBarangay(e.target.value)}
                            className="h-14 rounded-none border-border bg-transparent focus-visible:ring-0 focus-visible:border-foreground shadow-none"
                          />
                        </div>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Landmark</label>
                          <Input
                            placeholder="Nearby landmark"
                            value={addressLandmark}
                            onChange={(e) => setAddressLandmark(e.target.value)}
                            className="h-14 rounded-none border-border bg-transparent focus-visible:ring-0 focus-visible:border-foreground shadow-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Floor / Gate</label>
                          <Input
                            placeholder="Floor, gate, etc."
                            value={addressFloor}
                            onChange={(e) => setAddressFloor(e.target.value)}
                            className="h-14 rounded-none border-border bg-transparent focus-visible:ring-0 focus-visible:border-foreground shadow-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Map pin</label>
                        <LazyDeliveryLocationPicker
                          value={addressPin}
                          onChange={setAddressPin}
                          title="Delivery location"
                          description="Pin the exact delivery location on the map."
                          emptyText="No pin set."
                        />
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer pt-2">
                        <input
                          type="checkbox"
                          checked={addressIsDefault}
                          onChange={(e) => setAddressIsDefault(e.target.checked)}
                          className="h-5 w-5 accent-primary cursor-pointer border border-border bg-background"
                        />
                        <span className="text-sm font-medium">Set as default delivery address</span>
                      </label>
                      <div className="flex gap-4 pt-4">
                        <Button type="submit" disabled={addressSaving} className="flex-1 h-14 rounded-none bg-primary text-primary-foreground hover:opacity-90 font-bold uppercase tracking-widest text-xs">
                          {addressSaving ? 'Saving...' : editingAddressId ? 'Update address' : 'Save address'}
                        </Button>
                        <Button type="button" variant="outline" onClick={resetAddressForm} className="h-14 rounded-none border-border font-bold uppercase tracking-widest text-xs">
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Addresses List */}
              {addressesLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-36 border border-border bg-secondary/5 animate-pulse" />
                  ))}
                </div>
              ) : addresses.length === 0 ? (
                <div className="border border-border p-12 text-center bg-secondary/5">
                  <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium tracking-tighter mb-2">No saved addresses</p>
                  <p className="text-sm text-muted-foreground mb-6">Add addresses for faster checkout.</p>
                  <Button onClick={() => { resetAddressForm(); setShowAddressForm(true); }} className="h-10 px-6 bg-foreground text-background hover:opacity-90 font-bold uppercase tracking-widest text-[10px] rounded-none">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add your first address
                  </Button>
                </div>
              ) : (
                <Stagger className="grid gap-4 md:grid-cols-2">
                  {addresses.map((addr) => (
                    <StaggerItem key={addr.id}>
                      <div className="border border-border p-6 bg-background flex flex-col justify-between h-full group hover:bg-secondary/5 transition-colors">
                        <div>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 flex items-center justify-center bg-primary/10 text-primary shrink-0">
                                <Home className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-base font-bold tracking-tight">{addr.label}</p>
                                {addr.isDefault && (
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-primary flex items-center gap-1">
                                    <Star className="h-3 w-3" /> Default
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1 mb-6">
                            <p className="text-sm text-muted-foreground">{addr.street}</p>
                            {addr.barangay && <p className="text-sm text-muted-foreground">{addr.barangay}</p>}
                            {addr.landmark && <p className="text-sm text-muted-foreground italic">Near {addr.landmark}</p>}
                          </div>
                        </div>
                        <div className="border-t border-border pt-3 flex gap-2">
                          <button onClick={() => openEditAddress(addr)} className="flex-1 py-2 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-secondary/10 transition-colors">
                            Edit
                          </button>
                          {!addr.isDefault && (
                            <button onClick={() => handleSetDefaultAddress(addr.id)} className="flex-1 py-2 border border-border text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 transition-colors">
                              Set default
                            </button>
                          )}
                          <button onClick={() => handleDeleteAddress(addr.id)} className="py-2 px-3 border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </StaggerItem>
                  ))}
                </Stagger>
              )}
            </div>
          )}

          {/* SYSTEM PREFERENCES TAB */}
          {activeTab === 'preferences' && (
            <form onSubmit={handleSavePreferences} className="space-y-12">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2 mb-8">
                  System Preferences
                </h2>

                <div className="grid gap-8 md:grid-cols-2">
                  <div className="border border-border p-8 bg-secondary/5 space-y-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">
                      Color Theme
                    </span>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      Select light or dark mode. This preference is saved directly to your browser theme settings.
                    </p>
                    <ThemeToggle className="h-12 border border-border bg-background" />
                  </div>

                  <div className="border border-border p-8 bg-secondary/5 space-y-6">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">
                      Alert Preferences
                    </span>
                    
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={orderAlerts}
                          onChange={(e) => setOrderAlerts(e.target.checked)}
                          className="h-5 w-5 accent-primary cursor-pointer border border-border bg-background"
                        />
                        <span className="text-sm font-medium flex items-center gap-1.5">
                          <Bell className="h-4 w-4" /> Order update alerts
                        </span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={marketingEmails}
                          onChange={(e) => setMarketingEmails(e.target.checked)}
                          className="h-5 w-5 accent-primary cursor-pointer border border-border bg-background"
                        />
                        <span className="text-sm font-medium">
                          Receive promotion emails
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-14 px-8 bg-primary text-primary-foreground hover:opacity-90 font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-opacity"
                >
                  Save Preferences
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
