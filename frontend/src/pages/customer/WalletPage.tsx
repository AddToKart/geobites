import { useState } from "react";
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  History, 
  Sparkles, 
  CreditCard,
  AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/utils/helpers";
import { initiateCashIn } from "@/services/walletService";
import { useAuth } from "@/hooks/useAuth";
import { useWallet, useTransactions } from "@/hooks/queries";
import { toast } from "sonner";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";

export function WalletPage() {
  const { user } = useAuth();
  const { data: walletData, isLoading: walletLoading } = useWallet();
  const { data: transactions = [], isLoading: txLoading } = useTransactions();

  const balance = walletData ? Number(walletData.balance) : null;
  const isLoading = walletLoading || txLoading;

  const [cashInAmount, setCashInAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"GCASH" | "MAYA" | "QRPH">("GCASH");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);

  const validateAmount = (value: string): string | null => {
    const num = Number(value);
    if (!value.trim()) return 'Enter an amount to cash in';
    if (isNaN(num) || num <= 0) return 'Enter a valid positive amount';
    if (num > 50000) return 'Maximum cash-in is ₱50,000 per transaction';
    return null;
  };

  const handleAmountBlur = () => {
    setAmountError(validateAmount(cashInAmount));
  };

  const handleQuickAmount = (amount: number) => {
    setCashInAmount(amount.toString());
  };

  const handleCashIn = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateAmount(cashInAmount);
    setAmountError(error);
    if (error) return;

    const amountNum = Number(cashInAmount);

    setIsSubmitting(true);
    try {
      const result = await initiateCashIn(amountNum, paymentMethod);
      toast.success("Redirecting to payment processor...");
      window.location.href = result.checkoutUrl;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to initiate cash-in"
      );
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        <Skeleton className="h-32 rounded-none border border-border" />
        <div className="mt-12 space-y-8">
          <Skeleton className="h-64 rounded-none border border-border" />
          <div className="grid gap-12 md:grid-cols-2">
            <Skeleton className="h-96 rounded-none border border-border" />
            <Skeleton className="h-96 rounded-none border border-border" />
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
              <Sparkles className="w-4 h-4" /> Direct Payment System
            </p>
            <h1 className="text-6xl font-medium tracking-tighter text-foreground mt-1">
              GeoPay Wallet.
            </h1>
            <p className="text-xl text-muted-foreground mt-4">
              Cash in seamlessly. Pay instantly. Zero friction.
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
              <p className="text-xl font-medium tracking-tighter text-foreground">{user?.name || "Member"}</p>
              
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-6 mb-2">Status</p>
              <span className="text-primary font-bold uppercase tracking-widest inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" /> Active
              </span>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Cash In Section */}
          <div className="flex flex-col">
            <Reveal>
              <div className="border border-border bg-background p-8 md:p-12 h-full flex flex-col">
                <div className="flex items-center justify-between border-b border-border pb-6 mb-8">
                  <h3 className="text-3xl font-medium tracking-tighter text-foreground">
                    Cash In
                  </h3>
                  <CreditCard className="h-6 w-6 text-muted-foreground" />
                </div>

                <form onSubmit={handleCashIn} className="flex flex-col flex-1">
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
                        value={cashInAmount}
                        onBlur={handleAmountBlur}
                        onChange={(e) => { setCashInAmount(e.target.value); setAmountError(null); }}
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
                    {[100, 200, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleQuickAmount(amt)}
                        className="h-14 border border-border font-bold text-lg hover:bg-foreground hover:text-background transition-colors"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4 mb-10">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Funding Source
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(["GCASH", "MAYA", "QRPH"] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`h-16 font-bold uppercase tracking-widest text-sm transition-colors border ${
                            paymentMethod === method
                              ? "bg-foreground text-background border-foreground"
                              : "border-border text-foreground hover:bg-secondary/10"
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto pt-8 border-t border-border">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-20 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isSubmitting ? "Initiating..." : "Proceed to Payment"}
                    </button>
                  </div>
                </form>
              </div>
            </Reveal>
          </div>

          {/* Activity Section */}
          <div className="flex flex-col">
            <Reveal>
              <div className="border border-border bg-background flex flex-col h-full min-h-[600px]">
                <div className="p-8 md:p-12 border-b border-border flex items-center justify-between">
                  <h3 className="text-3xl font-medium tracking-tighter text-foreground">
                    Activity
                  </h3>
                  <History className="h-6 w-6 text-muted-foreground" />
                </div>

                <div className="flex-1 overflow-y-auto p-8 md:p-12">
                  {transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-6 py-20">
                      <AlertCircle className="h-12 w-12 text-border" />
                      <div>
                        <p className="text-3xl font-medium tracking-tighter text-foreground mb-2">No history</p>
                        <p className="text-lg">Your cash-ins and payments will appear here.</p>
                      </div>
                    </div>
                  ) : (
                    <Stagger className="space-y-2">
                      {transactions.map((tx) => {
                        const isCredit = Number(tx.amount) > 0;
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
                                    {tx.type === "cash_in" ? "Cash In" : "Order Payment"}
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
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}
