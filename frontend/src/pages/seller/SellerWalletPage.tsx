import { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Sparkles,
  Banknote,
  Landmark,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/helpers";
import {
  getVendorWallet,
  getVendorTransactions,
  requestVendorWithdrawal,
  getVendorWithdrawals,
  WalletTransaction,
  VendorWithdrawal,
} from "@/services/walletService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";

const PROVIDERS = [
  { id: "gcash", label: "GCash", type: "ewallet" as const, icon: Smartphone },
  { id: "maya", label: "Maya", type: "ewallet" as const, icon: Smartphone },
  { id: "bdo", label: "BDO", type: "bank" as const, icon: Landmark },
  { id: "bpi", label: "BPI", type: "bank" as const, icon: Landmark },
  { id: "metro", label: "Metrobank", type: "bank" as const, icon: Landmark },
  { id: "pnb", label: "PNB", type: "bank" as const, icon: Landmark },
  { id: "landbank", label: "LandBank", type: "bank" as const, icon: Landmark },
  { id: "unionbank", label: "UnionBank", type: "bank" as const, icon: Landmark },
  { id: "security", label: "Security Bank", type: "bank" as const, icon: Landmark },
];

const withdrawalBadgeVariant = (status: string) => {
  switch (status) {
    case "completed": return "success" as const;
    case "failed": return "danger" as const;
    case "processing": return "warning" as const;
    default: return "default" as const;
  }
};

const withdrawalLabel = (status: string) => {
  switch (status) {
    case "completed": return "Completed";
    case "failed": return "Failed";
    case "processing": return "Processing";
    default: return "Pending";
  }
};

const withdrawalIcon = (status: string) => {
  switch (status) {
    case "completed": return <CheckCircle2 className="w-4 h-4" />;
    case "failed": return <XCircle className="w-4 h-4" />;
    case "processing": return <Loader2 className="w-4 h-4 animate-spin" />;
    default: return <Clock className="w-4 h-4" />;
  }
};

const validateAmount = (value: string, balance: number | null): string | null => {
  const num = Number(value);
  if (!value.trim()) return "Enter an amount to withdraw";
  if (isNaN(num) || num <= 0) return "Enter a valid positive amount";
  if (balance !== null && num > balance) return "Insufficient balance";
  if (num > 50000) return "Maximum withdrawal is ₱50,000 per transaction";
  return null;
};

export function SellerWalletPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<VendorWithdrawal[]>([]);
  const [activeTab, setActiveTab] = useState<"activity" | "withdrawals">("activity");
  const [isLoading, setIsLoading] = useState(true);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const amtErr = validateAmount(withdrawAmount, balance);
    setAmountError(amtErr);
    if (amtErr) return false;
    if (!selectedProvider) {
      setProviderError("Select a bank or e-wallet");
      return false;
    }
    if (!accountName.trim()) {
      toast.error("Enter the account holder name");
      return false;
    }
    if (!accountNumber.trim()) {
      toast.error("Enter the account number");
      return false;
    }
    return true;
  };

  const fetchWalletData = useCallback(async () => {
    try {
      const [wallet, txHistory, wdHistory] = await Promise.all([
        getVendorWallet(),
        getVendorTransactions(),
        getVendorWithdrawals(),
      ]);
      if (wallet && 'needsSetup' in wallet) {
        setSetupRequired(true);
      } else {
        setBalance(Number((wallet as any).balance));
        setTransactions(Array.isArray(txHistory) ? txHistory : []);
        setWithdrawals(Array.isArray(wdHistory) ? wdHistory : []);
      }
    } catch (error) {
      console.error("Error fetching vendor wallet:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const handleQuickAmount = (amount: number) => {
    setWithdrawAmount(amount.toString());
  };

  const handleAmountBlur = () => {
    setAmountError(validateAmount(withdrawAmount, balance));
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const provider = PROVIDERS.find((p) => p.id === selectedProvider);
    if (!provider) return;

    setIsSubmitting(true);
    try {
      await requestVendorWithdrawal(Number(withdrawAmount), {
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        accountType: provider.type,
        accountProvider: provider.label,
      });
      toast.success("Withdrawal request submitted");
      setWithdrawAmount("");
      setAccountName("");
      setAccountNumber("");
      setSelectedProvider(null);
      setAmountError(null);
      setProviderError(null);
      await fetchWalletData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to process withdrawal";
      setAmountError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (setupRequired) {
    return (
      <div className="min-h-screen bg-background text-foreground p-12 lg:px-12">
        <div className="max-w-[1400px] mx-auto">
          <div className="border border-border p-12 md:p-16 text-center max-w-lg mx-auto mt-24">
            <Banknote className="h-12 w-12 mx-auto mb-6 text-muted-foreground/50" />
            <h2 className="text-3xl font-medium tracking-tighter mb-3">Shop profile required</h2>
            <p className="text-muted-foreground text-base mb-8 max-w-sm mx-auto leading-relaxed">
              Save your shop profile first to activate your GeoPay Wallet. Go to{" "}
              <strong>Menu &amp; Shop</strong> to set up your shop.
            </p>
            <a
              href="/seller/menu"
              className="inline-block bg-primary text-primary-foreground font-bold uppercase tracking-widest text-sm px-10 py-4 hover:opacity-90 transition-opacity"
            >
              Go to Shop Settings
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        <div className="animate-pulse space-y-8">
          <div className="h-32 bg-secondary/10 border border-border" />
          <div className="grid gap-12 lg:grid-cols-5">
            <div className="lg:col-span-2 h-96 bg-secondary/10 border border-border" />
            <div className="lg:col-span-3 h-96 bg-secondary/10 border border-border" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        <Reveal>
          <div className="border-b-2 border-foreground pb-6 mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Seller Payment System
            </p>
            <h1 className="text-6xl font-medium tracking-tighter text-foreground mt-1">
              GeoPay Wallet.
            </h1>
            <p className="text-xl text-muted-foreground mt-4">
              Receive payments instantly. Withdraw to any bank or e-wallet.
            </p>
          </div>
        </Reveal>

        {/* Master Balance Header */}
        <Reveal>
          <div className="border border-border bg-secondary/5 p-8 md:p-16 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <Wallet className="h-6 w-6 text-primary" />
                <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Available Balance
                </span>
              </div>
              <div className="text-7xl md:text-[8rem] font-medium tracking-tighter leading-[0.9] text-foreground">
                {formatCurrency(balance ?? 0)}
              </div>
            </div>
            <div className="relative z-10 text-left md:text-right border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-8">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Account Holder</p>
              <p className="text-xl font-medium tracking-tighter text-foreground">{user?.name || "Seller"}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-6 mb-2">Status</p>
              <span className="text-primary font-bold uppercase tracking-widest inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" /> Active
              </span>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-12 lg:grid-cols-5">
          {/* Withdraw Section (mirrors customer "Cash In") */}
          <div className="lg:col-span-2 flex flex-col">
            <Reveal>
              <div className="border border-border bg-background p-8 md:p-12 h-full flex flex-col">
                <div className="flex items-center justify-between border-b border-border pb-6 mb-8">
                  <h3 className="text-3xl font-medium tracking-tighter text-foreground">
                    Cash Out
                  </h3>
                  <Banknote className="h-6 w-6 text-muted-foreground" />
                </div>

                <form onSubmit={handleWithdraw} className="flex flex-col flex-1">
                  <div className="space-y-4 mb-8">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Amount (PHP)
                    </label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-medium text-muted-foreground">
                        ₱
                      </span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={withdrawAmount}
                        onBlur={handleAmountBlur}
                        onChange={(e) => { setWithdrawAmount(e.target.value); setAmountError(null); }}
                        className={`pl-14 h-24 rounded-none text-4xl font-medium border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground transition-colors ${amountError ? 'border-red-500 bg-red-500/5' : ''}`}
                        aria-invalid={Boolean(amountError)}
                        aria-describedby={amountError ? 'amount-error' : undefined}
                        min="1"
                        max="50000"
                        required
                      />
                      {amountError && <p id="amount-error" className="text-xs font-bold text-red-500 mt-3">{amountError}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-10">
                    {[500, 1000, 2000, 5000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleQuickAmount(amt)}
                        className="h-14 border border-border font-bold text-lg hover:bg-foreground hover:text-background transition-colors"
                      >
                        +{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4 mb-10">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Bank / E-Wallet
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {PROVIDERS.map((provider) => {
                        const Icon = provider.icon;
                        const isSelected = selectedProvider === provider.id;
                        return (
                          <button
                            key={provider.id}
                            type="button"
                            onClick={() => { setSelectedProvider(provider.id); setProviderError(null); }}
                            className={`h-16 flex flex-col items-center justify-center gap-1 font-bold uppercase tracking-widest text-[10px] transition-colors border ${
                              isSelected
                                ? "bg-foreground text-background border-foreground"
                                : "border-border text-foreground hover:bg-secondary/10"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="leading-tight text-center">{provider.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {providerError && <p className="text-xs font-bold text-red-500">{providerError}</p>}
                  </div>

                  <div className="space-y-4 mb-10">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                        Account Name
                      </label>
                      <Input
                        placeholder="Full name on account"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                        Account Number
                      </label>
                      <Input
                        placeholder="Account / mobile number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="h-14 rounded-none border-border bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-foreground"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-auto pt-8 border-t border-border">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-20 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isSubmitting ? "Processing..." : "Withdraw"}
                    </button>
                  </div>
                </form>
              </div>
            </Reveal>
          </div>

          {/* Activity / Withdrawals Section (mirrors customer "Activity") */}
          <div className="lg:col-span-3 flex flex-col">
            <Reveal>
              <div className="border border-border bg-background flex flex-col h-full min-h-[600px]">
                {/* Tab Headers */}
                <div className="border-b border-border flex">
                  <button
                    onClick={() => setActiveTab("activity")}
                    className={`flex-1 px-8 py-5 text-xs font-bold uppercase tracking-widest transition-colors ${
                      activeTab === "activity"
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <History className="w-4 h-4 inline mr-2" />
                    Activity
                  </button>
                  <button
                    onClick={() => setActiveTab("withdrawals")}
                    className={`flex-1 px-8 py-5 text-xs font-bold uppercase tracking-widest transition-colors ${
                      activeTab === "withdrawals"
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Banknote className="w-4 h-4 inline mr-2" />
                    Withdrawals
                  </button>
                </div>

                {/* Activity Tab */}
                {activeTab === "activity" && (
                  <div className="flex-1 overflow-y-auto p-8 md:p-12">
                    {transactions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-6 py-20">
                        <AlertCircle className="h-12 w-12 text-border" />
                        <div>
                          <p className="text-3xl font-medium tracking-tighter text-foreground mb-2">No history</p>
                          <p className="text-lg">GeoPay payments from customers will appear here.</p>
                        </div>
                      </div>
                    ) : (
                      <Stagger className="space-y-2">
                        {transactions.map((tx) => {
                          const isCredit = Number(tx.amount) > 0;
                          const label =
                            tx.type === "vendor_payout"
                              ? "GeoPay Payment"
                              : tx.type === "withdrawal"
                              ? "Withdrawal"
                              : tx.type;
                          return (
                            <StaggerItem key={tx.id}>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border border-border bg-background hover:bg-secondary/5 transition-colors gap-4">
                                <div className="flex items-center gap-4">
                                  <div className={`h-12 w-12 border flex items-center justify-center shrink-0 ${
                                    isCredit
                                      ? "bg-green-500/10 border-green-500/20 text-green-500"
                                      : "bg-primary/10 border-primary/20 text-primary"
                                  }`}>
                                    {isCredit ? (
                                      <ArrowDownLeft className="h-5 w-5" />
                                    ) : (
                                      <ArrowUpRight className="h-5 w-5" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-xl font-medium tracking-tighter text-foreground capitalize">
                                      {label}
                                    </p>
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1 block">
                                      {new Date(tx.createdAt).toLocaleDateString("en-PH", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "numeric",
                                        minute: "numeric",
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <div className="sm:text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-border pt-4 sm:pt-0">
                                  <span className={`text-2xl font-medium tracking-tighter ${
                                    isCredit ? "text-green-500" : "text-foreground"
                                  }`}>
                                    {isCredit ? "+" : ""}{formatCurrency(tx.amount)}
                                  </span>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:mt-1">
                                    {tx.paymentMethod || "GEOPAY"}
                                  </p>
                                </div>
                              </div>
                            </StaggerItem>
                          );
                        })}
                      </Stagger>
                    )}
                  </div>
                )}

                {/* Withdrawals Tab */}
                {activeTab === "withdrawals" && (
                  <div className="flex-1 overflow-y-auto p-8 md:p-12">
                    {withdrawals.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-6 py-20">
                        <Banknote className="h-12 w-12 text-border" />
                        <div>
                          <p className="text-3xl font-medium tracking-tighter text-foreground mb-2">No withdrawals</p>
                          <p className="text-lg">Your cash-out requests will appear here.</p>
                        </div>
                      </div>
                    ) : (
                      <Stagger className="space-y-2">
                        {withdrawals.map((wd) => (
                          <StaggerItem key={wd.id}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border border-border bg-background hover:bg-secondary/5 transition-colors gap-4">
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 border border-border flex items-center justify-center shrink-0 text-muted-foreground">
                                  {withdrawalIcon(wd.status)}
                                </div>
                                <div>
                                  <p className="text-xl font-medium tracking-tighter text-foreground">
                                    {wd.accountProvider}
                                  </p>
                                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mt-1">
                                    {wd.accountName} • {wd.accountNumber.slice(-4).padStart(wd.accountNumber.length, "*")}
                                  </span>
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 block">
                                    {new Date(wd.createdAt).toLocaleDateString("en-PH", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "numeric",
                                      minute: "numeric",
                                    })}
                                  </span>
                                </div>
                              </div>
                              <div className="sm:text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-border pt-4 sm:pt-0">
                                <span className="text-2xl font-medium tracking-tighter">
                                  {formatCurrency(wd.amount)}
                                </span>
                                <Badge variant={withdrawalBadgeVariant(wd.status)} className="sm:mt-1">
                                  {withdrawalLabel(wd.status)}
                                </Badge>
                              </div>
                            </div>
                          </StaggerItem>
                        ))}
                      </Stagger>
                    )}
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}