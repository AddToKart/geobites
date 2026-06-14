import { useState } from "react";
import { Gift, Plus, Percent, Tag, Trash2, Ban } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyVouchers, createVoucher, deleteVoucher, updateVoucher } from "@/services/voucherService";
import type { CreateVoucherPayload, Voucher } from "@/services/voucherService";
import { formatCurrency } from "@/utils/helpers";
import { toast } from "sonner";

export function SellerVouchersSection() {
  const queryClient = useQueryClient();
  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ["vouchers", "vendor"],
    queryFn: getMyVouchers,
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateVoucherPayload>({
    code: "",
    title: "",
    description: "",
    discountType: "fixed",
    discountValue: 0,
    minOrderAmount: 0,
    maxUses: 100,
    startsAt: new Date().toISOString().slice(0, 10),
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    isActive: true,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateVoucherPayload) => createVoucher(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      setShowForm(false);
      setForm({
        code: "", title: "", description: "",
        discountType: "fixed", discountValue: 0, minOrderAmount: 0,
        maxUses: 100,
        startsAt: new Date().toISOString().slice(0, 10),
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        isActive: true,
      });
      toast.success("Voucher created!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVoucher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      toast.success("Voucher deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateVoucher(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.title.trim() || form.discountValue <= 0) {
      toast.error("Code, title, and discount value are required");
      return;
    }
    createMutation.mutate({
      ...form,
      startsAt: new Date(form.startsAt).toISOString(),
      expiresAt: new Date(form.expiresAt).toISOString(),
    });
  };

  const now = new Date();

  return (
    <div className="border border-border bg-background p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Gift className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-medium tracking-tighter">Vouchers</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="h-10 px-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "New Voucher"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border border-border p-6 mb-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1">Code</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full h-10 border border-border bg-transparent px-3 text-sm uppercase focus:outline-none focus:border-foreground"
                placeholder="e.g. SALE20"
                maxLength={30}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full h-10 border border-border bg-transparent px-3 text-sm focus:outline-none focus:border-foreground"
                placeholder="e.g. 20% off all items"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1">Description</label>
            <input
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full h-10 border border-border bg-transparent px-3 text-sm focus:outline-none focus:border-foreground"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1">Type</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value as 'fixed' | 'percentage' })}
                className="w-full h-10 border border-border bg-transparent px-3 text-sm focus:outline-none focus:border-foreground"
              >
                <option value="fixed">Fixed (₱)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1">Value</label>
              <input
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                className="w-full h-10 border border-border bg-transparent px-3 text-sm focus:outline-none focus:border-foreground"
                min={1}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1">Min Order</label>
              <input
                type="number"
                value={form.minOrderAmount || 0}
                onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
                className="w-full h-10 border border-border bg-transparent px-3 text-sm focus:outline-none focus:border-foreground"
                min={0}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1">Max Uses</label>
              <input
                type="number"
                value={form.maxUses || ""}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full h-10 border border-border bg-transparent px-3 text-sm focus:outline-none focus:border-foreground"
                min={1}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1">Starts</label>
              <input
                type="date"
                value={form.startsAt?.slice(0, 10)}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                className="w-full h-10 border border-border bg-transparent px-3 text-sm focus:outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1">Expires</label>
              <input
                type="date"
                value={form.expiresAt?.slice(0, 10)}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full h-10 border border-border bg-transparent px-3 text-sm focus:outline-none focus:border-foreground"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="h-12 px-6 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {createMutation.isPending ? "Creating..." : "Create Voucher"}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-border rounded" />)}
        </div>
      ) : vouchers.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">No vouchers yet. Create your first one!</p>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {vouchers.map((v) => {
            const expired = new Date(v.expiresAt) < now;
            const active = v.isActive && !expired;
            return (
              <div key={v.id} className="flex items-center justify-between p-4 border border-border hover:bg-secondary/5 transition-colors gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-mono font-bold text-primary text-sm">{v.code}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 ${
                      active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    }`}>
                      {active ? "Active" : expired ? "Expired" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">{v.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.discountType === "fixed" ? `₱${v.discountValue} off` : `${v.discountValue}% off`}
                    {" — "}Min: {formatCurrency(v.minOrderAmount)}
                    {v.maxUses ? ` — ${v.currentUses}/${v.maxUses} used` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleMutation.mutate({ id: v.id, isActive: !v.isActive })}
                    className="h-9 w-9 border border-border flex items-center justify-center hover:bg-secondary/10 transition-colors"
                    title={v.isActive ? "Deactivate" : "Activate"}
                  >
                    <Ban className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm("Delete this voucher?")) deleteMutation.mutate(v.id); }}
                    className="h-9 w-9 border border-border flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
