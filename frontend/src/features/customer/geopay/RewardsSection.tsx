import { useState } from "react";
import { Gift, Sparkles, ArrowRight, History, Tag } from "lucide-react";
import { useRewardsBalance, useRewardHistory, useRedeemPoints } from "@/hooks/queries";
import { formatCurrency } from "@/utils/helpers";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";

export function RewardsSection() {
  const { data: rewards, isLoading: balanceLoading } = useRewardsBalance();
  const { data: history = [], isLoading: historyLoading } = useRewardHistory();
  const redeemMutation = useRedeemPoints();
  const [redeemAmount, setRedeemAmount] = useState(100);

  const isLoading = balanceLoading || historyLoading;

  const handleRedeem = () => {
    if (!rewards || rewards.balance < redeemAmount) return;
    redeemMutation.mutate(redeemAmount);
  };

  if (isLoading) {
    return (
      <div className="border border-border bg-background p-8 md:p-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-border rounded" />
          <div className="h-16 w-32 bg-border rounded" />
          <div className="h-12 bg-border rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border bg-background">
      <div className="p-8 md:p-12 border-b border-border">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Gift className="h-6 w-6 text-primary" />
            <h3 className="text-3xl font-medium tracking-tighter">Loyalty Rewards</h3>
          </div>
          <Sparkles className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="grid gap-8 md:grid-cols-3 mb-8">
          <div className="border border-border p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Points Balance</p>
            <p className="text-4xl font-medium tracking-tighter">{rewards?.balance ?? 0}</p>
          </div>
          <div className="border border-border p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Available Discount</p>
            <p className="text-4xl font-medium tracking-tighter">{formatCurrency(rewards?.discountBalance ?? 0)}</p>
          </div>
          <div className="border border-border p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Lifetime Earned</p>
            <p className="text-4xl font-medium tracking-tighter">{rewards?.lifetimeEarned ?? 0}</p>
          </div>
        </div>

        {rewards && rewards.discountBalance > 0 && (
          <div className="flex items-center gap-3 p-4 border border-primary/20 bg-primary/5 mb-6">
            <Tag className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm font-medium">
              You have <span className="text-primary font-bold">{formatCurrency(rewards.discountBalance)}</span> in discount credits — applied at checkout.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
              Redeem Points (10 pts = ₱1 discount)
            </label>
            <select
              value={redeemAmount}
              onChange={(e) => setRedeemAmount(Number(e.target.value))}
              className="w-full h-14 border border-border bg-background px-4 text-lg font-medium focus:outline-none focus:border-foreground text-foreground"
            >
              <option value={50} className="bg-background text-foreground" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>50 points (₱5 discount)</option>
              <option value={100} className="bg-background text-foreground" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>100 points (₱10 discount)</option>
              <option value={200} className="bg-background text-foreground" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>200 points (₱20 discount)</option>
              <option value={500} className="bg-background text-foreground" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>500 points (₱50 discount)</option>
              <option value={1000} className="bg-background text-foreground" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>1,000 points (₱100 discount)</option>
            </select>
          </div>
          <button
            onClick={handleRedeem}
            disabled={!rewards || rewards.balance < redeemAmount || redeemMutation.isPending}
            className="h-14 px-8 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shrink-0"
          >
            {redeemMutation.isPending ? "Processing..." : "Redeem for Discount"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {history.length > 0 && (
        <div className="p-8 md:p-12">
          <div className="flex items-center gap-2 mb-6">
            <History className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">History</p>
          </div>
          <Stagger className="space-y-2 max-h-64 overflow-y-auto">
            {history.map((tx) => (
              <StaggerItem key={tx.id}>
                <div className="flex items-center justify-between p-4 border border-border">
                  <div>
                    <p className="text-sm font-medium">
                      {tx.type === "earned" ? "Points Earned" : tx.type === "redeemed" ? "Discount Redeemed" : "Points Expired"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{tx.description}</p>
                  </div>
                  <span className={`text-lg font-medium ${tx.type === "earned" ? "text-green-500" : "text-red-500"}`}>
                    {tx.type === "earned" ? "+" : ""}{tx.points} pts
                  </span>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      )}
    </div>
  );
}
