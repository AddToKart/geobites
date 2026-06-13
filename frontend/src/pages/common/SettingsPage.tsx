import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Phone, Shield, User, Loader2, Save, ArrowRight, Settings, MapPin, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { LazyDeliveryLocationPicker } from '@/components/maps/LazyDeliveryLocationPicker';
import { updateProfile } from '@/services/authService';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { toast } from 'sonner';

type SettingsTab = 'profile' | 'location' | 'business' | 'preferences';

export function SettingsPage() {
  const { user, refreshSession } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Profile Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Location Form States
  const [street, setStreet] = useState('');
  const [barangay, setBarangay] = useState('');
  const [landmark, setLandmark] = useState('');
  const [deliveryPin, setDeliveryPin] = useState<{ lat: number; lng: number } | null>(null);

  // Business Form States (for sellers)
  const [storeName, setStoreName] = useState('');
  const [businessPermit, setBusinessPermit] = useState('');

  // Preference States
  const [marketingEmails, setMarketingEmails] = useState(true);
  const [orderAlerts, setOrderAlerts] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  // Initialize states from user profile data
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setStreet(user.street || '');
      setBarangay(user.barangay || '');
      setLandmark(user.landmark || '');
      setStoreName(user.storeName || '');
      setBusinessPermit(user.businessPermit || '');
      if (user.deliveryLat && user.deliveryLng) {
        setDeliveryPin({
          lat: Number(user.deliveryLat),
          lng: Number(user.deliveryLng),
        });
      } else {
        setDeliveryPin(null);
      }
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

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        street: street.trim() || undefined,
        barangay: barangay.trim() || undefined,
        landmark: landmark.trim() || undefined,
        deliveryLat: deliveryPin ? String(deliveryPin.lat) : undefined,
        deliveryLng: deliveryPin ? String(deliveryPin.lng) : undefined,
      });
      await refreshSession();
      toast.success('Default delivery location saved');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to update location');
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

  const hasLocationChanges =
    user &&
    (street !== (user.street || '') ||
      barangay !== (user.barangay || '') ||
      landmark !== (user.landmark || '') ||
      (deliveryPin?.lat !== (user.deliveryLat ? Number(user.deliveryLat) : undefined)) ||
      (deliveryPin?.lng !== (user.deliveryLng ? Number(user.deliveryLng) : undefined)));

  const hasBusinessChanges =
    user &&
    (storeName !== (user.storeName || '') ||
      businessPermit !== (user.businessPermit || ''));

  const isSeller = user?.role === 'seller';

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        <div className="border-b-2 border-foreground pb-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Configure</p>
            <h1 className="text-6xl font-medium tracking-tighter">Settings.</h1>
            <p className="text-xl text-muted-foreground mt-4 max-w-xl">
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
              : [{ id: 'location' as const, label: 'Default Location', icon: <MapPin className="h-4 w-4" /> }]),
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

          {/* DEFAULT LOCATION TAB */}
          {activeTab === 'location' && (
            <form onSubmit={handleSaveLocation} className="grid gap-12 md:grid-cols-2">
              <div className="space-y-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
                  Address Information
                </h2>

                <div className="space-y-4">
                  <Input
                    placeholder="Street / Unit Number"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground"
                  />

                  <Input
                    placeholder="Barangay"
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                    className="h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground"
                  />

                  <Input
                    placeholder="Landmark (Optional)"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground"
                  />
                </div>

                {hasLocationChanges && (
                  <div className="flex gap-4 pt-4">
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
                      Save Location
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (user) {
                          setStreet(user.street || '');
                          setBarangay(user.barangay || '');
                          setLandmark(user.landmark || '');
                          if (user.deliveryLat && user.deliveryLng) {
                            setDeliveryPin({
                              lat: Number(user.deliveryLat),
                              lng: Number(user.deliveryLng),
                            });
                          } else {
                            setDeliveryPin(null);
                          }
                        }
                      }}
                      className="h-14 px-8 border border-border hover:bg-secondary/20 font-bold uppercase tracking-widest text-xs transition-colors"
                    >
                      Discard
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
                  Map Pin Coordinates
                </h2>
                <div className="pt-2">
                  <LazyDeliveryLocationPicker
                    value={deliveryPin}
                    onChange={setDeliveryPin}
                    title="Default delivery pin"
                    description="Open map to pin your default coordinates."
                    emptyText="No default delivery pin saved."
                  />
                </div>
              </div>
            </form>
          )}

          {/* BUSINESS DETAILS TAB */}
          {activeTab === 'business' && (
            <form onSubmit={handleSaveBusinessDetails} className="space-y-12">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2 mb-8">
                  Business Details
                </h2>

                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" /> Store Name
                    </label>
                    <Input
                      placeholder="Enter your store name"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Shield className="h-4 w-4" /> Business Permit No.
                    </label>
                    <Input
                      placeholder="Enter business permit number"
                      value={businessPermit}
                      onChange={(e) => setBusinessPermit(e.target.value)}
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

              {hasBusinessChanges && (
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
                    Save Business Details
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (user) {
                        setStoreName(user.storeName || '');
                        setBusinessPermit(user.businessPermit || '');
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
