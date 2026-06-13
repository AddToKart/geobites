import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getVendors } from '@/services/vendorService';
import {
  createPromotion,
  deletePromotion,
  getVendorPromotions,
  togglePromotion,
} from '@/services/promotionService';
import { Promotion, Vendor } from '@/types';
import { toast } from 'sonner';
import {
  Megaphone,
  Plus,
  Power,
  PowerOff,
  Trash2,
  Percent,
  Bike,
  Gift,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PROMOTION_TYPE_CONFIG = {
  percentage: { label: 'Percentage off', icon: Percent, color: 'text-blue-500' },
  free_delivery: { label: 'Free delivery', icon: Bike, color: 'text-emerald-500' },
  bogo: { label: 'Buy one get one', icon: Gift, color: 'text-purple-500' },
} as const;

const defaultForm = {
  name: '',
  description: '',
  type: 'percentage' as const,
  value: '',
  minOrderAmount: '',
  maxDiscount: '',
  applicableTo: 'all_items',
  startsAt: '',
  expiresAt: '',
  usageLimit: '',
};

export function SellerPromotions() {
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [isAdding, setIsAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const vendors = await getVendors({ page: 1, limit: 100 });
      const myVendor = vendors.data.find((v) => v.userId === user.id) ?? null;
      setVendor(myVendor);
      if (myVendor) {
        const promos = await getVendorPromotions(myVendor.id);
        setPromotions(promos);
      }
    } catch {
      toast.error('Failed to load promotions');
    }
  }, [user]);

  useEffect(() => { void loadData(); }, [loadData]);

  const activePromotions = useMemo(
    () => promotions.filter((p) => p.isActive && new Date(p.startsAt) <= new Date() && (!p.expiresAt || new Date(p.expiresAt) >= new Date())),
    [promotions],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!vendor) {
      toast.error('Save your shop profile first');
      return;
    }
    setIsAdding(true);
    try {
      await createPromotion({
        vendorId: vendor.id,
        name: form.name,
        description: form.description || undefined,
        type: form.type,
        value: Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
        maxDiscount: form.type === 'percentage' && form.maxDiscount ? Number(form.maxDiscount) : undefined,
        applicableTo: form.applicableTo,
        startsAt: new Date(form.startsAt).toISOString(),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      });
      toast.success('Promotion created');
      setForm(defaultForm);
      setShowForm(false);
      await loadData();
    } catch (caughtError) {
      toast.error(caughtError instanceof Error ? caughtError.message : 'Failed to create promotion');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const updated = await togglePromotion(id);
      setPromotions((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast.success(`Promotion ${updated.isActive ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error('Failed to toggle promotion');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePromotion(id);
      setPromotions((prev) => prev.filter((p) => p.id !== id));
      toast.success('Promotion removed');
    } catch {
      toast.error('Failed to delete promotion');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        <div className="border-b border-border pb-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Seller</p>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Promotions</h1>
            <p className="text-base text-muted-foreground mt-2 max-w-xl">
              Create offers like percentage discounts, free delivery, and buy-one-get-one deals to attract more customers.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="border border-border px-4 py-2 text-right">
              <p className="text-2xl font-bold tracking-tight">{activePromotions.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active</p>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="h-12 px-6 bg-primary text-primary-foreground hover:opacity-90 font-bold uppercase tracking-widest text-xs rounded-none"
            >
              <Plus className="h-4 w-4 mr-2" />
              New promotion
            </Button>
          </div>
        </div>

        {/* New Promotion Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="border border-border p-8 mb-12 bg-secondary/5 space-y-6">
            <p className="text-sm font-bold uppercase tracking-widest">Create promotion</p>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Name</label>
                <Input
                  placeholder="e.g. 20% off all items"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="h-12 rounded-none border-border bg-transparent"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as any }))}
                  className="h-12 w-full border border-border bg-background px-3 text-sm outline-none focus:border-foreground text-foreground"
                >
                  <option value="percentage" className="bg-background text-foreground" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>Percentage off</option>
                  <option value="free_delivery" className="bg-background text-foreground" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>Free delivery</option>
                  <option value="bogo" className="bg-background text-foreground" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>Buy one get one</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {form.type === 'percentage' ? 'Discount %' : form.type === 'free_delivery' ? 'Min. order amount' : 'Value'}
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder={form.type === 'percentage' ? '20' : form.type === 'free_delivery' ? '0' : '1'}
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  className="h-12 rounded-none border-border bg-transparent"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Start date</label>
                <Input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                  className="h-12 rounded-none border-border bg-transparent"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Expiry date (optional)</label>
                <Input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  className="h-12 rounded-none border-border bg-transparent"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Usage limit (optional)</label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={form.usageLimit}
                  onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                  className="h-12 rounded-none border-border bg-transparent"
                />
              </div>
              {form.type === 'percentage' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Max discount (optional)</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="No cap"
                    value={form.maxDiscount}
                    onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
                    className="h-12 rounded-none border-border bg-transparent"
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Min. order amount (optional)</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="No minimum"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
                  className="h-12 rounded-none border-border bg-transparent"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description (optional)</label>
                <Input
                  placeholder="e.g. On all main dishes"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="h-12 rounded-none border-border bg-transparent"
                />
              </div>
            </div>
            <div className="flex gap-4 pt-4 border-t border-border">
              <Button type="submit" disabled={isAdding} className="h-12 px-8 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs rounded-none">
                {isAdding ? 'Creating...' : 'Create promotion'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="h-12 px-8 rounded-none border border-border font-bold uppercase tracking-widest text-xs">
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Promotions List */}
        {promotions.length === 0 ? (
          <div className="border border-dashed border-border p-12 text-center text-sm text-muted-foreground bg-secondary/5">
            <Megaphone className="h-8 w-8 mx-auto mb-4 text-muted-foreground/50" />
            <p className="font-semibold text-foreground mb-1">No promotions yet</p>
            <p className="text-xs">Create your first promotion to attract more customers.</p>
          </div>
        ) : (
          <div className="divide-y divide-border border-t border-b border-border">
            {promotions.map((promo) => {
              const config = PROMOTION_TYPE_CONFIG[promo.type];
              const Icon = config.icon;
              const isExpired = promo.expiresAt && new Date(promo.expiresAt) < new Date();
              const isScheduled = new Date(promo.startsAt) > new Date();
              const isLive = promo.isActive && !isExpired && !isScheduled;

              return (
                <div key={promo.id} className="flex flex-wrap items-center justify-between gap-4 py-6">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className={`mt-1 ${config.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-lg text-foreground">{promo.name}</p>
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border ${
                          isLive
                            ? 'border-emerald-500/50 text-emerald-500'
                            : isScheduled
                            ? 'border-blue-500/50 text-blue-500'
                            : isExpired
                            ? 'border-danger/50 text-danger'
                            : 'border-border text-muted-foreground'
                        }`}>
                          {isLive ? 'Live' : isScheduled ? 'Scheduled' : isExpired ? 'Expired' : 'Inactive'}
                        </span>
                      </div>
                      {promo.description && (
                        <p className="text-sm text-muted-foreground">{promo.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="border border-border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                          {config.label}
                        </span>
                        {promo.type === 'percentage' && (
                          <span className="border border-border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                            {promo.value}% off
                          </span>
                        )}
                        {promo.minOrderAmount && promo.minOrderAmount > 0 && (
                          <span className="border border-border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                            Min. ₱{promo.minOrderAmount}
                          </span>
                        )}
                        {promo.usageLimit && (
                          <span className="border border-border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                            {promo.currentUsage}/{promo.usageLimit} used
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-none border border-foreground font-bold uppercase tracking-widest text-[10px]"
                      onClick={() => void handleToggle(promo.id)}
                    >
                      {promo.isActive ? <PowerOff className="h-3 w-3 mr-1" /> : <Power className="h-3 w-3 mr-1" />}
                      {promo.isActive ? 'Pause' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-none border border-danger text-danger hover:bg-danger/5 font-bold uppercase tracking-widest text-[10px]"
                      onClick={() => void handleDelete(promo.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
