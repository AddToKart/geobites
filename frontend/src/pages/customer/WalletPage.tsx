import { useState, useEffect } from "react";
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  History, 
  Sparkles, 
  CreditCard,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/utils/helpers";
import { getWallet, getTransactions, initiateCashIn, WalletTransaction } from "@/services/walletService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";

export function WalletPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
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
  const [isLoading, setIsLoading] = useState(true);

  const fetchWalletData = async () => {
    try {
      const wallet = await getWallet();
      setBalance(Number(wallet.balance));
      const txHistory = await getTransactions();
      setTransactions(txHistory);
    } catch (error) {
      console.error("Error fetching wallet info:", error);
      toast.error("Failed to load wallet details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

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
      // Redirect to the mock payment checkout URL
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
      <div className="page-stack max-w-5xl mx-auto py-6">
        <Skeleton className="h-6 w-56 rounded-full" />
        <Skeleton className="h-10 w-72 rounded-full mt-2" />
        <Skeleton className="h-5 w-96 rounded-full mt-2" />
        <div className="grid gap-8 md:grid-cols-12 mt-8">
          <div className="md:col-span-7 space-y-6">
            <Skeleton className="h-64 rounded-[32px]" />
            <Skeleton className="h-80 rounded-[32px]" />
          </div>
          <div className="md:col-span-5">
            <Skeleton className="h-96 rounded-[32px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack max-w-5xl mx-auto py-6">
      <Reveal>
        <div className="mb-8">
          <p className="eyebrow flex items-center gap-1.5 text-primary font-bold uppercase tracking-wider text-xs">
            <Sparkles className="w-3.5 h-3.5" /> Direct Payment System
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground mt-1">
            GeoPay Wallet
          </h1>
          <p className="subtle-copy text-text-muted font-medium mt-1">
            Cash in using GCash, Maya, or QRPH, and complete orders instantly without redirects.
          </p>
        </div>
      </Reveal>

      <div className="grid gap-8 md:grid-cols-12">
        {/* Left Side: Card + Cash In */}
        <div className="md:col-span-7 space-y-6">
          {/* Glassmorphic Visa Card */}
          <Reveal>
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-tr from-[#1e1e24] via-[#2d2d38] to-[#121214] p-8 text-white shadow-2xl border border-border">
              {/* Background Glow Accents */}
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-[80px]" />
              <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-success-soft blur-[80px]" />

              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Digital BiteWallet
                  </span>
                  <h2 className="text-2xl font-black tracking-tight mt-1 flex items-center gap-2">
                    <Wallet className="h-6 w-6 text-primary" /> GeoPay
                  </h2>
                </div>
                <CreditCard className="h-10 w-10 text-text-muted/70" />
              </div>

              <div className="mt-14">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Available Balance</span>
                <div className="text-4xl md:text-5xl font-black tracking-tight mt-1">
                  {formatCurrency(balance ?? 0)}
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6 text-xs text-text-muted">
                <div>
                  <p className="font-semibold uppercase text-text-muted">Account Holder</p>
                  <p className="font-bold text-white mt-1 text-sm">{user?.name || "Geobites Member"}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold uppercase text-text-muted">System Status</p>
                  <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-extrabold text-success">
                    ● Active
                  </span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Cash In Panel */}
          <Reveal>
            <Card className="rounded-[32px] border border-border shadow-[var(--shadow-panel)] overflow-hidden">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold tracking-tight text-foreground mb-6">
                  Cash In Funds
                </h3>

                <form onSubmit={handleCashIn} className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted pl-1">
                      Enter Amount (PHP)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-text-muted">
                        ₱
                      </span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={cashInAmount}
                        onBlur={handleAmountBlur}
                        onChange={(e) => { setCashInAmount(e.target.value); setAmountError(null); }}
                        className={`pl-10 h-14 rounded-[20px] text-xl font-black border-border focus:ring-2 focus:ring-primary/30 ${amountError ? 'ring-2 ring-danger/40' : ''}`}
                        aria-invalid={Boolean(amountError)}
                        aria-describedby={amountError ? 'amount-error' : undefined}
                        min="1"
                        max="50000"
                        required
                      />
                      {amountError ? <p id="amount-error" className="text-xs font-semibold text-danger mt-1.5">{amountError}</p> : null}
                    </div>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    {[100, 200, 500, 1000].map((amt) => (
                      <Button
                        key={amt}
                        type="button"
                        variant="outline"
                        onClick={() => handleQuickAmount(amt)}
                        className="rounded-[16px] h-10 font-bold border-border hover:bg-accent"
                      >
                        +{amt}
                      </Button>
                    ))}
                  </div>

                  {/* Fund Source */}
                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted pl-1">
                      Fund Source Gateway
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["GCASH", "MAYA", "QRPH"] as const).map((method) => (
                        <Button
                          key={method}
                          type="button"
                          variant={paymentMethod === method ? "default" : "outline"}
                          onClick={() => setPaymentMethod(method)}
                          className={`rounded-[16px] h-12 font-bold transition-all ${
                            paymentMethod === method
                              ? "bg-foreground text-background hover:bg-foreground/90"
                              : "border-border text-text-soft hover:bg-muted shadow-sm"
                          }`}
                        >
                          {method}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 rounded-[20px] text-lg font-bold bg-primary hover:bg-primary-dark text-primary-foreground shadow-glow transition-all mt-4"
                  >
                    {isSubmitting ? "Initiating Deposit..." : "Proceed to Cash In"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </Reveal>
        </div>

        {/* Right Side: Transactions */}
        <div className="md:col-span-5">
          <Reveal>
            <Card className="rounded-[32px] border border-border shadow-[var(--shadow-panel)] h-full overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                  <History className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-bold tracking-tight text-foreground">
                    Activity History
                  </h3>
                </div>

                {transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-text-muted gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-text-muted" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">No activity yet</p>
                      <p className="text-xs font-medium mt-1">Funds cashing in and order payments will display here.</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full font-semibold"
                      onClick={() => {
                        document.querySelector<HTMLInputElement>('input[type="number"]')?.focus();
                      }}
                    >
                      <Sparkles className="h-4 w-4 mr-1.5" />
                      Cash in now
                    </Button>
                  </div>
                ) : (
                  <Stagger className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {transactions.map((tx) => {
                      const isCredit = Number(tx.amount) > 0;
                      return (
                        <StaggerItem key={tx.id}>
                          <div className="flex items-center justify-between p-3.5 rounded-[20px] bg-muted border border-border transition-all hover:bg-accent">
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                isCredit 
                                  ? "bg-success-soft text-success" 
                                  : "bg-primary-soft text-primary"
                              }`}>
                                {isCredit ? (
                                  <ArrowDownLeft className="h-5 w-5" />
                                ) : (
                                  <ArrowUpRight className="h-5 w-5" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-foreground capitalize">
                                  {tx.type === "cash_in" ? "Cash In" : "Order Payment"}
                                </p>
                                <span className="text-[10px] font-semibold text-text-muted uppercase">
                                  {new Date(tx.createdAt).toLocaleDateString("en-PH", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-base font-black ${
                                isCredit ? "text-success" : "text-foreground"
                              }`}>
                                {isCredit ? "+" : ""}{formatCurrency(tx.amount)}
                              </span>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mt-0.5">
                                {tx.paymentMethod || "GEOPAY"}
                              </p>
                            </div>
                          </div>
                        </StaggerItem>
                      );
                    })}
                  </Stagger>
                )}
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
