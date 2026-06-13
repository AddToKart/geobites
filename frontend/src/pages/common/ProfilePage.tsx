import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Phone, Shield, User, Loader2, Save, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { LazyDeliveryLocationPicker } from '@/components/maps/LazyDeliveryLocationPicker';
import { updateProfile } from '@/services/authService';
import { toast } from 'sonner';

export function ProfilePage() {
  const { user, refreshSession } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [barangay, setBarangay] = useState('');
  const [landmark, setLandmark] = useState('');
  const [deliveryPin, setDeliveryPin] = useState<{ lat: number; lng: number } | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
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
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
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
        street: street.trim() || undefined,
        barangay: barangay.trim() || undefined,
        landmark: landmark.trim() || undefined,
        deliveryLat: deliveryPin?.lat ?? undefined,
        deliveryLng: deliveryPin?.lng ?? undefined,
      });

      await refreshSession();
      toast.success('Profile and default location updated successfully');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    user &&
    (name !== (user.name || '') ||
      phone !== (user.phone || '') ||
      street !== (user.street || '') ||
      barangay !== (user.barangay || '') ||
      landmark !== (user.landmark || '') ||
      (deliveryPin?.lat !== (user.deliveryLat ? Number(user.deliveryLat) : undefined)) ||
      (deliveryPin?.lng !== (user.deliveryLng ? Number(user.deliveryLng) : undefined)));

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        <div className="border-b-2 border-foreground pb-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Account</p>
            <h1 className="text-6xl font-medium tracking-tighter">Profile.</h1>
            <p className="text-xl text-muted-foreground mt-4 max-w-xl">
              Configure your profile settings and set your default location for hassle-free orders.
            </p>
          </div>
          <Link to="/" className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            Back to dashboard
          </Link>
        </div>

        <form onSubmit={handleSave} className="grid gap-16 xl:grid-cols-[1fr_500px]">
          {/* Left Column - Personal Info */}
          <div className="space-y-12">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2 mb-6">
                Personal Information
              </h2>
              
              <div className="space-y-6">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="border border-border p-6 bg-secondary/5 flex flex-col justify-between min-h-[120px]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-2">
                      <Mail className="h-3.5 w-3.5" /> Email Address
                    </span>
                    <p className="text-lg font-medium tracking-tighter text-muted-foreground/80 truncate">
                      {user?.email || 'Not set'}
                    </p>
                  </div>

                  <div className="border border-border p-6 bg-secondary/5 flex flex-col justify-between min-h-[120px]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-2">
                      <Shield className="h-3.5 w-3.5" /> Account Role
                    </span>
                    <p className="text-lg font-medium tracking-tighter text-muted-foreground/80 capitalize">
                      {user?.role || 'Customer'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {hasChanges && (
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
                  Save Profile Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (user) {
                      setName(user.name || '');
                      setPhone(user.phone || '');
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

          {/* Right Column - Default Location Address */}
          <div className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2 mb-2">
              Default Delivery Location
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Saving your address defaults automatically pre-fills the checkout forms for all future orders.
            </p>

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

            {hasChanges && (
              <div className="pt-6 border-t border-border xl:hidden">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full h-16 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save all changes"}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
